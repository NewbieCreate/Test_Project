"use client";

import { useState, useCallback, useEffect } from "react";
import Konva from "konva";
import { Tool } from "../types";
import { useHistory } from "./useHistory";
import { useMouseEvents } from "./useMouseEvents";
import { useShapes } from "./useShapes";
import { useLines } from "./useLines";
import { useSelection } from "./useSelection";
import { usePDF } from "./usePDF";
import { Shape } from "../types";

const useWhiteBoard = () => {
  console.log("[DEBUG] useWhiteBoard hook initialized");

  // 기본 도구 상태
  const [tool, setTool] = useState<Tool>("pen");
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 개별 훅들 사용
  const shapesHook = useShapes();
  const linesHook = useLines();
  const selectionHook = useSelection({
    shapes: shapesHook.shapes,
    lines: linesHook.lines,
  });
  const pdfHook = usePDF();

  // 히스토리 훅 사용
  const historyHook = useHistory({
    lines: linesHook.lines,
    shapes: shapesHook.shapes,
    selectedShapeIds: selectionHook.selectedShapeIds,
    selectedLineIds: selectionHook.selectedLineIds,
  });

  // 마우스 이벤트 훅 사용
  const mouseEventsHook = useMouseEvents({
    tool,
    brushColor,
    brushSize,
    isDrawing,
    setIsDrawing,
    isSelecting: selectionHook.isSelecting,
    setIsSelecting: selectionHook.setIsSelecting,
    setCurrentLine: linesHook.setCurrentLine,
    setSelectionBox: selectionHook.setSelectionBox,
    isDraggingPdf: pdfHook.isDraggingPdf,
    setIsDraggingPdf: pdfHook.setIsDraggingPdf,
    pdfOffset: pdfHook.pdfOffset,
    setPdfOffset: pdfHook.setPdfOffset,
    pdfImageRef: pdfHook.pdfImageRef,
  });

  // 초기화 완료 표시
  useEffect(() => {
    if (!isInitialized) {
      console.log("[DEBUG] WhiteBoard hook fully initialized");
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // 통합된 마우스 업 핸들러
  const handleMouseUp = useCallback(() => {
    console.log("[DEBUG] handleMouseUp called, isDrawing:", isDrawing);

    // 선택 완료
    if (selectionHook.isSelecting) {
      selectionHook.completeSelection();
    }

    // 마우스 이벤트 처리
    mouseEventsHook.handleMouseUp();

    // 현재 라인 완료 및 히스토리 저장
    if (linesHook.finalizeLine()) {
      historyHook.saveToHistory();
    }
    linesHook.clearCurrentLine();

    // 그리기 상태 초기화
    setIsDrawing(false);
  }, [
    isDrawing,
    setIsDrawing,
    selectionHook.isSelecting,
    selectionHook.completeSelection,
    mouseEventsHook.handleMouseUp,
    linesHook.finalizeLine,
    linesHook.clearCurrentLine,
    historyHook.saveToHistory,
    selectionHook,
    mouseEventsHook,
    linesHook,
    historyHook,
  ]);

  // 통합된 도형 클릭 핸들러
  const handleShapeClick = useCallback(
    (shapeId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
      shapesHook.handleShapeClick(
        shapeId,
        e,
        tool,
        selectionHook.handleShapeSelect
      );
    },
    [tool]
  );

  // 통합된 선 클릭 핸들러
  const handleLineClick = useCallback(
    (lineId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
      linesHook.handleLineClick(
        lineId,
        e,
        tool,
        selectionHook.handleLineSelect
      );
    },
    [tool]
  );

  // 도형 드래그 완료 시 히스토리 저장
  const handleShapeDragEnd = useCallback(
    (shapeId: string, x: number, y: number) => {
      shapesHook.handleShapeDragEnd(shapeId, x, y);
      historyHook.saveToHistory();
    },
    []
  );

  // 도형 변환 완료 시 히스토리 저장
  const handleShapeTransformEnd = useCallback(
    (
      shapeId: string,
      x: number,
      y: number,
      width: number,
      height: number,
      rotation: number
    ) => {
      shapesHook.handleShapeTransformEnd(
        shapeId,
        x,
        y,
        width,
        height,
        rotation
      );
      historyHook.saveToHistory();
    },
    []
  );

  // 선 드래그 완료 시 히스토리 저장
  const handleLineDragEnd = useCallback(
    (lineId: string, x: number, y: number) => {
      linesHook.handleLineDragEnd(lineId, x, y);
      historyHook.saveToHistory();
    },
    []
  );

  // 선 변환 완료 시 히스토리 저장
  const handleLineTransformEnd = useCallback(
    (
      lineId: string,
      x: number,
      y: number,
      width: number,
      height: number,
      rotation: number
    ) => {
      linesHook.handleLineTransformEnd(lineId, x, y, width, height, rotation);
      historyHook.saveToHistory();
    },
    []
  );

  // 도형 추가 (히스토리 포함)
  const addShape = useCallback(
    (type: Shape["type"]) => {
      shapesHook.addShape(type, brushColor);
      historyHook.saveToHistory();
    },
    [brushColor]
  );

  // 텍스트 추가 (히스토리 포함)
  const addText = useCallback(
    (text: string, x: number, y: number) => {
      shapesHook.addText(text, x, y, brushColor);
      historyHook.saveToHistory();
    },
    [brushColor]
  );

  // 이미지 추가 (히스토리 포함)
  const addImage = useCallback(
    (imageSrc: string, x: number, y: number) => {
      shapesHook.addImage(imageSrc, x, y, brushColor);
      historyHook.saveToHistory();
    },
    [brushColor]
  );

  // 선택된 객체 삭제
  const deleteSelectedShapes = useCallback(() => {
    shapesHook.deleteShapes(selectionHook.selectedShapeIds);
    linesHook.deleteLines(selectionHook.selectedLineIds);
    selectionHook.setSelectedShapeIds([]);
    selectionHook.setSelectedLineIds([]);
    historyHook.saveToHistory();
  }, []);

  // 캔버스 클리어
  const clearCanvas = useCallback(() => {
    linesHook.clearLines();
    shapesHook.clearShapes();
    selectionHook.handleClearSelection();
    pdfHook.clearPdf();
    historyHook.clearHistory();
  }, []);

  // Undo 기능
  const undo = useCallback(() => {
    const prevState = historyHook.undo();
    if (prevState) {
      linesHook.setLines(prevState.lines);
      shapesHook.setShapes(prevState.shapes);
      selectionHook.setSelectedShapeIds(prevState.selectedShapeIds);
      selectionHook.setSelectedLineIds(prevState.selectedLineIds);
    }
  }, []);

  // Redo 기능
  const redo = useCallback(() => {
    const nextState = historyHook.redo();
    if (nextState) {
      linesHook.setLines(nextState.lines);
      shapesHook.setShapes(nextState.shapes);
      selectionHook.setSelectedShapeIds(nextState.selectedShapeIds);
      selectionHook.setSelectedLineIds(nextState.selectedLineIds);
    }
  }, []);

  // setTool 함수를 래핑하여 디버깅 추가
  const setToolWithDebug = useCallback(
    (newTool: Tool) => {
      console.log(
        "[DEBUG] setTool called with:",
        newTool,
        "previous tool was:",
        tool
      );
      setTool(newTool);
    },
    [tool]
  );

  return {
    // 상태
    lines: linesHook.lines,
    currentLine: linesHook.currentLine,
    shapes: shapesHook.shapes,
    selectedShapeIds: selectionHook.selectedShapeIds,
    selectedLineIds: selectionHook.selectedLineIds,
    selectionBox: selectionHook.selectionBox,
    tool,
    brushColor,
    brushSize,
    pdfPages: pdfHook.pdfPages,
    currentPage: pdfHook.currentPage,
    pdfOffset: pdfHook.pdfOffset,

    // 히스토리 상태
    canUndo: historyHook.canUndo,
    canRedo: historyHook.canRedo,

    // 이벤트 핸들러
    handleMouseDown: mouseEventsHook.handleMouseDown,
    handleMouseMove: mouseEventsHook.handleMouseMove,
    handleMouseUp,
    handleShapeClick,
    handleLineClick,
    handleLineDragEnd,
    handleShapeDragEnd,
    handleShapeTransformEnd,
    handleLineTransformEnd,
    handleClearSelection: selectionHook.handleClearSelection,
    handlePdfImageChange: pdfHook.handlePdfImageChange,

    // 액션 함수
    addShape,
    addText,
    addImage,
    deleteSelectedShapes,
    clearCanvas,
    resetPdfPosition: pdfHook.resetPdfPosition,
    undo,
    redo,

    // 상태 설정 함수
    setTool: setToolWithDebug,
    setBrushColor,
    setBrushSize,
    setPdfPages: pdfHook.setPdfPages,
    setCurrentPage: pdfHook.setCurrentPage,
    setPdfOffset: pdfHook.setPdfOffset,
  };
};

export default useWhiteBoard;
