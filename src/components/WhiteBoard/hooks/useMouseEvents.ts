import { useCallback, useRef } from "react";
import Konva from "konva";
import {
  Tool,
  Lines,
  MousePosition,
  SelectionBox,
  PdfImageInfo,
} from "../types";

interface UseMouseEventsProps {
  tool: Tool;
  brushColor: string;
  brushSize: number;
  isDrawing: boolean;
  setIsDrawing: (value: boolean) => void;
  isSelecting: boolean;
  setIsSelecting: (value: boolean) => void;
  setCurrentLine: (value: Lines[] | ((prev: Lines[]) => Lines[])) => void;
  setSelectionBox: (
    value:
      | SelectionBox
      | null
      | ((prev: SelectionBox | null) => SelectionBox | null)
  ) => void;
  isDraggingPdf: boolean;
  setIsDraggingPdf: (value: boolean) => void;
  pdfOffset: { x: number; y: number };
  setPdfOffset: (value: { x: number; y: number }) => void;
  pdfImageRef: React.MutableRefObject<PdfImageInfo | null>;
}

export const useMouseEvents = ({
  tool,
  brushColor,
  brushSize,
  isDrawing,
  setIsDrawing,
  isSelecting,
  setIsSelecting,
  setCurrentLine,
  setSelectionBox,
  isDraggingPdf,
  setIsDraggingPdf,
  pdfOffset,
  setPdfOffset,
  pdfImageRef,
}: UseMouseEventsProps) => {
  const mousePosRef = useRef<MousePosition | null>(null);
  const dragStartRef = useRef<MousePosition>({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      console.log("[DEBUG] useMouseEvents handleMouseDown called", {
        target: e.target,
        tool,
        brushColor,
        brushSize,
      });

      const stage = e.target.getStage();
      if (!stage) {
        console.log("[DEBUG] No stage found in handleMouseDown");
        return;
      }

      const pos = stage.getPointerPosition();
      if (!pos) {
        console.log("[DEBUG] No pointer position found in handleMouseDown");
        return;
      }

      console.log("[DEBUG] Mouse position:", pos);
      mousePosRef.current = pos;

      if (tool === "select" && pdfImageRef.current) {
        const { x, y, width, height } = pdfImageRef.current;
        if (
          pos.x >= x &&
          pos.x <= x + width &&
          pos.y >= y &&
          pos.y <= y + height
        ) {
          setIsDraggingPdf(true);
          dragStartRef.current = { x: pos.x - x, y: pos.y - y };
          return;
        }
      }

      if (tool === "select" && e.target === stage) {
        setIsSelecting(true);
        setSelectionBox({
          startX: pos.x,
          startY: pos.y,
          endX: pos.x,
          endY: pos.y,
        });
        return;
      }

      if (tool === "pen" || tool === "eraser") {
        console.log(
          `[DEBUG] Starting drawing with ${tool}, color: ${brushColor}, size: ${brushSize}`
        );
        console.log(`[DEBUG] Creating point at position:`, pos);
        setIsDrawing(true);
        const point: Lines = {
          x: pos.x,
          y: pos.y,
          stroke: tool === "eraser" ? "#FFFFFF" : brushColor,
          strokeWidth: brushSize,
          mode: tool,
        };
        console.log(`[DEBUG] Created point:`, point);
        setCurrentLine([point]);
        console.log(`[DEBUG] Set currentLine to:`, [point]);

        // 즉시 첫 번째 점을 라인에 추가
        console.log(`[DEBUG] Added first point to currentLine`);
      }
    },
    [
      tool,
      brushColor,
      brushSize,
      setIsDrawing,
      setIsSelecting,
      setCurrentLine,
      setSelectionBox,
      setIsDraggingPdf,
      pdfImageRef,
    ]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      mousePosRef.current = pos;

      if (tool === "select" && isDraggingPdf && pdfImageRef.current) {
        const newOffsetX =
          pos.x -
          dragStartRef.current.x -
          (stage.width() - pdfImageRef.current.width) / 2;
        const newOffsetY =
          pos.y -
          dragStartRef.current.y -
          (stage.height() - pdfImageRef.current.height) / 2;

        // 현재 오프셋을 기반으로 새로운 위치 계산
        const finalOffsetX = pdfOffset.x + (newOffsetX - pdfOffset.x);
        const finalOffsetY = pdfOffset.y + (newOffsetY - pdfOffset.y);

        setPdfOffset({ x: finalOffsetX, y: finalOffsetY });
        return;
      }

      if (isSelecting) {
        setSelectionBox((prev) => {
          if (!prev) return prev;
          return { ...prev, endX: pos.x, endY: pos.y };
        });
        return;
      }

      if ((tool === "pen" || tool === "eraser") && isDrawing) {
        const point: Lines = {
          x: pos.x,
          y: pos.y,
          stroke: tool === "eraser" ? "#FFFFFF" : brushColor,
          strokeWidth: brushSize,
          mode: tool,
        };

        setCurrentLine((prev) => {
          if (prev.length > 0) {
            const lastPoint = prev[prev.length - 1];
            const distance = Math.sqrt(
              Math.pow(pos.x - lastPoint.x, 2) +
                Math.pow(pos.y - lastPoint.y, 2)
            );
            // 거리가 너무 가까우면 점을 추가하지 않음 (성능 최적화)
            if (distance < 2) return prev;
          }

          console.log(`[DEBUG] Adding point to currentLine:`, point);
          return [...prev, point];
        });
      }
    },
    [
      isDraggingPdf,
      isSelecting,
      tool,
      brushColor,
      brushSize,
      isDrawing,
      setCurrentLine,
      setSelectionBox,
      setPdfOffset,
      pdfImageRef,
      pdfOffset,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingPdf(false);
    setIsDrawing(false);
  }, [setIsDraggingPdf, setIsDrawing]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    mousePosRef,
  };
};
