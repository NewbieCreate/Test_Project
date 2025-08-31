"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Stage as StageType } from "konva/lib/Stage";
import type { Layer as KonvaLayerType } from "konva/lib/Layer";
import type { Node } from "konva/lib/Node";
import type { Transformer as KonvaTransformerType } from "konva/lib/shapes/Transformer";

// CanvasComponent를 SSR 없이 동적 임포트
const CanvasComponent = dynamic(() => import("./CanvasComponent"), {
  ssr: false,
});

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

// Konva 이벤트 타입
interface ExtendedKonvaEvent {
  target: { getStage: () => StageType | null };
  evt: MouseEvent;
}

const WhiteBoard: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [lines, setLines] = useState<Lines[][]>([]);
  const [currentLine, setCurrentLine] = useState<Lines[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);

  const [mode, setMode] = useState<"pen" | "eraser" | "select">("pen");
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const [currentStroke, setCurrentStroke] = useState("#000000");
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(5);

  const layerRef = useRef<KonvaLayerType | null>(null);
  const transformerRef = useRef<KonvaTransformerType | null>(null);

  useEffect(() => setIsClient(true), []);

  // Shape 선택 이벤트
  const handleShapeClick = useCallback(
    (e: ExtendedKonvaEvent, shapeId: string) => {
      if (e.evt.shiftKey || e.evt.ctrlKey) {
        // Shift/Ctrl + 클릭: 다중 선택
        setSelectedShapeIds((prev) =>
          prev.includes(shapeId)
            ? prev.filter((id) => id !== shapeId)
            : [...prev, shapeId]
        );
      } else {
        // 일반 클릭: 단일 선택
        setSelectedShapeIds([shapeId]);
      }
    },
    []
  );

  // 선택 박스로 도형 선택
  const selectShapesInBox = useCallback(
    (box: SelectionBox) => {
      const selectedIds: string[] = [];

      shapes.forEach((shape) => {
        const shapeLeft = shape.x;
        const shapeRight = shape.x + (shape.width || shape.radius || 0);
        const shapeTop = shape.y;
        const shapeBottom = shape.y + (shape.height || shape.radius || 0);

        const boxLeft = Math.min(box.startX, box.endX);
        const boxRight = Math.max(box.startX, box.endX);
        const boxTop = Math.min(box.startY, box.endY);
        const boxBottom = Math.max(box.startY, box.endY);

        // 도형이 선택 박스와 겹치는지 확인
        if (
          shapeLeft < boxRight &&
          shapeRight > boxLeft &&
          shapeTop < boxBottom &&
          shapeBottom > boxTop
        ) {
          selectedIds.push(shape.id);
        }
      });

      setSelectedShapeIds(selectedIds);
    },
    [shapes]
  );

  // 선택 박스 시작
  const handleSelectionStart = useCallback(
    (x: number, y: number) => {
      if (mode === "select") {
        setIsSelecting(true);
        setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
      }
    },
    [mode]
  );

  // 선택 박스 업데이트
  const handleSelectionMove = useCallback(
    (x: number, y: number) => {
      if (isSelecting && selectionBox) {
        setSelectionBox((prev) =>
          prev ? { ...prev, endX: x, endY: y } : null
        );
      }
    },
    [isSelecting, selectionBox]
  );

  // 선택 박스 완료
  const handleSelectionEnd = useCallback(() => {
    if (isSelecting && selectionBox) {
      selectShapesInBox(selectionBox);
      setIsSelecting(false);
      setSelectionBox(null);
    }
  }, [isSelecting, selectionBox, selectShapesInBox]);

  // Transformer 갱신
  useEffect(() => {
    if (!layerRef.current || !transformerRef.current) return;

    const nodes: Node[] = shapes
      .filter((s) => selectedShapeIds.includes(s.id))
      .map((s) => layerRef.current!.findOne(`#${s.id}`)!);

    transformerRef.current.nodes(nodes);
    layerRef.current.batchDraw();
  }, [selectedShapeIds, shapes]);

  // 마우스 이벤트 (펜/지우개)
  const handleMouseDown = useCallback(
    (e: ExtendedKonvaEvent) => {
      if (mode !== "pen" && mode !== "eraser") return;
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;

      const point: Lines = {
        x: pos.x,
        y: pos.y,
        stroke: currentStroke,
        strokeWidth: currentStrokeWidth,
        mode,
      };
      setCurrentLine([point]);
    },
    [mode, currentStroke, currentStrokeWidth]
  );

  // 도형 드래그 완료 시 위치 업데이트
  const handleShapeDragEnd = useCallback(
    (shapeId: string, x: number, y: number) => {
      setShapes((prev) =>
        prev.map((shape) => (shape.id === shapeId ? { ...shape, x, y } : shape))
      );
    },
    []
  );

  // 도형 변환 완료 시 속성 업데이트
  const handleShapeTransformEnd = useCallback(
    (
      shapeId: string,
      x: number,
      y: number,
      width: number,
      height: number,
      rotation: number
    ) => {
      setShapes((prev) =>
        prev.map((shape) => {
          if (shape.id === shapeId) {
            return {
              ...shape,
              x,
              y,
              width: shape.type === "rectangle" ? width : shape.width,
              height: shape.type === "rectangle" ? height : shape.height,
              radius:
                shape.type !== "rectangle"
                  ? Math.max(width, height) / 2
                  : shape.radius,
              rotation,
            };
          }
          return shape;
        })
      );
    },
    []
  );

  // 캔버스 클릭 시 선택 해제
  const handleCanvasClick = useCallback(() => {
    if (mode === "select") {
      setSelectedShapeIds([]);
    }
  }, [mode]);

  const handleMouseMove = useCallback(
    (e: ExtendedKonvaEvent) => {
      if (mode !== "pen" && mode !== "eraser") return;
      const stage = e.target.getStage();
      if (!stage || currentLine.length === 0) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;

      const point: Lines = {
        x: pos.x,
        y: pos.y,
        stroke: currentStroke,
        strokeWidth: currentStrokeWidth,
        mode,
      };
      setCurrentLine((prev) => [...prev, point]);
    },
    [mode, currentStroke, currentStrokeWidth, currentLine]
  );

  const handleMouseUp = useCallback(() => {
    if (currentLine.length === 0) return;
    setLines((prev) => [...prev, currentLine]);
    setCurrentLine([]);
  }, [currentLine]);

  // 캔버스 클리어
  const clearCanvas = useCallback(() => {
    setLines([]);
    setCurrentLine([]);
    setShapes([]);
    setSelectedShapeIds([]);
  }, []);

  // 도형 추가
  const addShape = useCallback(
    (type: Shape["type"]) => {
      const newShape: Shape = {
        id: `shape-${Date.now()}`,
        type,
        x: 100,
        y: 100,
        width: type === "rectangle" ? 100 : undefined,
        height: type === "rectangle" ? 100 : undefined,
        radius:
          type === "circle" || type === "triangle" || type === "star"
            ? 50
            : undefined,
        fill: currentStroke,
        stroke: "#000000",
        strokeWidth: 2,
        draggable: true,
      };
      setShapes((prev) => [...prev, newShape]);
    },
    [currentStroke]
  );

  // 선택된 도형 삭제
  const deleteSelectedShapes = useCallback(() => {
    setShapes((prev) =>
      prev.filter((shape) => !selectedShapeIds.includes(shape.id))
    );
    setSelectedShapeIds([]);
  }, [selectedShapeIds]);

  // 모드 변경
  const handleModeChange = useCallback((newMode: string) => {
    setMode(newMode as "pen" | "eraser" | "select");
    if (newMode === "select") {
      setSelectedShapeIds([]);
    }
  }, []);

  if (!isClient)
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">캔버스 준비 중...</div>
      </div>
    );

  return (
    <div className="w-full h-screen relative">
      {/* 툴바 */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 flex gap-2 flex-wrap">
        <button
          onClick={() => handleModeChange("pen")}
          className={`px-4 py-2 rounded ${
            mode === "pen" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          펜
        </button>
        <button
          onClick={() => handleModeChange("eraser")}
          className={`px-4 py-2 rounded ${
            mode === "eraser" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          지우개
        </button>
        <button
          onClick={() => handleModeChange("select")}
          className={`px-4 py-2 rounded ${
            mode === "select" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          선택
        </button>
        <button
          onClick={clearCanvas}
          className="px-4 py-2 rounded bg-red-500 text-white"
        >
          전체 지우기
        </button>

        {/* 선택된 도형 삭제 */}
        {selectedShapeIds.length > 0 && (
          <button
            onClick={deleteSelectedShapes}
            className="px-4 py-2 rounded bg-orange-500 text-white"
          >
            선택 삭제 ({selectedShapeIds.length})
          </button>
        )}

        {/* 색상 선택 */}
        <div className="flex gap-1 items-center">
          <span className="text-sm text-gray-600 mr-2">색상:</span>
          {[
            "#000000",
            "#ff0000",
            "#00ff00",
            "#0000ff",
            "#ffff00",
            "#ff00ff",
            "#ff8800",
            "#8800ff",
          ].map((color) => (
            <button
              key={color}
              onClick={() => setCurrentStroke(color)}
              className={`w-6 h-6 rounded-full border-2 ${
                currentStroke === color ? "border-gray-800" : "border-gray-300"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* 선 두께 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">두께:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={currentStrokeWidth}
            onChange={(e) => setCurrentStrokeWidth(Number(e.target.value))}
            className="w-16"
          />
          <span className="text-sm text-gray-600 w-8">
            {currentStrokeWidth}px
          </span>
        </div>

        {/* 도형 추가 */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-gray-700">도형</span>
          <div className="flex gap-1">
            {(["rectangle", "circle", "triangle", "star"] as const).map(
              (shape) => (
                <button
                  key={shape}
                  onClick={() => addShape(shape)}
                  className="px-3 py-2 rounded text-sm bg-gray-200 hover:bg-gray-300"
                >
                  {shape === "rectangle"
                    ? "□"
                    : shape === "circle"
                    ? "○"
                    : shape === "triangle"
                    ? "△"
                    : "★"}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* 캔버스 */}
      <CanvasComponent
        lines={lines}
        currentLine={currentLine}
        shapes={shapes}
        mode={mode}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        onShapeClick={handleShapeClick}
        selectedShapeIds={selectedShapeIds}
        onShapeDragEnd={handleShapeDragEnd}
        onShapeTransformEnd={handleShapeTransformEnd}
        onCanvasClick={handleCanvasClick}
        onSelectionStart={handleSelectionStart}
        onSelectionMove={handleSelectionMove}
        onSelectionEnd={handleSelectionEnd}
        selectionBox={selectionBox}
      />
    </div>
  );
};

export default WhiteBoard;
