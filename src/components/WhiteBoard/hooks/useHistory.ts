import { useState, useCallback, useEffect } from "react";
import { HistoryState, Lines, Shape } from "../types";

interface UseHistoryProps {
  lines: Lines[][];
  shapes: Shape[];
  selectedShapeIds: string[];
  selectedLineIds: string[];
}

export const useHistory = ({
  lines,
  shapes,
  selectedShapeIds,
  selectedLineIds,
}: UseHistoryProps) => {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 초기화 완료 표시
  useEffect(() => {
    if (!isInitialized) {
      console.log("[DEBUG] useHistory hook initialized");
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const saveToHistory = useCallback(() => {
    if (isUndoRedoAction) {
      setIsUndoRedoAction(false);
      return;
    }

    const newState: HistoryState = {
      lines: JSON.parse(JSON.stringify(lines)),
      shapes: JSON.parse(JSON.stringify(shapes)),
      selectedShapeIds: [...selectedShapeIds],
      selectedLineIds: [...selectedLineIds],
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  }, [
    lines,
    shapes,
    selectedShapeIds,
    selectedLineIds,
    historyIndex,
    isUndoRedoAction,
  ]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setIsUndoRedoAction(true);
      const prevState = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      return prevState;
    }
    return null;
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedoAction(true);
      const nextState = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      return nextState;
    }
    return null;
  }, [history, historyIndex]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    saveToHistory,
    undo,
    redo,
    clearHistory,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    setIsUndoRedoAction,
  };
};
