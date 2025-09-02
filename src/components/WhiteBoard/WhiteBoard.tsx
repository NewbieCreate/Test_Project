//WhiteBoard.tsx
"use client";

import React from "react";
import useWhiteBoard from "./hooks/useWhiteBoard";
import CanvasComponent from "./CanvasComponent";
import ToolBar from "./ToolBar/ToolBar";
import { WhiteBoardProps } from "./types";

const WhiteBoard: React.FC<WhiteBoardProps> = ({
  fileName,
  onSave,
  onShare,
  autoSave = false,
  autoSaveInterval = 30000, // 30초
}) => {
  console.log("[DEBUG] WhiteBoard component rendering");
  const whiteboardData = useWhiteBoard();

  console.log(
    "[DEBUG] WhiteBoard render - tool:",
    whiteboardData.tool,
    "brushColor:",
    whiteboardData.brushColor,
    "brushSize:",
    whiteboardData.brushSize,
    "fileName:",
    fileName
  );

  // 자동 저장 기능
  React.useEffect(() => {
    if (!autoSave) return;

    const interval = setInterval(() => {
      console.log("[DEBUG] Auto-saving whiteboard data...");
      if (onSave) {
        onSave();
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, onSave]);

  // 디버그 정보를 위한 상태 로깅
  React.useEffect(() => {
    console.log("[DEBUG] WhiteBoard state updated:", {
      tool: whiteboardData.tool,
      brushColor: whiteboardData.brushColor,
      brushSize: whiteboardData.brushSize,
      linesCount: whiteboardData.lines.length,
      shapesCount: whiteboardData.shapes.length,
      selectedShapes: whiteboardData.selectedShapeIds.length,
      selectedLines: whiteboardData.selectedLineIds.length,
      fileName,
    });
  }, [
    whiteboardData.tool,
    whiteboardData.brushColor,
    whiteboardData.brushSize,
    whiteboardData.lines.length,
    whiteboardData.shapes.length,
    whiteboardData.selectedShapeIds.length,
    whiteboardData.selectedLineIds.length,
    fileName,
  ]);

  // 초기화 상태 확인
  const isReady =
    whiteboardData.lines !== undefined &&
    whiteboardData.shapes !== undefined &&
    whiteboardData.tool !== undefined;

  if (!isReady) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600 text-lg mb-2">화이트보드 초기화 중</div>
          <div className="text-gray-500 text-sm">
            필요한 컴포넌트들을 로딩하고 있습니다...
          </div>
        </div>
      </div>
    );
  }

  const {
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
    canUndo,
    canRedo,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleShapeClick,
    handleLineClick,
    handleLineDragEnd,
    handleShapeDragEnd,
    handleShapeTransformEnd,
    handleLineTransformEnd,
    handleClearSelection,
    handlePdfImageChange,
    addShape,
    addText,
    addImage,
    deleteSelectedShapes,
    undo,
    redo,
    setTool,
    setBrushColor,
    setBrushSize,
  } = whiteboardData;

  return (
    <div className="w-full h-screen flex flex-col">
      {/* 메인 툴바 */}
      <div className="p-4 bg-white border-b border-gray-200">
        <ToolBar
          mode={tool}
          setMode={setTool}
          handleUndo={undo}
          handleRedo={redo}
          handleDelete={deleteSelectedShapes}
          addShape={addShape}
          addText={addText}
          addImage={addImage}
          canUndo={canUndo}
          canRedo={canRedo}
          onSave={onSave}
          onShare={onShare}
        />
      </div>

      {/* 펜 도구 서브 툴바 (브러시 크기 및 색상) */}
      {tool === "pen" && (
        <div className="bg-white shadow-sm border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* 브러시 크기 조절 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">브러시 크기:</span>
                <div className="flex space-x-1">
                  {[2, 5, 10, 15, 20].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        console.log(`[DEBUG] Setting brush size to: ${size}`);
                        setBrushSize(size);
                      }}
                      className={`px-2 py-1 rounded text-xs ${
                        brushSize === size
                          ? "bg-blue-100 text-blue-600 border border-blue-300"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* 색상 선택 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">색상:</span>
                <div className="flex space-x-1">
                  {[
                    "#000000",
                    "#FF0000",
                    "#00FF00",
                    "#0000FF",
                    "#FFFF00",
                    "#FF00FF",
                    "#00FFFF",
                    "#FFA500",
                    "#800080",
                    "#A52A2A",
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        console.log(`[DEBUG] Setting brush color to: ${color}`);
                        setBrushColor(color);
                      }}
                      className={`w-6 h-6 rounded border-2 ${
                        brushColor === color
                          ? "border-blue-500 scale-110"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                {/* 커스텀 색상 선택 */}
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300"
                  title="커스텀 색상"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 선택된 객체 정보 */}
      {selectedShapeIds.length > 0 && (
        <div className="bg-blue-50 border-b px-6 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              선택됨: {selectedShapeIds.length}개 객체
            </span>
            <button
              onClick={deleteSelectedShapes}
              className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 text-sm"
            >
              삭제
            </button>
          </div>
        </div>
      )}

      {/* 캔버스 */}
      <div className="flex-1 p-4 bg-gray-50">
        <CanvasComponent
          lines={lines}
          currentLine={currentLine}
          shapes={shapes}
          selectedShapeIds={selectedShapeIds}
          selectedLineIds={selectedLineIds}
          selectionBox={selectionBox}
          tool={tool}
          brushColor={brushColor}
          brushSize={brushSize}
          pdfPages={pdfPages}
          currentPage={currentPage}
          pdfOffset={pdfOffset}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onShapeClick={handleShapeClick}
          onLineClick={handleLineClick}
          onLineDragEnd={handleLineDragEnd}
          onShapeDragEnd={handleShapeDragEnd}
          onShapeTransformEnd={handleShapeTransformEnd}
          onLineTransformEnd={handleLineTransformEnd}
          onClearSelection={handleClearSelection}
          onPdfImageChange={handlePdfImageChange}
        />
      </div>
    </div>
  );
};

export default WhiteBoard;
