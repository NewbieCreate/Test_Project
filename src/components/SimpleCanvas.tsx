"use client";

import React, { useRef, useEffect, useState } from "react";
import Konva from "konva";
import {
  Point,
  Shape,
  SelectionBox,
  Tool,
} from "@/components/WhiteBoard/hooks/useSimpleWhiteboard";

interface SimpleCanvasProps {
  lines: Point[][];
  currentLine: Point[];
  shapes: Shape[];
  selectedShapeIds: string[];
  selectedLineIds: string[];
  selectionBox: SelectionBox | null;
  tool: Tool;
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseUp: () => void;
  onShapeClick: (shapeId: string) => void;
  onLineClick: (lineIndex: number) => void;
}

const SimpleCanvas: React.FC<SimpleCanvasProps> = ({
  lines,
  currentLine,
  shapes,
  selectedShapeIds,
  selectedLineIds,
  selectionBox,
  tool,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onShapeClick,
  onLineClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Konva Stage 초기화
  useEffect(() => {
    setIsClient(true);
    if (!containerRef.current) return;

    const stage = new Konva.Stage({
      container: containerRef.current,
      width: 800,
      height: 600,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    stageRef.current = stage;
    layerRef.current = layer;

    return () => {
      stage.destroy();
    };
  }, []);

  // 이벤트 바인딩
  useEffect(() => {
    if (!stageRef.current || !isClient) return;

    const stage = stageRef.current;

    stage.on("mousedown", onMouseDown);
    stage.on("mousemove", onMouseMove);
    stage.on("mouseup", onMouseUp);

    return () => {
      stage.off("mousedown");
      stage.off("mousemove");
      stage.off("mouseup");
    };
  }, [isClient, onMouseDown, onMouseMove, onMouseUp]);

  // 라인 렌더링
  useEffect(() => {
    if (!layerRef.current || !isClient) return;

    // 기존 라인 제거
    const existingLines = layerRef.current.find(".line");
    existingLines.forEach((line) => line.destroy());

    // 완성된 라인들 그리기
    lines.forEach((line, lineIndex) => {
      if (line.length < 2) return;

      const konvaLine = new Konva.Line({
        name: "line",
        points: line.flatMap((p) => [p.x, p.y]),
        stroke: line[0].stroke,
        strokeWidth: line[0].strokeWidth,
        tension: 0.5,
        lineCap: "round",
        lineJoin: "round",
        globalCompositeOperation:
          line[0].mode === "eraser" ? "destination-out" : "source-over",
      });

      // 선택 상태에 따른 스타일
      if (selectedLineIds.includes(`line-${lineIndex}`)) {
        konvaLine.stroke("#2196f3");
        konvaLine.strokeWidth(line[0].strokeWidth + 2);
      }

      // 클릭 이벤트
      konvaLine.on("click", () => onLineClick(lineIndex));

      layerRef.current!.add(konvaLine);
    });

    // 현재 그리는 라인
    if (currentLine.length > 0) {
      const currentKonvaLine = new Konva.Line({
        name: "current-line",
        points: currentLine.flatMap((p) => [p.x, p.y]),
        stroke: currentLine[0].stroke,
        strokeWidth: currentLine[0].strokeWidth,
        tension: 0.5,
        lineCap: "round",
        lineJoin: "round",
        globalCompositeOperation:
          currentLine[0].mode === "eraser" ? "destination-out" : "source-over",
      });

      layerRef.current!.add(currentKonvaLine);
    }

    layerRef.current.batchDraw();
  }, [lines, currentLine, selectedLineIds, isClient, onLineClick]);

  // 도형 렌더링
  useEffect(() => {
    if (!layerRef.current || !isClient) return;

    // 기존 도형 제거
    const existingShapes = layerRef.current.find(".shape");
    existingShapes.forEach((shape) => shape.destroy());

    shapes.forEach((shape) => {
      let konvaShape: Konva.Shape | null = null;

      switch (shape.type) {
        case "rectangle":
          konvaShape = new Konva.Rect({
            name: "shape",
            id: shape.id,
            x: shape.x,
            y: shape.y,
            width: shape.width || 100,
            height: shape.height || 100,
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
            radius: shape.radius || 50,
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
            radius: shape.radius || 50,
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
            innerRadius: (shape.radius || 50) * 0.5,
            outerRadius: shape.radius || 50,
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
        konvaShape.on("click", () => onShapeClick(shape.id));
        layerRef.current!.add(konvaShape);
      }
    });

    layerRef.current.batchDraw();
  }, [shapes, selectedShapeIds, isClient, onShapeClick]);

  // 선택 박스 렌더링
  useEffect(() => {
    if (!layerRef.current || !isClient) return;

    const existingBoxes = layerRef.current.find(".selection-box");
    existingBoxes.forEach((box) => box.destroy());

    if (selectionBox) {
      const x = Math.min(selectionBox.startX, selectionBox.endX);
      const y = Math.min(selectionBox.startY, selectionBox.endY);
      const width = Math.abs(selectionBox.endX - selectionBox.startX);
      const height = Math.abs(selectionBox.endY - selectionBox.startY);

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

        layerRef.current!.add(selectionRect);
      }
    }

    layerRef.current.batchDraw();
  }, [selectionBox, isClient]);

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-gray-500">캔버스 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[600px]">
      <div
        ref={containerRef}
        className="border border-gray-300 rounded-lg shadow-lg mx-auto bg-white"
        style={{
          width: 800,
          height: 600,
          cursor:
            tool === "pen"
              ? "crosshair"
              : tool === "eraser"
              ? "grab"
              : "default",
        }}
      />
    </div>
  );
};

export default SimpleCanvas;
