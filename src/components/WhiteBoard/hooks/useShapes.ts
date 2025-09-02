import { useState, useCallback, useEffect } from "react";
import Konva from "konva";
import { Shape } from "../types";

export const useShapes = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // 초기화 완료 표시
  useEffect(() => {
    if (!isInitialized) {
      console.log("[DEBUG] useShapes hook initialized");
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const addShape = useCallback((type: Shape["type"], brushColor: string) => {
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
  }, []);

  const addText = useCallback(
    (text: string, x: number, y: number, brushColor: string) => {
      const newText: Shape = {
        id: `text-${Date.now()}`,
        type: "rectangle",
        x,
        y,
        width: text.length * 12,
        height: 20,
        fill: "transparent",
        stroke: brushColor,
        strokeWidth: 1,
        draggable: true,
      };
      setShapes((prev) => [...prev, newText]);
    },
    []
  );

  const addImage = useCallback(
    (imageSrc: string, x: number, y: number, brushColor: string) => {
      const newImage: Shape = {
        id: `image-${Date.now()}`,
        type: "rectangle",
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
    },
    []
  );

  const handleShapeClick = useCallback(
    (
      shapeId: string,
      e: Konva.KonvaEventObject<MouseEvent>,
      tool: string,
      onShapeSelect: (shapeId: string, multi: boolean) => void
    ) => {
      if (tool === "select") {
        const isMultiSelect = e.evt.shiftKey || e.evt.ctrlKey;
        onShapeSelect(shapeId, isMultiSelect);
      }
    },
    []
  );

  const handleShapeDragEnd = useCallback(
    (shapeId: string, x: number, y: number) => {
      setShapes((prev) =>
        prev.map((s) => (s.id === shapeId ? { ...s, x, y } : s))
      );
    },
    []
  );

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
    },
    []
  );

  const deleteShapes = useCallback((shapeIds: string[]) => {
    setShapes((prev) => prev.filter((shape) => !shapeIds.includes(shape.id)));
  }, []);

  const clearShapes = useCallback(() => {
    setShapes([]);
  }, []);

  return {
    shapes,
    setShapes,
    addShape,
    addText,
    addImage,
    handleShapeClick,
    handleShapeDragEnd,
    handleShapeTransformEnd,
    deleteShapes,
    clearShapes,
  };
};
