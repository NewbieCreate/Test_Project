//CanvasComponent.tsx
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Konva from "konva";

import { Shape, Lines, SelectionBox, Tool } from "./types";

// 상수 정의
const CONSTANTS = {
  CANVAS: {
    DEFAULT_WIDTH: 800,
    DEFAULT_HEIGHT: 600,
    MIN_SHAPE_SIZE: 20,
    MIN_LINE_SIZE: 10,
    MIN_SELECTION_SIZE: 5,
    PDF_SCALE_FACTOR: 0.8,
  },
  COLORS: {
    SELECTION: "#2196f3",
    SELECTION_FILL: "#e3f2fd",
    LINE_TRANSFORMER: "#ff6b35",
    WHITE: "#ffffff",
    SELECTION_BOX: "#0096fd",
    SELECTION_BOX_FILL: "rgba(0, 150, 253, 0.1)",
  },
  SIZES: {
    SHAPE_ANCHOR: 8,
    LINE_ANCHOR: 6,
    SHAPE_STROKE: 3,
    LINE_STROKE: 2,
    SELECTION_STROKE: 1,
  },
  OFFSETS: {
    SHAPE_ROTATE: 30,
    LINE_ROTATE: 25,
  },
  DASH_PATTERN: [5, 5] as number[],
} as const;

// 타입 정의
interface CanvasComponentProps {
  lines: Lines[][];
  currentLine: Lines[];
  shapes: Shape[];
  selectedShapeIds: string[];
  selectedLineIds: string[];
  selectionBox: SelectionBox | null;
  tool: Tool;
  brushColor: string;
  brushSize: number;
  pdfPages: HTMLImageElement[];
  currentPage: number;
  pdfOffset: { x: number; y: number };
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseUp: () => void;
  onShapeClick: (
    shapeId: string,
    e: Konva.KonvaEventObject<MouseEvent>
  ) => void;
  onLineClick: (lineId: string, e: Konva.KonvaEventObject<MouseEvent>) => void;
  onLineDragEnd: (lineId: string, x: number, y: number) => void;
  onShapeDragEnd: (shapeId: string, x: number, y: number) => void;
  onShapeTransformEnd: (
    shapeId: string,
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number
  ) => void;
  onLineTransformEnd: (
    lineId: string,
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number
  ) => void;
  onClearSelection: () => void;
  onPdfImageChange: (image: HTMLImageElement | null) => void;
}

type NodeType = "line" | "shape";
type EventHandlers = {
  click: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  dragend: (node: Konva.Shape) => void;
  transformend: (node: Konva.Shape) => void;
};

const CanvasComponent: React.FC<CanvasComponentProps> = ({
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
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onShapeClick,
  onLineClick,
  onLineDragEnd,
  onShapeDragEnd,
  onShapeTransformEnd,
  onLineTransformEnd,
  onClearSelection,
  onPdfImageChange,
}) => {
  // Refs
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const lineTransformerRef = useRef<Konva.Transformer | null>(null);

  // State
  const [isClient, setIsClient] = useState(false);
  const [isStageReady, setIsStageReady] = useState(false);
  const [isContainerMounted, setIsContainerMounted] = useState(false);

  // Styling functions
  const applySelectionStyle = useCallback(
    (node: Konva.Shape, isSelected: boolean, baseStrokeWidth: number) => {
      if (!isSelected) return;

      node.stroke(CONSTANTS.COLORS.SELECTION);
      if (node instanceof Konva.Line) {
        node.strokeWidth(baseStrokeWidth + CONSTANTS.SIZES.LINE_STROKE);
      } else {
        node.strokeWidth(CONSTANTS.SIZES.LINE_STROKE);
      }
    },
    []
  );

  // Event handler creation
  const createEventHandlers = useCallback(
    (nodeId: string, nodeType: NodeType): EventHandlers => ({
      click: (e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        if (tool !== "select") return;

        if (nodeType === "line") {
          onLineClick(nodeId, e);
        } else {
          onShapeClick(nodeId, e);
        }
      },

      dragend: (node: Konva.Shape) => {
        if (nodeType === "line") {
          onLineDragEnd(nodeId, node.x(), node.y());
          if (tool === "select") {
            node.x(0);
            node.y(0);
          }
        } else {
          onShapeDragEnd(nodeId, node.x(), node.y());
        }
      },

      transformend: (node: Konva.Shape) => {
        const x = node.x();
        const y = node.y();
        const width = node.width() * node.scaleX();
        const height = node.height() * node.scaleY();
        const rotation = node.rotation();

        if (nodeType === "line") {
          onLineTransformEnd(nodeId, x, y, width, height, rotation);
        } else {
          onShapeTransformEnd(nodeId, x, y, width, height, rotation);
        }
      },
    }),
    [
      tool,
      onLineClick,
      onShapeClick,
      onLineDragEnd,
      onShapeDragEnd,
      onLineTransformEnd,
      onShapeTransformEnd,
    ]
  );

  const addEventHandlers = useCallback(
    (node: Konva.Shape, nodeId: string, nodeType: NodeType) => {
      const handlers = createEventHandlers(nodeId, nodeType);

      node.on("click", handlers.click);
      node.on("dragend", () => handlers.dragend(node));
      node.on("transformend", () => handlers.transformend(node));
    },
    [createEventHandlers]
  );

  // Konva node creation
  const createKonvaCircle = useCallback(
    (config: Konva.CircleConfig, isSelected: boolean) => {
      const circle = new Konva.Circle(config);
      applySelectionStyle(circle, isSelected, config.radius! * 2);
      return circle;
    },
    [applySelectionStyle]
  );

  const createKonvaLine = useCallback(
    (config: Konva.LineConfig, isSelected: boolean) => {
      const line = new Konva.Line(config);
      applySelectionStyle(line, isSelected, config.strokeWidth!);
      return line;
    },
    [applySelectionStyle]
  );

  const createShapeNode = useCallback((shape: Shape, isSelected: boolean) => {
    const baseConfig = {
      name: "shape",
      id: shape.id,
      x: shape.x,
      y: shape.y,
      fill: isSelected ? CONSTANTS.COLORS.SELECTION_FILL : shape.fill,
      stroke: isSelected ? CONSTANTS.COLORS.SELECTION : shape.stroke,
      strokeWidth: isSelected
        ? CONSTANTS.SIZES.SHAPE_STROKE
        : shape.strokeWidth,
      rotation: shape.rotation,
    };

    switch (shape.type) {
      case "rectangle":
        return new Konva.Rect({
          ...baseConfig,
          width: shape.width ?? 100,
          height: shape.height ?? 100,
        });
      case "circle":
        return new Konva.Circle({
          ...baseConfig,
          radius: shape.radius ?? 50,
        });
      case "triangle":
        return new Konva.RegularPolygon({
          ...baseConfig,
          sides: 3,
          radius: shape.radius ?? 50,
        });
      case "star":
        return new Konva.Star({
          ...baseConfig,
          numPoints: 5,
          innerRadius: (shape.radius ?? 50) * 0.5,
          outerRadius: shape.radius ?? 50,
        });
      default:
        return null;
    }
  }, []);

  // Rendering functions
  const renderLine = useCallback(
    (line: Lines[], lineIndex: number) => {
      if (line.length < 1) return null;

      const lineId = `line-${lineIndex}`;
      const stroke = line[0]?.stroke || brushColor;
      const strokeWidth = line[0]?.strokeWidth || brushSize;
      const isSelected = selectedLineIds.includes(lineId);
      const isEraser = line[0]?.mode === "eraser";

      console.log(
        `[DEBUG] Creating line with stroke: ${stroke}, strokeWidth: ${strokeWidth}`
      );

      // Single point rendering
      if (line.length === 1) {
        const point = line[0];
        const konvaCircle = createKonvaCircle(
          {
            name: "drawing-line",
            id: lineId,
            x: point.x,
            y: point.y,
            radius: strokeWidth / 2,
            fill: stroke,
            globalCompositeOperation: isEraser
              ? "destination-out"
              : "source-over",
            draggable: tool === "select" && isSelected,
          },
          isSelected
        );

        addEventHandlers(konvaCircle, lineId, "line");
        console.log(
          `[DEBUG] Rendered single point line ${lineId}, selected: ${isSelected}, draggable: ${
            tool === "select" && isSelected
          }`
        );
        return konvaCircle;
      }

      // Multiple points rendering
      const konvaLine = createKonvaLine(
        {
          name: "drawing-line",
          id: lineId,
          points: line.flatMap((p) => [p.x, p.y]),
          stroke,
          strokeWidth,
          tension: 0.5,
          lineCap: "round",
          lineJoin: "round",
          globalCompositeOperation: isEraser
            ? "destination-out"
            : "source-over",
          draggable: tool === "select" && isSelected,
        },
        isSelected
      );

      addEventHandlers(konvaLine, lineId, "line");
      return konvaLine;
    },
    [
      brushColor,
      brushSize,
      selectedLineIds,
      tool,
      createKonvaCircle,
      createKonvaLine,
      addEventHandlers,
    ]
  );

  const renderShape = useCallback(
    (shape: Shape) => {
      const isSelected = selectedShapeIds.includes(shape.id);
      const konvaShape = createShapeNode(shape, isSelected);

      if (konvaShape) {
        konvaShape.draggable(tool === "select");
        addEventHandlers(konvaShape, shape.id, "shape");
        return konvaShape;
      }

      return null;
    },
    [selectedShapeIds, tool, createShapeNode, addEventHandlers]
  );

  // Transformer management
  const connectTransformer = useCallback(
    (transformer: Konva.Transformer, selectedIds: string[]) => {
      if (!layerRef.current) return;

      const selectedNodes = selectedIds
        .map((id) => layerRef.current!.findOne(`#${id}`))
        .filter(
          (node): node is Konva.Node => node !== undefined && node !== null
        );

      transformer.nodes(selectedNodes);
      if (selectedNodes.length > 0) {
        layerRef.current.batchDraw();
      }
    },
    []
  );

  const updateDraggableState = useCallback(() => {
    if (!layerRef.current) return;

    // Update shape draggable state
    const allShapes = layerRef.current.find(".shape");
    allShapes.forEach((shape) => {
      shape.draggable(tool === "select");
    });

    // Update line draggable state
    const allLines = layerRef.current.find(".drawing-line");
    const currentLines = layerRef.current.find(".current-line");

    [...allLines, ...currentLines].forEach((line) => {
      const isSelected = selectedLineIds.includes(line.id());
      line.draggable(tool === "select" && isSelected);
    });
  }, [tool, selectedShapeIds, selectedLineIds]);

  // Rendering effects
  useEffect(() => {
    if (
      !layerRef.current ||
      !isClient ||
      !isStageReady ||
      !isContainerMounted
    ) {
      console.log("[DEBUG] Rendering lines - not ready:", {
        hasLayer: !!layerRef.current,
        isClient,
        isStageReady,
        isContainerMounted,
      });
      return;
    }

    console.log("[DEBUG] Rendering lines started");

    // Clear existing lines
    const existingLines = layerRef.current.find(".drawing-line, .current-line");
    existingLines.forEach((line) => line.destroy());

    // Render completed lines
    lines.forEach((line, lineIndex) => {
      const konvaNode = renderLine(line, lineIndex);
      if (konvaNode) {
        layerRef.current!.add(konvaNode);
      }
    });

    // Render current line
    if (currentLine.length > 0) {
      const konvaNode = renderLine(currentLine, -1);
      if (konvaNode) {
        konvaNode.name("current-line");
        layerRef.current!.add(konvaNode);
      }
    }

    layerRef.current.batchDraw();
    console.log("[DEBUG] Lines rendering completed");
  }, [
    lines,
    currentLine,
    isClient,
    isStageReady,
    isContainerMounted,
    renderLine,
  ]);

  useEffect(() => {
    if (!layerRef.current || !isClient || !isStageReady || !isContainerMounted)
      return;

    console.log("[DEBUG] Rendering shapes started");

    // Clear existing shapes
    const existingShapes = layerRef.current.find(".shape");
    existingShapes.forEach((shape) => shape.destroy());

    // Render shapes
    shapes.forEach((shape) => {
      const konvaShape = renderShape(shape);
      if (konvaShape) {
        layerRef.current!.add(konvaShape);
      }
    });

    layerRef.current.batchDraw();
    console.log("[DEBUG] Shapes rendering completed");
  }, [shapes, isClient, isStageReady, isContainerMounted, renderShape]);

  // Transformer effects
  useEffect(() => {
    if (!transformerRef.current || !isStageReady || !isContainerMounted) return;

    console.log("[DEBUG] Connecting shape transformer to:", selectedShapeIds);
    connectTransformer(transformerRef.current, selectedShapeIds);
  }, [selectedShapeIds, connectTransformer, isStageReady, isContainerMounted]);

  useEffect(() => {
    if (!lineTransformerRef.current || !isStageReady || !isContainerMounted)
      return;

    console.log("[DEBUG] Connecting line transformer to:", selectedLineIds);
    connectTransformer(lineTransformerRef.current, selectedLineIds);
  }, [selectedLineIds, connectTransformer, isStageReady, isContainerMounted]);

  useEffect(() => {
    if (!isStageReady || !isContainerMounted) return;
    updateDraggableState();
  }, [updateDraggableState, isStageReady]);

  // Update draggable state when tool changes
  useEffect(() => {
    if (!layerRef.current || !isStageReady) return;

    console.log(
      "[DEBUG] Updating draggable state due to tool/selection change"
    );
    updateDraggableState();
  }, [
    tool,
    selectedShapeIds,
    selectedLineIds,
    isStageReady,
    updateDraggableState,
  ]);

  // Selection box rendering
  useEffect(() => {
    if (!layerRef.current || !isClient || !isStageReady || !isContainerMounted)
      return;

    // Clear existing selection boxes
    const existingBoxes = layerRef.current.find(".selection-box");
    existingBoxes.forEach((box) => box.destroy());

    if (!selectionBox) return;

    const x = Math.min(selectionBox.startX, selectionBox.endX);
    const y = Math.min(selectionBox.startY, selectionBox.endY);
    const width = Math.abs(selectionBox.endX - selectionBox.startX);
    const height = Math.abs(selectionBox.endY - selectionBox.startY);

    if (
      width <= CONSTANTS.CANVAS.MIN_SELECTION_SIZE ||
      height <= CONSTANTS.CANVAS.MIN_SELECTION_SIZE
    )
      return;

    const selectionRect = new Konva.Rect({
      name: "selection-box",
      x,
      y,
      width,
      height,
      stroke: CONSTANTS.COLORS.SELECTION_BOX,
      strokeWidth: CONSTANTS.SIZES.SELECTION_STROKE,
      dash: CONSTANTS.DASH_PATTERN,
      fill: CONSTANTS.COLORS.SELECTION_BOX_FILL,
    });

    selectionRect.on("click", () => {
      if (tool !== "select") return;
      onClearSelection();
    });

    layerRef.current.add(selectionRect);
    layerRef.current.batchDraw();
  }, [
    selectionBox,
    isClient,
    isStageReady,
    isContainerMounted,
    tool,
    onClearSelection,
  ]);

  // PDF rendering
  useEffect(() => {
    if (
      !layerRef.current ||
      !isClient ||
      !isStageReady ||
      pdfPages.length === 0
    )
      return;

    const currentPdfImage = pdfPages[currentPage];
    if (!currentPdfImage) return;

    // Clear existing PDF images
    const existingImages = layerRef.current.find(".pdf-image");
    existingImages.forEach((image) => image.destroy());

    const stage = stageRef.current;
    if (!stage) return;

    // Calculate scaling
    const maxWidth = stage.width() * CONSTANTS.CANVAS.PDF_SCALE_FACTOR;
    const maxHeight = stage.height() * CONSTANTS.CANVAS.PDF_SCALE_FACTOR;

    const scale = Math.min(
      maxWidth / currentPdfImage.width,
      maxHeight / currentPdfImage.height
    );

    const scaledWidth = currentPdfImage.width * scale;
    const scaledHeight = currentPdfImage.height * scale;

    // Calculate position
    const centerX = (stage.width() - scaledWidth) / 2;
    const centerY = (stage.height() - scaledHeight) / 2;
    const x = centerX + pdfOffset.x;
    const y = centerY + pdfOffset.y;

    // Create Konva image
    const konvaImage = new Konva.Image({
      name: "pdf-image",
      image: currentPdfImage,
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });

    layerRef.current.add(konvaImage);
    konvaImage.moveToBottom();

    onPdfImageChange(currentPdfImage);
    layerRef.current.batchDraw();
  }, [
    pdfPages,
    currentPage,
    pdfOffset,
    isClient,
    isStageReady,
    onPdfImageChange,
  ]);

  // Layer ordering
  useEffect(() => {
    if (!layerRef.current || !isClient || !isStageReady) return;

    const layer = layerRef.current;

    // Order: PDF -> Shapes -> Lines -> Selection Box -> Transformers
    layer.find(".pdf-image").forEach((img) => img.moveToBottom());
    layer.find(".shape").forEach((shape) => shape.moveToTop());
    layer
      .find(".drawing-line, .current-line")
      .forEach((line) => line.moveToTop());
    layer.find(".selection-box").forEach((box) => box.moveToTop());

    if (transformerRef.current) transformerRef.current.moveToTop();
    if (lineTransformerRef.current) lineTransformerRef.current.moveToTop();

    layer.batchDraw();
  }, [shapes, lines, isClient, isStageReady]);

  // Initialize stage and layer
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const container = document.getElementById("canvas-container");
    if (!container) return;

    setIsContainerMounted(true);

    const stage = new Konva.Stage({
      container: "canvas-container",
      width: container.clientWidth,
      height: container.clientHeight,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    stageRef.current = stage;
    layerRef.current = layer;

    // Create transformers
    const transformer = new Konva.Transformer({
      rotateEnabled: true,
      resizeEnabled: true,
      keepRatio: false,
      anchorFill: CONSTANTS.COLORS.WHITE,
      anchorStrokeWidth: CONSTANTS.SIZES.SHAPE_STROKE,
      rotateAnchorFill: CONSTANTS.COLORS.WHITE,
      rotateAnchorStrokeWidth: CONSTANTS.SIZES.SHAPE_STROKE,
    });

    const lineTransformer = new Konva.Transformer({
      rotateEnabled: true,
      resizeEnabled: true,
      keepRatio: false,
      anchorFill: CONSTANTS.COLORS.WHITE,
      anchorStrokeWidth: CONSTANTS.SIZES.LINE_STROKE,
      rotateAnchorFill: CONSTANTS.COLORS.WHITE,
      rotateAnchorStrokeWidth: CONSTANTS.SIZES.LINE_STROKE,
    });

    layer.add(transformer);
    layer.add(lineTransformer);

    transformerRef.current = transformer;
    lineTransformerRef.current = lineTransformer;

    setIsStageReady(true);

    // Handle window resize
    const handleResize = () => {
      if (container && stage) {
        stage.width(container.clientWidth);
        stage.height(container.clientHeight);
        stage.batchDraw();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      stage.destroy();
    };
  }, [isClient]);

  // Handle mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!stageRef.current || !layerRef.current) return;

      const stage = stageRef.current;
      const pos = stage.getPointerPosition();
      if (!pos) return;

      // Konva 이벤트 객체 생성
      const konvaEvent = {
        evt: e.nativeEvent,
        target: stage,
        currentTarget: stage,
        type: "mousedown",
        cancelBubble: false,
        pointerId: 0,
      } as unknown as Konva.KonvaEventObject<MouseEvent>;

      onMouseDown(konvaEvent);
    },
    [onMouseDown]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!stageRef.current || !layerRef.current) return;

      const stage = stageRef.current;
      const pos = stage.getPointerPosition();
      if (!pos) return;

      const mouseEvent = {
        evt: e.nativeEvent,
        target: stage,
        currentTarget: stage,
        type: "mousemove",
        cancelBubble: false,
        pointerId: 0,
      } as unknown as Konva.KonvaEventObject<MouseEvent>;

      onMouseMove(mouseEvent);
    },
    [onMouseMove]
  );

  const handleMouseUp = useCallback(() => {
    onMouseUp();
  }, [onMouseUp]);

  return (
    <div
      id="canvas-container"
      className="w-full h-full bg-white border border-gray-300 rounded-lg overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
};

export default CanvasComponent;
