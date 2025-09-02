"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Shape, Tool } from "../types";

type ShapeType = Shape["type"] | "text";

interface ToolBarProps {
  mode: Tool;
  setMode(mode: Tool): void;
  handleUndo(): void;
  handleRedo(): void;
  handleDelete?: () => void;
  handleDuplicate?: () => void;
  addShape?: (type: Exclude<ShapeType, "text">) => void;
  addText?: (text: string, x: number, y: number) => void;
  addImage?: (imageSrc: string, x: number, y: number) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSave?: () => void;
  onShare?: () => void;
}

const ToolBar: React.FC<ToolBarProps> = ({
  mode,
  setMode,
  handleUndo,
  handleRedo,
  handleDelete,
  handleDuplicate,
  addShape,
  addText,
  canUndo = false,
  canRedo = false,
  onSave,
  onShare,
}) => {
  const [activeButton, setActiveButton] = useState<string | null>(mode);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [stickyInput, setStickyInput] = useState("");
  const [showStickyInput, setShowStickyInput] = useState(false);

  // 툴 클릭 핸들러 - 최적화된 버전
  const handleToolClick = useCallback(
    (tool: string) => {
      console.log("[DEBUG] ToolBar handleToolClick called with tool:", tool);

      // 액션 툴
      if (tool === "undo") return handleUndo();
      if (tool === "redo") return handleRedo();
      if (tool === "delete") return handleDelete?.();
      if (tool === "duplicate") return handleDuplicate?.();

      // 펜, 지우개, 선택 모드는 단순히 모드만 변경
      if (["pen", "eraser", "select"].includes(tool)) {
        console.log("[DEBUG] Setting tool mode to:", tool);
        setActiveButton(tool);
        setMode(tool as Tool);
        return;
      }

      // 도형 추가 (도형 툴 클릭 시)
      const shapeTools: Exclude<ShapeType, "text">[] = [
        "rectangle",
        "circle",
        "triangle",
        "star",
        "arrow",
      ];
      if (addShape && shapeTools.includes(tool as Exclude<ShapeType, "text">)) {
        addShape(tool as Exclude<ShapeType, "text">);
        // 도형 추가 후 펜 모드로 돌아가기
        setActiveButton("pen");
        setMode("pen" as Tool);
      }
    },
    [setMode, handleUndo, handleRedo, handleDelete, handleDuplicate, addShape]
  );

  // 텍스트 제출 핸들러 - 최적화된 버전
  const handleTextSubmit = useCallback(() => {
    if (addText && textInput.trim()) {
      addText(textInput, window.innerWidth / 2, window.innerHeight / 2);
      setTextInput("");
      setShowTextInput(false);
      setActiveButton("pen");
      setMode("pen" as Tool);
    }
  }, [addText, textInput, setMode]);

  // 텍스트 입력 취소 핸들러 - 최적화된 버전
  const handleTextCancel = useCallback(() => {
    setShowTextInput(false);
    setActiveButton("pen");
    setMode("pen" as Tool);
  }, [setMode]);

  // 스티키 노트 입력 취소 핸들러
  const handleStickyCancel = useCallback(() => {
    setShowStickyInput(false);
    setActiveButton("pen");
    setMode("pen" as Tool);
  }, [setMode]);

  // 메모이제이션된 툴 버튼들
  const toolButtons = useMemo(
    () => (
      <div className="flex items-center space-x-2">
        {["pen", "eraser", "select", "move", "zoom"].map((tool) => (
          <button
            key={tool}
            onClick={() => handleToolClick(tool)}
            className={`px-3 py-2 rounded text-sm ${
              activeButton === tool
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title={
              tool === "pen"
                ? "펜 도구"
                : tool === "eraser"
                ? "지우개"
                : tool === "select"
                ? "선택 도구"
                : tool === "move"
                ? "이동 도구"
                : "확대/축소 도구"
            }
          >
            {tool === "pen"
              ? "✏️"
              : tool === "eraser"
              ? "🧽"
              : tool === "select"
              ? "👆"
              : "🔍"}
          </button>
        ))}
      </div>
    ),
    [activeButton, handleToolClick]
  );

  // 메모이제이션된 도형 버튼들
  const shapeButtons = useMemo(
    () => (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 mr-2">도형:</span>
        {(["rectangle", "circle", "triangle", "star", "arrow"] as const).map(
          (shape) => (
            <button
              key={shape}
              onClick={() => handleToolClick(shape)}
              className="px-3 py-2 rounded text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
              title={
                shape === "rectangle"
                  ? "사각형"
                  : shape === "circle"
                  ? "원"
                  : shape === "triangle"
                  ? "삼각형"
                  : shape === "star"
                  ? "별"
                  : "화살표"
              }
            >
              {shape === "rectangle"
                ? "□"
                : shape === "circle"
                ? "○"
                : shape === "triangle"
                ? "△"
                : shape === "star"
                ? "★"
                : "→"}
            </button>
          )
        )}
      </div>
    ),
    [handleToolClick]
  );

  // 메모이제이션된 액션 버튼들
  const actionButtons = useMemo(
    () => (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleToolClick("undo")}
          disabled={!canUndo}
          className={`px-3 py-2 rounded text-sm ${
            canUndo
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-gray-50 text-gray-400 cursor-not-allowed"
          }`}
          title="실행 취소 (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          onClick={() => handleToolClick("redo")}
          disabled={!canRedo}
          className={`px-3 py-2 rounded text-sm ${
            canRedo
              ? "bg-gray-50 text-gray-400 cursor-not-allowed"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          title="다시 실행 (Ctrl+Y)"
        >
          ↷
        </button>
        <button
          onClick={() => handleToolClick("delete")}
          className="px-3 py-2 rounded text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
          title="삭제 (Delete)"
        >
          🗑️
        </button>
      </div>
    ),
    [canUndo, canRedo, handleToolClick]
  );

  // 메모이제이션된 저장/공유 버튼들
  const saveShareButtons = useMemo(
    () => (
      <div className="flex items-center space-x-2">
        {onSave && (
          <button
            onClick={onSave}
            className="px-3 py-2 rounded text-sm bg-green-600 text-white hover:bg-green-700 transition-colors"
            title="저장 (Ctrl+S)"
          >
            💾 저장
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="px-3 py-2 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            title="공유"
          >
            📤 공유
          </button>
        )}
      </div>
    ),
    [onSave, onShare, handleToolClick]
  );

  // 메모이제이션된 텍스트 입력 폼
  const textInputForm = useMemo(
    () =>
      showTextInput && (
        <div className="flex items-center space-x-2">
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="텍스트 입력"
            className="border p-1 rounded text-sm"
            onKeyPress={(e) => e.key === "Enter" && handleTextSubmit()}
          />
          <select className="border p-1 rounded text-sm">
            <option value="16">16px</option>
            <option value="20">20px</option>
            <option value="24">24px</option>
            <option value="32">32px</option>
            <option value="48">48px</option>
          </select>
          <select className="border p-1 rounded text-sm">
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times</option>
            <option value="Courier New">Courier</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
          <button
            onClick={handleTextSubmit}
            className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
          >
            추가
          </button>
          <button
            onClick={handleTextCancel}
            className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
          >
            취소
          </button>
        </div>
      ),
    [showTextInput, textInput, handleTextSubmit, handleTextCancel]
  );

  return (
    <div className="flex items-center space-x-4">
      {/* 메인 도구 버튼들 */}
      {toolButtons}

      {/* 빠른 액세스 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 mr-2">빠른:</span>
        <button
          onClick={() => handleToolClick("undo")}
          disabled={!canUndo}
          className={`px-2 py-1 rounded text-xs ${
            canUndo
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-gray-50 text-gray-400 cursor-not-allowed"
          }`}
          title="실행 취소"
        >
          ↶
        </button>
        <button
          onClick={() => handleToolClick("redo")}
          disabled={!canRedo}
          className={`px-2 py-1 rounded text-xs ${
            canRedo
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-gray-50 text-gray-400 cursor-not-allowed"
          }`}
          title="다시 실행"
        >
          ↷
        </button>
      </div>

      {/* 브러시 크기 조절 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 mr-2">크기:</span>
        <div className="flex space-x-1">
          {[1, 2, 5, 10, 15, 20, 30].map((size) => (
            <button
              key={size}
              onClick={() => handleToolClick(`size_${size}`)}
              className={`px-2 py-1 rounded text-xs ${
                size === 2
                  ? "bg-blue-100 text-blue-600 border border-blue-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title={`${size}px`}
            >
              {size}
            </button>
          ))}
        </div>
        <input
          type="range"
          min="1"
          max="50"
          defaultValue="2"
          onChange={(e) => handleToolClick(`size_${e.target.value}`)}
          className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          title="브러시 크기 조절"
        />
        <input
          type="color"
          value="#000000"
          onChange={(e) => handleToolClick(`color_${e.target.value}`)}
          className="w-8 h-8 rounded border border-gray-300"
          title="커스텀 색상"
        />
      </div>

      {/* 도형 버튼들 */}
      {shapeButtons}

      {/* 액션 버튼들 */}
      {actionButtons}

      {/* 색상 팔레트 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 mr-2">색상:</span>
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
            "#FFC0CB",
            "#32CD32",
            "#FFD700",
            "#FF69B4",
            "#00CED1",
          ].map((color) => (
            <button
              key={color}
              onClick={() => handleToolClick(`color_${color}`)}
              className={`w-6 h-6 rounded border-2 ${
                color === "#000000"
                  ? "border-blue-500 scale-110"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* 저장/공유 버튼 */}
      {saveShareButtons}

      {/* 텍스트 입력 */}
      {textInputForm}

      {/* 스티키 노트 입력 */}
      {showStickyInput && (
        <div className="flex items-center space-x-2">
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => {
                if (addText && stickyInput.trim()) {
                  addText(
                    stickyInput,
                    window.innerWidth / 2,
                    window.innerHeight / 2
                  );
                  setStickyInput("");
                  setShowStickyInput(false);
                  setActiveButton("pen");
                  setMode("pen" as Tool);
                }
              }}
              className="bg-yellow-600 text-white px-2 py-1 rounded text-sm"
            >
              추가
            </button>
            <button
              onClick={handleStickyCancel}
              className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolBar;
