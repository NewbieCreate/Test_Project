// WhiteBoard 컴포넌트 props 인터페이스
export interface WhiteBoardProps {
  fileName?: string;
  onFileNameChange?: (fileName: string) => void;
  onSave?: () => void;
  onShare?: () => void;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

// WhiteBoard 데이터 인터페이스
export interface WhiteBoardData {
  lines: Lines[][];
  currentLine: Lines[];
  shapes: Shape[];
  selectedShapeIds: string[];
  selectedLineIds: string[];
  selectionBox: SelectionBox | null;
  tool: Tool;
  brushColor: string;
  brushSize: number;
  pdfPages: PdfImageInfo[];
  currentPage: number;
  pdfOffset: PdfOffset;
  canUndo: boolean;
  canRedo: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleShapeClick: (shapeId: string, e: MouseEvent) => void;
  handleLineClick: (lineId: string, e: MouseEvent) => void;
  handleLineDragEnd: (lineId: string, newPoints: Lines[]) => void;
  handleShapeDragEnd: (
    shapeId: string,
    newPosition: { x: number; y: number }
  ) => void;
  handleShapeTransformEnd: (
    shapeId: string,
    newTransform: Record<string, unknown>
  ) => void;
  handleLineTransformEnd: (
    lineId: string,
    newTransform: Record<string, unknown>
  ) => void;
  handleClearSelection: () => void;
  handlePdfImageChange: (pages: PdfImageInfo[]) => void;
  addShape: (type: Shape["type"], x: number, y: number) => void;
  addText: (text: string, x: number, y: number) => void;
  addImage: (imageUrl: string, x: number, y: number) => void;
  deleteSelectedShapes: () => void;
  clearCanvas: () => void;
  resetPdfPosition: () => void;
  undo: () => void;
  redo: () => void;
  setTool: (tool: Tool) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setPdfPages: (pages: PdfImageInfo[]) => void;
  setCurrentPage: (page: number) => void;
  setPdfOffset: (offset: PdfOffset) => void;
}

export interface Shape {
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

export interface Lines {
  id?: string;
  x: number;
  y: number;
  stroke: string;
  strokeWidth: number;
  mode: string;
}

export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface HistoryState {
  lines: Lines[][];
  shapes: Shape[];
  selectedShapeIds: string[];
  selectedLineIds: string[];
  timestamp: number;
}

export interface PdfImageInfo {
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Tool = "pen" | "eraser" | "select";

export interface MousePosition {
  x: number;
  y: number;
}

export interface PdfOffset {
  x: number;
  y: number;
}
