//WhiteBoard.tsx
"use client";

import { useState, useRef, useCallback } from "react";
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
  id?: string; // 선 ID 추가
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

// 히스토리 상태 타입
interface HistoryState {
  lines: Lines[][];
  shapes: Shape[];
  selectedShapeIds: string[];
  timestamp: number;
}

const useWhiteBoard = () => {
  // 기본 상태
  const [lines, setLines] = useState<Lines[][]>([]);
  const [currentLine, setCurrentLine] = useState<Lines[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]); // 선 선택 상태 추가
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // 히스토리 관리
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);

  // 도구 상태
  const [tool, setTool] = useState<"pen" | "eraser" | "select">("pen");
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);

  // PDF 관련 상태
  const [pdfPages, setPdfPages] = useState<HTMLImageElement[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pdfOffset, setPdfOffset] = useState({ x: 0, y: 0 });
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // PDF 이미지 정보를 저장할 ref
  const pdfImageRef = useRef<{
    image: HTMLImageElement;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // 히스토리에 상태 저장
  const saveToHistory = useCallback(() => {
    if (isUndoRedoAction) {
      setIsUndoRedoAction(false);
      return;
    }

    const newState: HistoryState = {
      lines: JSON.parse(JSON.stringify(lines)),
      shapes: JSON.parse(JSON.stringify(shapes)),
      selectedShapeIds: [...selectedShapeIds],
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      // 히스토리 크기 제한 (최대 50개)
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  }, [lines, shapes, selectedShapeIds, historyIndex, isUndoRedoAction]);

  // 언도 기능
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setIsUndoRedoAction(true);
      const prevState = history[historyIndex - 1];
      setLines(prevState.lines);
      setShapes(prevState.shapes);
      setSelectedShapeIds(prevState.selectedShapeIds);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  // 리도 기능
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedoAction(true);
      const nextState = history[historyIndex + 1];
      setLines(nextState.lines);
      setShapes(nextState.shapes);
      setSelectedShapeIds(nextState.selectedShapeIds);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // 마우스 이벤트 핸들러
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      console.log("MouseDown:", { tool, pos, target: e.target.name() });

      // PDF 이미지 드래그 시작 (선택 모드에서만)
      if (tool === "select" && pdfImageRef.current) {
        const { x, y, width, height } = pdfImageRef.current;
        if (
          pos.x >= x &&
          pos.x <= x + width &&
          pos.y >= y &&
          pos.y <= y + height
        ) {
          setIsDraggingPdf(true);
          setDragStart({ x: pos.x - x, y: pos.y - y });
          return;
        }
      }

      // 선택 모드에서 선택 박스 시작 (Stage 클릭 시)
      if (tool === "select" && (e.target === stage || e.target.name() === "")) {
        setIsSelecting(true);
        setSelectionBox({
          startX: pos.x,
          startY: pos.y,
          endX: pos.x,
          endY: pos.y,
        });
        return;
      }

      // 그리기 시작 (펜 또는 지우개 모드)
      if (tool === "pen" || tool === "eraser") {
        console.log("Starting to draw:", {
          tool,
          pos,
          brushColor,
          brushSize,
          target: e.target.name(),
        });
        const point: Lines = {
          x: pos.x,
          y: pos.y,
          stroke: tool === "eraser" ? "#FFFFFF" : brushColor,
          strokeWidth: brushSize,
          mode: tool,
        };
        setCurrentLine([point]);
        console.log("Current line set:", [point]);
      }
    },
    [tool, brushColor, brushSize]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      // PDF 이미지 드래그 처리 (선택 모드에서만)
      if (tool === "select" && isDraggingPdf && pdfImageRef.current) {
        const newOffsetX =
          pos.x - dragStart.x - (stage.width() - pdfImageRef.current.width) / 2;
        const newOffsetY =
          pos.y -
          dragStart.y -
          (stage.height() - pdfImageRef.current.height) / 2;
        setPdfOffset({ x: newOffsetX, y: newOffsetY });
        return;
      }

      // 선택 박스 업데이트
      if (isSelecting && selectionBox) {
        setSelectionBox({ ...selectionBox, endX: pos.x, endY: pos.y });
        return;
      }

      // 그리기 처리 (펜 또는 지우개 모드)
      if (currentLine.length > 0 && (tool === "pen" || tool === "eraser")) {
        console.log("Drawing:", {
          pos,
          currentLineLength: currentLine.length,
          tool,
          isDrawing: true,
        });
        const point: Lines = {
          x: pos.x,
          y: pos.y,
          stroke: tool === "eraser" ? "#FFFFFF" : brushColor,
          strokeWidth: brushSize,
          mode: tool,
        };
        setCurrentLine((prev) => {
          const newLine = [...prev, point];
          console.log("Current line updated:", newLine.length, "points");
          return newLine;
        });
      } else {
        console.log("Not drawing:", {
          currentLineLength: currentLine.length,
          tool,
          isDrawing: false,
        });
      }
    },
    [
      isDraggingPdf,
      dragStart,
      isSelecting,
      selectionBox,
      currentLine.length,
      tool,
      brushColor,
      brushSize,
    ]
  );

  const handleMouseUp = useCallback(() => {
    // 선택 박스 완료
    if (isSelecting && selectionBox) {
      selectShapesInBox(selectionBox);
      setIsSelecting(false);
      setSelectionBox(null);
    }

    setIsDraggingPdf(false);

    // 현재 라인을 라인 배열에 추가
    if (currentLine.length > 0) {
      // 고정된 ID를 가진 선으로 변환
      const lineWithId = {
        id: `line-${lines.length}`, // 기존 라인 개수를 기반으로 ID 생성
        points: currentLine,
      };

      setLines((prev) => [...prev, lineWithId.points]);
      setCurrentLine([]);
      saveToHistory();
    }
  }, [isSelecting, selectionBox, currentLine, lines, saveToHistory]);

  // 선택 박스로 도형과 선 선택
  const selectShapesInBox = useCallback(
    (box: SelectionBox) => {
      const selectedShapeIds: string[] = [];
      const selectedLineIds: string[] = [];
      const boxLeft = Math.min(box.startX, box.endX);
      const boxRight = Math.max(box.startX, box.endX);
      const boxTop = Math.min(box.startY, box.endY);
      const boxBottom = Math.max(box.startY, box.endY);

      // 도형 선택
      shapes.forEach((shape) => {
        let shapeLeft, shapeRight, shapeTop, shapeBottom;

        if (shape.type === "rectangle") {
          shapeLeft = shape.x;
          shapeRight = shape.x + (shape.width || 100);
          shapeTop = shape.y;
          shapeBottom = shape.y + (shape.height || 100);
        } else {
          // 원, 삼각형, 별 등은 radius 기반으로 계산
          const radius = shape.radius || 50;
          shapeLeft = shape.x - radius;
          shapeRight = shape.x + radius;
          shapeTop = shape.y - radius;
          shapeBottom = shape.y + radius;
        }

        // 충돌 검사 (AABB)
        if (
          shapeLeft < boxRight &&
          shapeRight > boxLeft &&
          shapeTop < boxBottom &&
          shapeBottom > boxTop
        ) {
          selectedShapeIds.push(shape.id);
        }
      });

      // 선 선택 (선의 모든 점이 박스 안에 있는지 확인)
      lines.forEach((line, lineIndex) => {
        if (line.length === 0) return;

        const lineId = `line-${lineIndex}`;
        const allPointsInBox = line.every(
          (point) =>
            point.x >= boxLeft &&
            point.x <= boxRight &&
            point.y >= boxTop &&
            point.y <= boxBottom
        );

        if (allPointsInBox) {
          selectedLineIds.push(lineId);
        }
      });

      console.log(
        "Selection box:",
        box,
        "Selected shapes:",
        selectedShapeIds,
        "Selected lines:",
        selectedLineIds
      );
      setSelectedShapeIds(selectedShapeIds);
      setSelectedLineIds(selectedLineIds);
    },
    [shapes, lines]
  );

  // 도형 클릭 이벤트
  const handleShapeClick = useCallback(
    (shapeId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
      console.log("Shape clicked:", shapeId, "Tool:", tool);

      if (tool === "select") {
        if (e.evt.shiftKey || e.evt.ctrlKey) {
          // Shift/Ctrl 키를 누른 상태에서 클릭하면 다중 선택/해제
          setSelectedShapeIds((prev) =>
            prev.includes(shapeId)
              ? prev.filter((id) => id !== shapeId)
              : [...prev, shapeId]
          );
        } else {
          // 일반 클릭이면 단일 선택
          setSelectedShapeIds([shapeId]);
          setSelectedLineIds([]); // 도형 선택 시 선 선택 해제
        }
      }
    },
    [tool]
  );

  // 선 클릭 이벤트
  const handleLineClick = useCallback(
    (lineId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
      console.log("Line clicked:", lineId, "Tool:", tool);

      if (tool === "select") {
        if (e.evt.shiftKey || e.evt.ctrlKey) {
          // Shift/Ctrl 키를 누른 상태에서 클릭하면 다중 선택/해제
          setSelectedLineIds((prev) =>
            prev.includes(lineId)
              ? prev.filter((id) => id !== lineId)
              : [...prev, lineId]
          );
        } else {
          // 일반 클릭이면 단일 선택
          setSelectedLineIds([lineId]);
          setSelectedShapeIds([]); // 선 선택 시 도형 선택 해제
        }
      }
    },
    [tool]
  );

  // 도형 드래그 완료 이벤트 (Konva 내장 드래그)
  const handleShapeDragEnd = useCallback(
    (shapeId: string, x: number, y: number) => {
      console.log("Shape dragged:", { shapeId, x, y });
      setShapes((prev) =>
        prev.map((s) => (s.id === shapeId ? { ...s, x, y } : s))
      );
      saveToHistory();
    },
    [saveToHistory]
  );

  // 도형 변환 완료 이벤트 (리사이즈, 회전, 드래그)
  const handleShapeTransformEnd = useCallback(
    (
      shapeId: string,
      x: number,
      y: number,
      width: number,
      height: number,
      rotation: number
    ) => {
      console.log("Shape transformed:", {
        shapeId,
        x,
        y,
        width,
        height,
        rotation,
      });
      setShapes((prev) =>
        prev.map((s) => {
          if (s.id === shapeId) {
            return {
              ...s,
              x,
              y,
              width: s.type === "rectangle" ? width : s.width,
              height: s.type === "rectangle" ? height : s.height,
              radius:
                s.type !== "rectangle" ? Math.max(width, height) / 2 : s.radius,
              rotation,
            };
          }
          return s;
        })
      );
      saveToHistory();
    },
    [saveToHistory]
  );

  // 선택 박스 변경 이벤트
  const handleSelectionBoxChange = useCallback((box: SelectionBox | null) => {
    setSelectionBox(box);
  }, []);

  // PDF 이미지 변경 이벤트
  const handlePdfImageChange = useCallback((image: HTMLImageElement | null) => {
    if (image) {
      pdfImageRef.current = {
        image,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
    }
  }, []);

  // 도형 추가 함수
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
        fill: brushColor,
        stroke: "#000000",
        strokeWidth: 2,
        draggable: true,
      };
      setShapes((prev) => [...prev, newShape]);
      saveToHistory();
    },
    [brushColor, saveToHistory]
  );

  // 텍스트 추가 함수
  const addText = useCallback(
    (text: string, x: number, y: number) => {
      const newText: Shape = {
        id: `text-${Date.now()}`,
        type: "rectangle", // 텍스트는 임시로 rectangle로 처리
        x,
        y,
        width: text.length * 12, // 텍스트 길이에 따른 너비
        height: 20,
        fill: "transparent",
        stroke: brushColor,
        strokeWidth: 1,
        draggable: true,
      };
      setShapes((prev) => [...prev, newText]);
      saveToHistory();
    },
    [brushColor, saveToHistory]
  );

  // 이미지 추가 함수
  const addImage = useCallback(
    (imageSrc: string, x: number, y: number) => {
      const newImage: Shape = {
        id: `image-${Date.now()}`,
        type: "rectangle", // 이미지는 임시로 rectangle로 처리
        x,
        y,
        width: 100,
        height: 100,
        fill: "transparent",
        stroke: brushColor,
        strokeWidth: 2,
        draggable: true,
      };
      setShapes((prev) => [...prev, newImage]);
      saveToHistory();
    },
    [brushColor, saveToHistory]
  );

  // 선택된 도형과 선 삭제
  const deleteSelectedShapes = useCallback(() => {
    setShapes((prev) =>
      prev.filter((shape) => !selectedShapeIds.includes(shape.id))
    );
    setSelectedShapeIds([]);

    // 선택된 선 삭제
    setLines((prev) => {
      const newLines = prev.filter((_, index) => {
        const lineId = `line-${index}`;
        return !selectedLineIds.includes(lineId);
      });
      return newLines;
    });
    setSelectedLineIds([]);

    saveToHistory();
  }, [selectedShapeIds, selectedLineIds, saveToHistory]);

  // 캔버스 클리어
  const clearCanvas = useCallback(() => {
    setLines([]);
    setCurrentLine([]);
    setShapes([]);
    setSelectedShapeIds([]);
    setSelectionBox(null);
    setPdfPages([]);
    setCurrentPage(0);
    setPdfOffset({ x: 0, y: 0 });
    pdfImageRef.current = null;
    // 히스토리 초기화
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  // PDF 위치 초기화
  const resetPdfPosition = useCallback(() => {
    setPdfOffset({ x: 0, y: 0 });
  }, []);

  return {
    // 상태
    lines,
    currentLine,
    shapes,
    selectedShapeIds,
    selectedLineIds,
    selectionBox,
    tool,
    brushColor,
    brushSize,
    pdfPages,
    currentPage,
    pdfOffset,

    // 히스토리 상태
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,

    // 이벤트 핸들러
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleShapeClick,
    handleLineClick,
    handleShapeDragEnd,
    handleShapeTransformEnd,
    handleSelectionBoxChange,
    handlePdfImageChange,

    // 액션 함수
    addShape,
    addText,
    addImage,
    deleteSelectedShapes,
    clearCanvas,
    resetPdfPosition,
    undo,
    redo,

    // 상태 설정 함수
    setTool,
    setBrushColor,
    setBrushSize,
    setPdfPages,
    setCurrentPage,
    setPdfOffset,
  };
};

export default useWhiteBoard;
