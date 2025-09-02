import { useState, useCallback } from "react";
import Konva from "konva";
import { Lines } from "../types";
import React from "react";

export const useLines = () => {
  const [lines, setLines] = useState<Lines[][]>([]);
  const [currentLine, setCurrentLine] = useState<Lines[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 초기화 완료 표시
  React.useEffect(() => {
    if (!isInitialized) {
      console.log("[DEBUG] useLines hook initialized");
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const handleLineClick = useCallback(
    (
      lineId: string,
      e: Konva.KonvaEventObject<MouseEvent>,
      tool: string,
      onLineSelect: (lineId: string, multi: boolean) => void
    ) => {
      if (tool === "select") {
        const isMultiSelect = e.evt.shiftKey || e.evt.ctrlKey;
        onLineSelect(lineId, isMultiSelect);
      }
    },
    []
  );

  const handleLineDragEnd = useCallback(
    (lineId: string, x: number, y: number) => {
      const lineIndex = parseInt(lineId.replace("line-", ""));

      if (!isNaN(lineIndex) && lines[lineIndex]) {
        const updatedLines = [...lines];
        updatedLines[lineIndex] = lines[lineIndex].map((point) => ({
          ...point,
          x: point.x + x,
          y: point.y + y,
        }));

        setLines(updatedLines);
      }
    },
    [lines]
  );

  const handleLineTransformEnd = useCallback(
    (
      lineId: string,
      x: number,
      y: number,
      width: number,
      height: number,
      rotation: number
    ) => {
      const lineIndex = parseInt(lineId.replace("line-", ""));

      if (!isNaN(lineIndex) && lines[lineIndex]) {
        const line = lines[lineIndex];
        if (line.length >= 2) {
          const centerX = line.reduce((sum, p) => sum + p.x, 0) / line.length;
          const centerY = line.reduce((sum, p) => sum + p.y, 0) / line.length;

          const updatedLine = line.map((point) => {
            const relativeX = point.x - centerX;
            const relativeY = point.y - centerY;

            const cos = Math.cos((rotation * Math.PI) / 180);
            const sin = Math.sin((rotation * Math.PI) / 180);
            const rotatedX = relativeX * cos - relativeY * sin;
            const rotatedY = relativeX * sin + relativeY * cos;

            const scaledX =
              rotatedX * (width / (line[line.length - 1].x - line[0].x || 1));
            const scaledY =
              rotatedY * (height / (line[line.length - 1].y - line[0].y || 1));

            return {
              ...point,
              x: x + scaledX,
              y: y + scaledY,
            };
          });

          const updatedLines = [...lines];
          updatedLines[lineIndex] = updatedLine;
          setLines(updatedLines);
        }
      }
    },
    [lines]
  );

  const deleteLines = useCallback((lineIds: string[]) => {
    setLines((prev) => {
      const newLines = prev.filter((_, index) => {
        const lineId = `line-${index}`;
        return !lineIds.includes(lineId);
      });
      return newLines;
    });
  }, []);

  const finalizeLine = useCallback(() => {
    if (currentLine.length >= 1) {
      setLines((prev) => [...prev, currentLine]);
      return true;
    }
    return false;
  }, [currentLine]);

  const clearCurrentLine = useCallback(() => {
    setCurrentLine([]);
  }, []);

  const clearLines = useCallback(() => {
    setLines([]);
    setCurrentLine([]);
  }, []);

  return {
    lines,
    currentLine,
    setLines,
    setCurrentLine,
    handleLineClick,
    handleLineDragEnd,
    handleLineTransformEnd,
    deleteLines,
    finalizeLine,
    clearCurrentLine,
    clearLines,
  };
};
