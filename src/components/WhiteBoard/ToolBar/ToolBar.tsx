"use client";

import React, { useState } from "react";

type ShapeType =
  | "rectangle"
  | "circle"
  | "triangle"
  | "star"
  | "arrow"
  | "text";

interface ToolBarProps {
  mode: string;
  setMode(mode: string): void;
  handleUndo(): void;
  handleRedo(): void;
  handleDelete?: () => void;
  handleDuplicate?: () => void;
  addShape?: (type: Exclude<ShapeType, "text">) => void;
  addText?: (text: string, x: number, y: number) => void;
  addImage?: (imageSrc: string, x: number, y: number) => void;
  canUndo?: boolean;
  canRedo?: boolean;
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
  addImage,
  canUndo = false,
  canRedo = false,
}) => {
  const [activeButton, setActiveButton] = useState<string | null>(mode);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [imageInput, setImageInput] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  const handleToolClick = (tool: string) => {
    // 액션 툴
    if (tool === "undo") return handleUndo();
    if (tool === "redo") return handleRedo();
    if (tool === "delete") return handleDelete?.();
    if (tool === "duplicate") return handleDuplicate?.();

    // 펜, 지우개, 선택 모드는 단순히 모드만 변경
    if (["pen", "eraser", "select"].includes(tool)) {
      setActiveButton(tool);
      setMode(tool);
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
      setMode("pen");
    }

    if (tool === "text") setShowTextInput(true);
    if (tool === "image") setShowImageInput(true);
  };

  const handleTextSubmit = () => {
    if (addText && textInput.trim()) {
      addText(textInput, window.innerWidth / 2, window.innerHeight / 2);
      setTextInput("");
      setShowTextInput(false);
      setActiveButton("pen");
      setMode("pen");
    }
  };

  const handleImageSubmit = () => {
    if (addImage && imageInput.trim()) {
      addImage(imageInput, window.innerWidth / 2, window.innerHeight / 2);
      setImageInput("");
      setShowImageInput(false);
      setActiveButton("pen");
      setMode("pen");
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {/* 메인 도구 버튼들 */}
      <div className="flex items-center space-x-2">
        {["pen", "eraser", "select"].map((tool) => (
          <button
            key={tool}
            onClick={() => handleToolClick(tool)}
            className={`px-3 py-2 rounded text-sm ${
              activeButton === tool
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tool === "pen" ? "펜" : tool === "eraser" ? "지우개" : "선택"}
          </button>
        ))}
      </div>

      {/* 도형 버튼들 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 mr-2">도형:</span>
        {(["rectangle", "circle", "triangle", "star"] as const).map((shape) => (
          <button
            key={shape}
            onClick={() => handleToolClick(shape)}
            className="px-3 py-2 rounded text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            {shape === "rectangle"
              ? "□"
              : shape === "circle"
              ? "○"
              : shape === "triangle"
              ? "△"
              : "★"}
          </button>
        ))}
      </div>

      {/* 액션 버튼들 */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleToolClick("undo")}
          disabled={!canUndo}
          className={`px-3 py-2 rounded text-sm ${
            canUndo
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-gray-50 text-gray-400 cursor-not-allowed"
          }`}
        >
          ↶
        </button>
        <button
          onClick={() => handleToolClick("redo")}
          disabled={!canRedo}
          className={`px-3 py-2 rounded text-sm ${
            canRedo
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-gray-50 text-gray-400 cursor-not-allowed"
          }`}
        >
          ↷
        </button>
        <button
          onClick={() => handleToolClick("delete")}
          className="px-3 py-2 rounded text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          삭제
        </button>
        <button
          onClick={() => handleToolClick("duplicate")}
          className="px-3 py-2 rounded text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          복제
        </button>
      </div>

      {/* 텍스트/이미지 추가 버튼 */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleToolClick("text")}
          className="px-3 py-2 rounded text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          텍스트
        </button>
        <button
          onClick={() => handleToolClick("image")}
          className="px-3 py-2 rounded text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          이미지
        </button>
      </div>

      {/* 텍스트 입력 */}
      {showTextInput && (
        <div className="flex items-center space-x-2">
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="텍스트 입력"
            className="border p-1 rounded text-sm"
            onKeyPress={(e) => e.key === "Enter" && handleTextSubmit()}
          />
          <button
            onClick={handleTextSubmit}
            className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
          >
            추가
          </button>
          <button
            onClick={() => {
              setShowTextInput(false);
              setActiveButton("pen");
              setMode("pen");
            }}
            className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
          >
            취소
          </button>
        </div>
      )}

      {/* 이미지 입력 */}
      {showImageInput && (
        <div className="flex items-center space-x-2">
          <input
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            placeholder="이미지 URL"
            className="border p-1 rounded text-sm"
            onKeyPress={(e) => e.key === "Enter" && handleImageSubmit()}
          />
          <button
            onClick={handleImageSubmit}
            className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
          >
            추가
          </button>
          <button
            onClick={() => {
              setShowImageInput(false);
              setActiveButton("pen");
              setMode("pen");
            }}
            className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
};

export default ToolBar;
