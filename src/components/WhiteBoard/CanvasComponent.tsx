//CanvasComponent.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import Konva from "konva";

// Shape 타입
interface Shape {
  id: string;
  type: "rectangle" | "circle" | "triangle" | "star" | "arrow";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
  draggable?: boolean;
}

// Lines 타입
interface Lines {
  x: number;
  y: number;
  stroke: string;
  strokeWidth: number;
  mode: string;
}

// 선택 박스 타입
interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface CanvasComponentProps {
  lines: Lines[][];
  currentLine: Lines[];
  shapes: Shape[];
  selectedShapeIds: string[];
  selectedLineIds: string[];
  selectionBox: SelectionBox | null;
  tool: "pen" | "eraser" | "select";
  brushColor: string;
  brushSize: number;
  pdfPages: HTMLImageElement[];
  currentPage: number;
  pdfOffset: { x: number; y: number };
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseUp: () => void;
  onShapeClick: (
    shapeId: string,
    e: Konva.KonvaEventObject<MouseEvent>
  ) => void;
  onLineClick: (lineId: string, e: Konva.KonvaEventObject<MouseEvent>) => void;
  onShapeDragEnd: (shapeId: string, x: number, y: number) => void;
  onShapeTransformEnd: (
    shapeId: string,
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number
  ) => void;
  onSelectionBoxChange: (box: SelectionBox | null) => void;
  onPdfImageChange: (image: HTMLImageElement | null) => void;
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({
  lines,
  currentLine,
  shapes,
  selectedShapeIds,
  selectedLineIds,
  selectionBox,
  tool,
  pdfPages,
  currentPage,
  pdfOffset,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onShapeClick,
  onLineClick,
  onShapeDragEnd,
  onShapeTransformEnd,
  onPdfImageChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Konva Stage 초기화
  useEffect(() => {
    setIsClient(true);
    if (!containerRef.current) return;

    // 기존 Stage 제거
    if (stageRef.current) {
      stageRef.current.destroy();
    }

    const stage = new Konva.Stage({
      container: containerRef.current,
      width: window.innerWidth - 40,
      height: window.innerHeight - 120,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // Transformer 생성
    const transformer = new Konva.Transformer({
      rotateEnabled: true,
      resizeEnabled: true,
      keepRatio: false,
      boundBoxFunc: (oldBox, newBox) => {
        if (newBox.width < 20 || newBox.height < 20) {
          return oldBox;
        }
        return newBox;
      },
    });
    layer.add(transformer);

    stageRef.current = stage;
    layerRef.current = layer;
    transformerRef.current = transformer;

    // 리사이즈 이벤트
    const handleResize = () => {
      stage.width(window.innerWidth - 40);
      stage.height(window.innerHeight - 120);
      stage.batchDraw();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      stage.destroy();
    };
  }, []);

  // 라인 렌더링
  useEffect(() => {
    if (!layerRef.current || !isClient) return;

    // 기존 라인 제거
    layerRef.current.find(".drawing-line").forEach((line) => line.destroy());
    layerRef.current.find(".current-line").forEach((line) => line.destroy());

    // 완성된 선 그리기
    lines.forEach((line, lineIndex) => {
      if (line.length === 0) return;

      // 고정된 ID 생성 (인덱스 기반)
      const lineId = `line-${lineIndex}`;

      const konvaLine = new Konva.Line({
        name: "drawing-line",
        id: lineId,
        points: line.flatMap((p) => [p.x, p.y]),
        stroke: line[0]?.stroke || "#000000",
        strokeWidth: line[0]?.strokeWidth || 5,
        tension: 0.5,
        lineCap: "round",
        lineJoin: "round",
        globalCompositeOperation:
          line[0]?.mode === "eraser" ? "destination-out" : "source-over",
        draggable: tool === "select" && selectedLineIds.includes(lineId), // 선택된 선만 드래그 가능
      });

      // 선택된 선 스타일 적용
      if (selectedLineIds.includes(lineId)) {
        konvaLine.stroke("#2196f3");
        konvaLine.strokeWidth((line[0]?.strokeWidth || 5) + 2);
      }

      // 선 클릭 이벤트 추가
      konvaLine.on("click", (e) => {
        e.cancelBubble = true;
        console.log("Line clicked:", konvaLine.id());
        onLineClick(konvaLine.id(), e);
      });

      // 선 드래그 완료 이벤트
      konvaLine.on("dragend", () => {
        console.log("Line dragged to:", konvaLine.x(), konvaLine.y());
        // 드래그 후 위치 초기화 (선택 모드에서만)
        if (tool === "select") {
          konvaLine.x(0);
          konvaLine.y(0);
        }
      });

      // 선 변환 완료 이벤트 (리사이즈, 회전)
      konvaLine.on("transformend", () => {
        console.log("Line transformed:", konvaLine.id());
        // 여기서 선 변환 정보를 업데이트할 수 있습니다
      });

      layerRef.current!.add(konvaLine);
    });

    // 현재 그리는 라인 그리기
    if (currentLine.length > 0) {
      const points = currentLine.flatMap((p) => [p.x, p.y]);

      // 현재 선용 고정 ID
      const currentLineId = "current-line";

      const currentKonvaLine = new Konva.Line({
        name: "current-line",
        id: currentLineId,
        points,
        stroke: currentLine[0]?.stroke || "#000000",
        strokeWidth: currentLine[0]?.strokeWidth || 5,
        tension: 0.5,
        lineCap: "round",
        lineJoin: "round",
        globalCompositeOperation:
          currentLine[0]?.mode === "eraser" ? "destination-out" : "source-over",
        draggable: tool === "select" && selectedLineIds.includes(currentLineId), // 선택된 선만 드래그 가능
      });

      // 현재 선 선택 상태 확인 및 스타일 적용
      const isCurrentLineSelected = selectedLineIds.includes(currentLineId);
      if (isCurrentLineSelected) {
        currentKonvaLine.stroke("#2196f3");
        currentKonvaLine.strokeWidth((currentLine[0]?.strokeWidth || 5) + 2);
      }

      // 현재 선 이벤트
      currentKonvaLine.on("click", (e) => {
        e.cancelBubble = true;
        onLineClick(currentLineId, e);
      });

      // 현재 선 드래그 완료 이벤트
      currentKonvaLine.on("dragend", () => {
        console.log(
          "Current line dragged:",
          currentKonvaLine.x(),
          currentKonvaLine.y()
        );
        // 드래그 후 위치 초기화 (선택 모드에서만)
        if (tool === "select") {
          currentKonvaLine.x(0);
          currentKonvaLine.y(0);
        }
      });

      currentKonvaLine.on("transformend", () => {
        console.log("Current line transformed:", currentKonvaLine.id());
      });

      layerRef.current!.add(currentKonvaLine);
    }

    layerRef.current.batchDraw();
  }, [lines, currentLine, selectedLineIds, isClient, onLineClick, tool]);

  // Stage 이벤트 핸들러
  useEffect(() => {
    if (!stageRef.current) return;

    const stage = stageRef.current;

    // Stage에 모든 마우스 이벤트 바인딩
    stage.on("mousedown", (e) => {
      console.log("Stage mousedown event:", {
        target: e.target.name(),
        tool,
        pos: stage.getPointerPosition(),
      });
      onMouseDown(e);
    });

    stage.on("mousemove", (e) => {
      console.log("Stage mousemove event:", {
        target: e.target.name(),
        tool,
        pos: stage.getPointerPosition(),
      });
      onMouseMove(e);
    });

    stage.on("mouseup", () => {
      console.log("Stage mouseup event:", { tool });
      onMouseUp();
    });

    return () => {
      stage.off("mousedown");
      stage.off("mousemove");
      stage.off("mouseup");
    };
  }, [onMouseDown, onMouseMove, onMouseUp, tool]);

  // 도형 렌더링
  useEffect(() => {
    if (!layerRef.current || !isClient) return;

    // 기존 도형 제거
    layerRef.current.find(".shape").forEach((shape) => shape.destroy());

    shapes.forEach((shape) => {
      let konvaShape: Konva.Shape | null = null;

      switch (shape.type) {
        case "rectangle":
          konvaShape = new Konva.Rect({
            name: "shape",
            id: shape.id,
            x: shape.x,
            y: shape.y,
            width: shape.width ?? 100,
            height: shape.height ?? 100,
            fill: selectedShapeIds.includes(shape.id) ? "#e3f2fd" : shape.fill,
            stroke: selectedShapeIds.includes(shape.id)
              ? "#2196f3"
              : shape.stroke,
            strokeWidth: selectedShapeIds.includes(shape.id)
              ? 3
              : shape.strokeWidth,
            rotation: shape.rotation,
          });
          break;
        case "circle":
          konvaShape = new Konva.Circle({
            name: "shape",
            id: shape.id,
            x: shape.x,
            y: shape.y,
            radius: shape.radius ?? 50,
            fill: selectedShapeIds.includes(shape.id) ? "#e3f2fd" : shape.fill,
            stroke: selectedShapeIds.includes(shape.id)
              ? "#2196f3"
              : shape.stroke,
            strokeWidth: selectedShapeIds.includes(shape.id)
              ? 3
              : shape.strokeWidth,
            rotation: shape.rotation,
          });
          break;
        case "triangle":
          konvaShape = new Konva.RegularPolygon({
            name: "shape",
            id: shape.id,
            x: shape.x,
            y: shape.y,
            sides: 3,
            radius: shape.radius ?? 50,
            fill: selectedShapeIds.includes(shape.id) ? "#e3f2fd" : shape.fill,
            stroke: selectedShapeIds.includes(shape.id)
              ? "#2196f3"
              : shape.stroke,
            strokeWidth: selectedShapeIds.includes(shape.id)
              ? 3
              : shape.strokeWidth,
            rotation: shape.rotation,
          });
          break;
        case "star":
          konvaShape = new Konva.Star({
            name: "shape",
            id: shape.id,
            x: shape.x,
            y: shape.y,
            numPoints: 5,
            innerRadius: (shape.radius ?? 50) * 0.5,
            outerRadius: shape.radius ?? 50,
            fill: selectedShapeIds.includes(shape.id) ? "#e3f2fd" : shape.fill,
            stroke: selectedShapeIds.includes(shape.id)
              ? "#2196f3"
              : shape.stroke,
            strokeWidth: selectedShapeIds.includes(shape.id)
              ? 3
              : shape.strokeWidth,
            rotation: shape.rotation,
          });
          break;
      }

      if (konvaShape) {
        // 도형 클릭 이벤트
        konvaShape.on("click", (e) => {
          e.cancelBubble = true; // 이벤트 버블링 방지
          console.log("Shape clicked in Canvas:", shape.id);
          onShapeClick(shape.id, e);
        });

        // 도형 변환 완료 이벤트 (리사이즈, 회전)
        konvaShape.on("transformend", () => {
          onShapeTransformEnd(
            shape.id,
            konvaShape.x(),
            konvaShape.y(),
            konvaShape.width() * konvaShape.scaleX(),
            konvaShape.height() * konvaShape.scaleY(),
            konvaShape.rotation()
          );
        });

        // 선택 모드에서만 드래그 가능하게 설정
        konvaShape.draggable(tool === "select");

        // 도형 드래그 완료 이벤트
        konvaShape.on("dragend", () => {
          onShapeDragEnd(shape.id, konvaShape.x(), konvaShape.y());
        });

        layerRef.current!.add(konvaShape);
      }
    });

    layerRef.current.batchDraw();
  }, [
    shapes,
    selectedShapeIds,
    tool,
    isClient,
    onShapeClick,
    onShapeTransformEnd,
    onShapeDragEnd,
  ]);

  // 선택된 도형들에 Transformer 연결
  useEffect(() => {
    if (!transformerRef.current || !layerRef.current) return;

    const selectedNodes = selectedShapeIds
      .map((id) => layerRef.current!.findOne(`#${id}`))
      .filter((node) => node !== undefined);

    // 선택된 선들도 Transformer에 추가
    const selectedLineNodes = selectedLineIds
      .map((id) => layerRef.current!.findOne(`#${id}`))
      .filter((node) => node !== undefined);

    const allSelectedNodes = [...selectedNodes, ...selectedLineNodes];

    console.log("Connecting transformer to nodes:", allSelectedNodes.length);
    transformerRef.current.nodes(allSelectedNodes);
    layerRef.current.batchDraw();
  }, [selectedShapeIds, selectedLineIds]);

  // 선택 모드일 때만 드래그 활성화
  useEffect(() => {
    if (!layerRef.current) return;

    // 모든 도형과 선의 드래그 상태 업데이트
    const allShapes = layerRef.current.find(".shape");
    const allLines = layerRef.current.find(".drawing-line");
    const currentLines = layerRef.current.find(".current-line");

    allShapes.forEach((shape) => {
      const isSelected = selectedShapeIds.includes(shape.id());
      shape.draggable(tool === "select" && isSelected);
    });

    allLines.forEach((line) => {
      const isSelected = selectedLineIds.includes(line.id());
      line.draggable(tool === "select" && isSelected);
    });

    // 현재 그리는 선도 드래그 상태 업데이트
    currentLines.forEach((line) => {
      const isSelected = selectedLineIds.includes(line.id());
      line.draggable(tool === "select" && isSelected);
    });

    console.log("Drag states updated:", {
      tool,
      selectedShapes: selectedShapeIds.length,
      selectedLines: selectedLineIds.length,
    });
  }, [tool, selectedShapeIds, selectedLineIds]);

  // 선택 박스 렌더링
  useEffect(() => {
    if (!layerRef.current || !isClient) return;

    // 기존 선택 박스 제거
    layerRef.current.find(".selection-box").forEach((box) => box.destroy());

    // 선택 박스가 있을 때만 렌더링
    if (selectionBox) {
      const x = Math.min(selectionBox.startX, selectionBox.endX);
      const y = Math.min(selectionBox.startY, selectionBox.endY);
      const width = Math.abs(selectionBox.endX - selectionBox.startX);
      const height = Math.abs(selectionBox.endY - selectionBox.startY);

      // 최소 크기 체크
      if (width > 5 && height > 5) {
        const selectionRect = new Konva.Rect({
          name: "selection-box",
          x,
          y,
          width,
          height,
          stroke: "#0096fd",
          strokeWidth: 1,
          dash: [5, 5],
          fill: "rgba(0, 150, 253, 0.1)",
        });

        layerRef.current.add(selectionRect);
        console.log("Selection box rendered:", { x, y, width, height });
      }
    }

    layerRef.current.batchDraw();
  }, [selectionBox, isClient]);

  // PDF 이미지 렌더링
  useEffect(() => {
    if (!layerRef.current || !isClient || pdfPages.length === 0) return;

    const currentPdfImage = pdfPages[currentPage];
    if (!currentPdfImage) return;

    // 기존 PDF 이미지 제거
    layerRef.current.find(".pdf-image").forEach((image) => image.destroy());

    const stage = stageRef.current;
    if (!stage) return;

    // 캔버스 크기에 맞게 이미지 스케일링
    const maxWidth = stage.width() * 0.8;
    const maxHeight = stage.height() * 0.8;

    const scale = Math.min(
      maxWidth / currentPdfImage.width,
      maxHeight / currentPdfImage.height
    );
    const scaledWidth = currentPdfImage.width * scale;
    const scaledHeight = currentPdfImage.height * scale;

    // 중앙 위치에 오프셋 적용
    const centerX = (stage.width() - scaledWidth) / 2;
    const centerY = (stage.height() - scaledHeight) / 2;
    const x = centerX + pdfOffset.x;
    const y = centerY + pdfOffset.y;

    // Konva Image 생성
    const konvaImage = new Konva.Image({
      name: "pdf-image",
      image: currentPdfImage,
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });

    // PDF 이미지를 맨 뒤로 보내기
    layerRef.current.add(konvaImage);
    konvaImage.moveToBottom();

    // PDF 이미지 정보 전달
    onPdfImageChange(currentPdfImage);

    layerRef.current.batchDraw();
  }, [pdfPages, currentPage, pdfOffset, isClient, onPdfImageChange]);

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-gray-500">캔버스 로딩 중...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="border border-gray-300 rounded-lg shadow-lg mx-auto bg-white"
      style={{
        width: window.innerWidth - 40,
        height: window.innerHeight - 120,
      }}
    />
  );
};

export default CanvasComponent;
