import { useState, useCallback, useEffect } from "react";
import { SelectionBox, Shape, Lines } from "../types";

interface UseSelectionProps {
  shapes: Shape[];
  lines: Lines[][];
}

export const useSelection = ({ shapes, lines }: UseSelectionProps) => {
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 초기화 완료 표시
  useEffect(() => {
    if (!isInitialized) {
      console.log("[DEBUG] useSelection hook initialized");
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const updateSelectionBox = useCallback(
    (selectedShapeIds: string[], selectedLineIds: string[]) => {
      if (selectedShapeIds.length === 0 && selectedLineIds.length === 0) {
        setSelectionBox(null);
        return;
      }

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      selectedShapeIds.forEach((shapeId) => {
        const shape = shapes.find((s) => s.id === shapeId);
        if (shape) {
          if (shape.type === "rectangle") {
            minX = Math.min(minX, shape.x);
            minY = Math.min(minY, shape.y);
            maxX = Math.max(maxX, shape.x + (shape.width || 100));
            maxY = Math.max(maxY, shape.y + (shape.height || 100));
          } else {
            const radius = shape.radius || 50;
            minX = Math.min(minX, shape.x - radius);
            minY = Math.min(minY, shape.y - radius);
            maxX = Math.max(maxX, shape.x + radius);
            maxY = Math.max(maxY, shape.y + radius);
          }
        }
      });

      selectedLineIds.forEach((lineId) => {
        const lineIndex = parseInt(lineId.replace("line-", ""));
        const line = lines[lineIndex];
        if (line && line.length > 0) {
          line.forEach((point) => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          });
        }
      });

      if (
        minX !== Infinity &&
        minY !== Infinity &&
        maxX !== -Infinity &&
        maxY !== -Infinity
      ) {
        const padding = 10;
        setSelectionBox({
          startX: minX - padding,
          startY: minY - padding,
          endX: maxX + padding,
          endY: maxY + padding,
        });
      }
    },
    [shapes, lines]
  );

  const selectShapesInBox = useCallback(
    (box: SelectionBox) => {
      const selectedShapeIds: string[] = [];
      const selectedLineIds: string[] = [];
      const boxLeft = Math.min(box.startX, box.endX);
      const boxRight = Math.max(box.startX, box.endX);
      const boxTop = Math.min(box.startY, box.endY);
      const boxBottom = Math.max(box.startY, box.endY);

      shapes.forEach((shape) => {
        let shapeLeft, shapeRight, shapeTop, shapeBottom;

        if (shape.type === "rectangle") {
          shapeLeft = shape.x;
          shapeRight = shape.x + (shape.width || 100);
          shapeTop = shape.y;
          shapeBottom = shape.y + (shape.height || 100);
        } else {
          const radius = shape.radius || 50;
          shapeLeft = shape.x - radius;
          shapeRight = shape.x + radius;
          shapeTop = shape.y - radius;
          shapeBottom = shape.y + radius;
        }

        if (
          shapeLeft < boxRight &&
          shapeRight > boxLeft &&
          shapeTop < boxBottom &&
          shapeBottom > boxTop
        ) {
          selectedShapeIds.push(shape.id);
        }
      });

      lines.forEach((line, lineIndex) => {
        if (line.length < 2) return;

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

      setSelectedShapeIds(selectedShapeIds);
      setSelectedLineIds(selectedLineIds);
      updateSelectionBox(selectedShapeIds, selectedLineIds);
    },
    [shapes, lines, updateSelectionBox]
  );

  const handleShapeSelect = useCallback(
    (shapeId: string, isMultiSelect: boolean) => {
      let newSelectedShapeIds: string[];
      const newSelectedLineIds: string[] = [];

      if (isMultiSelect) {
        newSelectedShapeIds = selectedShapeIds.includes(shapeId)
          ? selectedShapeIds.filter((id) => id !== shapeId)
          : [...selectedShapeIds, shapeId];
      } else {
        newSelectedShapeIds = [shapeId];
      }

      setSelectedShapeIds(newSelectedShapeIds);
      setSelectedLineIds(newSelectedLineIds);
      updateSelectionBox(newSelectedShapeIds, newSelectedLineIds);
    },
    [selectedShapeIds, updateSelectionBox]
  );

  const handleLineSelect = useCallback(
    (lineId: string, isMultiSelect: boolean) => {
      let newSelectedLineIds: string[];
      const newSelectedShapeIds: string[] = [];

      if (isMultiSelect) {
        newSelectedLineIds = selectedLineIds.includes(lineId)
          ? selectedLineIds.filter((id) => id !== lineId)
          : [...selectedLineIds, lineId];
      } else {
        newSelectedLineIds = [lineId];
      }

      setSelectedLineIds(newSelectedLineIds);
      setSelectedShapeIds(newSelectedShapeIds);
      updateSelectionBox(newSelectedShapeIds, newSelectedLineIds);
    },
    [selectedLineIds, updateSelectionBox]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedShapeIds([]);
    setSelectedLineIds([]);
    setSelectionBox(null);
  }, []);

  const completeSelection = useCallback(() => {
    if (selectionBox) {
      selectShapesInBox(selectionBox);
      setIsSelecting(false);
    }
  }, [selectionBox, selectShapesInBox]);

  return {
    selectedShapeIds,
    selectedLineIds,
    selectionBox,
    isSelecting,
    setSelectedShapeIds,
    setSelectedLineIds,
    setSelectionBox,
    setIsSelecting,
    updateSelectionBox,
    selectShapesInBox,
    handleShapeSelect,
    handleLineSelect,
    handleClearSelection,
    completeSelection,
  };
};
