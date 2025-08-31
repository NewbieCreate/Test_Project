"use client";

import React, { useRef, useEffect, useState } from "react";
import Konva from "konva";
import type { Stage as StageType } from "konva/lib/Stage";
import type { Layer as KonvaLayerType } from "konva/lib/Layer";
import type { Line as KonvaLineType } from "konva/lib/shapes/Line";
import type { Rect as KonvaRectType } from "konva/lib/shapes/Rect";
import type { Circle as KonvaCircleType } from "konva/lib/shapes/Circle";
import type { RegularPolygon as KonvaPolygonType } from "konva/lib/shapes/RegularPolygon";
import type { Star as KonvaStarType } from "konva/lib/shapes/Star";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage } from "konva/lib/Stage";
import type { Node } from "konva/lib/Node";
import type { Transformer as KonvaTransformerType } from "konva/lib/shapes/Transformer";

// 타입 정의
interface Lines {
  x: number;
  y: number;
  stroke: string;
  strokeWidth: number;
  mode: string;
}

interface Shape {
  id: string;
  type:
    | "rectangle"
    | "circle"
    | "triangle"
    | "line"
    | "text"
    | "image"
    | "star"
    | "arrow";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  stroke: string;
  strokeWidth: number;
  fill: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  imageSrc?: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  draggable?: boolean;
}

interface ExtendedKonvaEvent
  extends Omit<KonvaEventObject<MouseEvent>, "target"> {
  target: {
    getStage: () => Stage | null;
  };
  currentTarget: Node;
  type: string;
  pointerId: number;
}

interface CanvasComponentProps {
  dimensions?: { width: number; height: number };
  lines?: Lines[][];
  currentLine?: Lines[];
  shapes?: Shape[];
  mode?: string;
  handleMouseDown?: (e: ExtendedKonvaEvent) => void;
  handleMouseMove?: (e: ExtendedKonvaEvent) => void;
  handleMouseUp?: () => void;
  onShapeClick?: (e: ExtendedKonvaEvent, shapeId: string) => void;
  selectedShapeIds?: string[];
  onShapeDragEnd?: (shapeId: string, x: number, y: number) => void;
  onShapeTransformEnd?: (
    shapeId: string,
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number
  ) => void;
  onCanvasClick?: () => void;
  onSelectionStart?: (x: number, y: number) => void;
  onSelectionMove?: (x: number, y: number) => void;
  onSelectionEnd?: () => void;
  selectionBox?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null;
}

const CanvasComponent: React.FC<CanvasComponentProps> = ({
  dimensions,
  lines = [],
  currentLine = [],
  shapes = [],
  mode = "pen",
  handleMouseDown = () => {},
  handleMouseMove = () => {},
  handleMouseUp = () => {},
  onShapeClick,
  selectedShapeIds = [],
  onShapeDragEnd,
  onShapeTransformEnd,
  onCanvasClick,
  onSelectionStart,
  onSelectionMove,
  onSelectionEnd,
  selectionBox,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<StageType | null>(null);
  const layerRef = useRef<KonvaLayerType | null>(null);
  const transformerRef = useRef<KonvaTransformerType | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 800,
    height: 600,
  });

  useEffect(() => {
    setIsClient(true);

    // dimensions가 제공되지 않으면 화면 전체 크기 사용
    if (!dimensions) {
      setCanvasDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    } else {
      setCanvasDimensions(dimensions);
    }
  }, [dimensions]);

  // Stage 초기화
  useEffect(() => {
    if (!containerRef.current || !isClient) return;

    if (stageRef.current) {
      stageRef.current.destroy();
    }

    const stage = new Konva.Stage({
      container: containerRef.current,
      width: canvasDimensions.width,
      height: canvasDimensions.height,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // Transformer 생성
    const transformer = new Konva.Transformer({
      rotateEnabled: true,
      resizeEnabled: true,
      keepRatio: false,
      boundBoxFunc: (oldBox, newBox) => {
        // 최소 크기 제한
        if (newBox.width < 20 || newBox.height < 20) {
          return oldBox;
        }
        return newBox;
      },
    });
    layer.add(transformer);

    stageRef.current = stage;
    layerRef.current = layer;

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const customEvent: ExtendedKonvaEvent = {
        ...e,
        target: { getStage: () => stage },
      };

      // 선택 모드에서 캔버스 클릭 시 선택 박스 시작
      if (mode === "select" && e.target === stage && onSelectionStart) {
        const pos = stage.getPointerPosition();
        if (pos) {
          onSelectionStart(pos.x, pos.y);
        }
      }

      handleMouseDown(customEvent);
    };

    const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const customEvent: ExtendedKonvaEvent = {
        ...e,
        target: { getStage: () => stage },
      };

      // 선택 모드에서 선택 박스 업데이트
      if (mode === "select" && onSelectionMove) {
        const pos = stage.getPointerPosition();
        if (pos) {
          onSelectionMove(pos.x, pos.y);
        }
      }

      handleMouseMove(customEvent);
    };

    const handleStageMouseUp = () => {
      // 선택 박스 완료
      if (mode === "select" && onSelectionEnd) {
        onSelectionEnd();
      }

      handleMouseUp();
    };

    stage.on("mousedown", handleStageMouseDown);
    stage.on("mousemove", handleStageMouseMove);
    stage.on("mouseup", handleStageMouseUp);

    const container = stage.container();
    if (container) {
      container.style.cursor = mode === "eraser" ? "crosshair" : "default";
    }

    return () => {
      stage.off("mousedown", handleStageMouseDown);
      stage.off("mousemove", handleStageMouseMove);
      stage.off("mouseup", handleStageMouseUp);
      stage.destroy();
    };
  }, [
    isClient,
    canvasDimensions,
    mode,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    onSelectionStart,
    onSelectionMove,
    onSelectionEnd,
  ]);

  // 라인 렌더링
  useEffect(() => {
    if (!layerRef.current || !isClient) return;

    layerRef.current.find(".drawing-line").forEach((line) => line.destroy());
    layerRef.current.find(".current-line").forEach((line) => line.destroy());

    lines.forEach((line) => {
      if (line.length === 0) return;
      const points = line.flatMap((p) => [p.x, p.y]);

      const konvaLine: KonvaLineType = new Konva.Line({
        name: "drawing-line",
        points,
        stroke: line[0]?.stroke || "#000000",
        strokeWidth: line[0]?.strokeWidth || 5,
        tension: 0.5,
        lineCap: "round",
        lineJoin: "round",
        globalCompositeOperation:
          line[0]?.mode === "eraser" ? "destination-out" : "source-over",
      });

      layerRef.current!.add(konvaLine);
    });

    if (currentLine.length > 0) {
      const points = currentLine.flatMap((p) => [p.x, p.y]);

      const currentKonvaLine: KonvaLineType = new Konva.Line({
        name: "current-line",
        points,
        stroke: currentLine[0]?.stroke || "#000000",
        strokeWidth: currentLine[0]?.strokeWidth || 5,
        tension: 0.5,
        lineCap: "round",
        lineJoin: "round",
        globalCompositeOperation:
          currentLine[0]?.mode === "eraser" ? "destination-out" : "source-over",
      });

      layerRef.current!.add(currentKonvaLine);
    }

    layerRef.current.batchDraw();
  }, [lines, currentLine, isClient]);

  // 도형 렌더링
  useEffect(() => {
    if (!layerRef.current || !isClient) return;

    layerRef.current.find(".shape").forEach((shape) => shape.destroy());

    shapes.forEach((shape) => {
      let konvaShape:
        | KonvaRectType
        | KonvaCircleType
        | KonvaPolygonType
        | KonvaStarType
        | null = null;

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
            draggable: shape.draggable,
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
            draggable: shape.draggable,
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
            draggable: shape.draggable,
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
            draggable: shape.draggable,
          });
          break;
      }

      if (konvaShape) {
        // 도형 클릭 이벤트 추가
        if (onShapeClick) {
          konvaShape.on("click", (e) => {
            const customEvent: ExtendedKonvaEvent = {
              ...e,
              target: { getStage: () => stageRef.current },
            };
            onShapeClick(customEvent, shape.id);
          });
        }

        // 도형 드래그 완료 이벤트 추가
        if (onShapeDragEnd) {
          konvaShape.on("dragend", () => {
            onShapeDragEnd(shape.id, konvaShape.x(), konvaShape.y());
          });
        }

        // 도형 변환 완료 이벤트 추가
        if (onShapeTransformEnd) {
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
        }

        layerRef.current!.add(konvaShape);
      }
    });

    layerRef.current.batchDraw();
  }, [
    shapes,
    isClient,
    selectedShapeIds,
    onShapeClick,
    onShapeDragEnd,
    onShapeTransformEnd,
  ]);

  // 선택된 도형들에 Transformer 연결
  useEffect(() => {
    if (!transformerRef.current || !layerRef.current) return;

    const selectedNodes = selectedShapeIds
      .map((id) => layerRef.current!.findOne(`#${id}`))
      .filter((node) => node !== undefined);

    transformerRef.current.nodes(selectedNodes);
    layerRef.current.batchDraw();
  }, [selectedShapeIds]);

  // 선택 박스 렌더링
  useEffect(() => {
    if (!layerRef.current || !isClient || !selectionBox) return;

    // 기존 선택 박스 제거
    layerRef.current.find(".selection-box").forEach((box) => box.destroy());

    // 새로운 선택 박스 생성
    const selectionRect = new Konva.Rect({
      name: "selection-box",
      x: Math.min(selectionBox.startX, selectionBox.endX),
      y: Math.min(selectionBox.startY, selectionBox.endY),
      width: Math.abs(selectionBox.endX - selectionBox.startX),
      height: Math.abs(selectionBox.endY - selectionBox.startY),
      stroke: "#0096fd",
      strokeWidth: 1,
      dash: [5, 5],
      fill: "rgba(0, 150, 253, 0.1)",
    });

    layerRef.current.add(selectionRect);
    layerRef.current.batchDraw();
  }, [selectionBox, isClient]);

  // 캔버스 클릭 이벤트 (선택 해제용)
  useEffect(() => {
    if (!stageRef.current || !onCanvasClick) return;

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // 도형이 클릭되지 않았을 때만 캔버스 클릭 이벤트 발생
      if (e.target === stageRef.current) {
        onCanvasClick();
      }
    };

    stageRef.current.on("click", handleStageClick);

    return () => {
      stageRef.current?.off("click", handleStageClick);
    };
  }, [onCanvasClick]);

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
      className="w-full h-full bg-white"
      style={{
        width: canvasDimensions.width,
        height: canvasDimensions.height,
        touchAction: "none",
      }}
    />
  );
};

export default CanvasComponent;
