"use client";

import { useState, useCallback } from "react";
import Konva from "konva";

export type Tool =
  | "pen"
  | "eraser"
  | "select"
  | "rectangle"
  | "circle"
  | "triangle"
  | "star";

export interface Point {
  x: number;
  y: number;
  stroke: string;
  strokeWidth: number;
  mode: Tool;
}

export interface Shape {
  id: string;
  type: "rectangle" | "circle" | "triangle" | "star";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation: number;
}

export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const useSimpleWhiteboard = () => {
  // 기본 상태
  const [tool, setTool] = useState<Tool>("pen");
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);

  // 데이터 상태
  const [lines, setLines] = useState<Point[][]>([]);
  const [currentLine, setCurrentLine] = useState<Point[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);

  // 히스토리
  const [history, setHistory] = useState<
    {
      lines: Point[][];
      shapes: Shape[];
      selectedShapeIds: string[];
      selectedLineIds: string[];
    }[]
  >([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // PDF 상태
  const [pdfPages, setPdfPages] = useState<HTMLImageElement[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pdfOffset, setPdfOffset] = useState({ x: 0, y: 0 });

  // 마우스 이벤트 핸들러
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      console.log("[DEBUG] Mouse down at:", pos, "tool:", tool);

      if (tool === "pen" || tool === "eraser") {
        setIsDrawing(true);
        const point: Point = {
          x: pos.x,
          y: pos.y,
          stroke: tool === "eraser" ? "#FFFFFF" : brushColor,
          strokeWidth: brushSize,
          mode: tool,
        };
        setCurrentLine([point]);
      } else if (tool === "select") {
        setSelectionBox({
          startX: pos.x,
          startY: pos.y,
          endX: pos.x,
          endY: pos.y,
        });
      }
    },
    [tool, brushColor, brushSize]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDrawing) return;

      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      setCurrentLine((prev) => {
        if (prev.length === 0) return prev;

        const lastPoint = prev[prev.length - 1];
        const distance = Math.sqrt(
          Math.pow(pos.x - lastPoint.x, 2) + Math.pow(pos.y - lastPoint.y, 2)
        );

        if (distance < 2) return prev;

        const newPoint: Point = {
          x: pos.x,
          y: pos.y,
          stroke: tool === "eraser" ? "#FFFFFF" : brushColor,
          strokeWidth: brushSize,
          mode: tool,
        };

        return [...prev, newPoint];
      });
    },
    [isDrawing, tool, brushColor, brushSize]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentLine.length > 0) {
      setLines((prev) => [...prev, currentLine]);
      setCurrentLine([]);
      saveToHistory();
    }

    setIsDrawing(false);
    setSelectionBox(null);
  }, [isDrawing, currentLine]);

  // 히스토리 관리
  const saveToHistory = useCallback(() => {
    const newState = {
      lines,
      shapes,
      selectedShapeIds,
      selectedLineIds,
    };

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newState];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [lines, shapes, selectedShapeIds, selectedLineIds, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setLines(prevState.lines);
      setShapes(prevState.shapes);
      setSelectedShapeIds(prevState.selectedShapeIds);
      setSelectedLineIds(prevState.selectedLineIds);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setLines(nextState.lines);
      setShapes(nextState.shapes);
      setSelectedShapeIds(nextState.selectedShapeIds);
      setSelectedLineIds(nextState.selectedLineIds);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [history, historyIndex]);

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
        radius: type !== "rectangle" ? 50 : undefined,
        fill: brushColor,
        stroke: brushColor,
        strokeWidth: 2,
        rotation: 0,
      };

      setShapes((prev) => [...prev, newShape]);
      saveToHistory();
    },
    [brushColor, saveToHistory]
  );

  // 선택 관리
  const handleShapeClick = useCallback(
    (shapeId: string) => {
      if (tool === "select") {
        setSelectedShapeIds((prev) =>
          prev.includes(shapeId)
            ? prev.filter((id) => id !== shapeId)
            : [...prev, shapeId]
        );
      }
    },
    [tool]
  );

  const handleLineClick = useCallback(
    (lineIndex: number) => {
      if (tool === "select") {
        const lineId = `line-${lineIndex}`;
        setSelectedLineIds((prev) =>
          prev.includes(lineId)
            ? prev.filter((id) => id !== lineId)
            : [...prev, lineId]
        );
      }
    },
    [tool]
  );

  // 삭제
  const deleteSelected = useCallback(() => {
    setShapes((prev) =>
      prev.filter((shape) => !selectedShapeIds.includes(shape.id))
    );
    setLines((prev) =>
      prev.filter((_, index) => !selectedLineIds.includes(`line-${index}`))
    );
    setSelectedShapeIds([]);
    setSelectedLineIds([]);
    saveToHistory();
  }, [selectedShapeIds, selectedLineIds, saveToHistory]);

  // 캔버스 클리어
  const clearCanvas = useCallback(() => {
    setLines([]);
    setShapes([]);
    setSelectedShapeIds([]);
    setSelectedLineIds([]);
    setCurrentLine([]);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    // 상태
    tool,
    brushColor,
    brushSize,
    lines,
    currentLine,
    shapes,
    selectedShapeIds,
    selectedLineIds,
    selectionBox,
    pdfPages,
    currentPage,
    pdfOffset,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,

    // 이벤트 핸들러
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleShapeClick,
    handleLineClick,

    // 액션
    setTool,
    setBrushColor,
    setBrushSize,
    addShape,
    deleteSelected,
    clearCanvas,
    undo,
    redo,

    // PDF 관련
    setPdfPages,
    setCurrentPage,
    setPdfOffset,
  };
};
