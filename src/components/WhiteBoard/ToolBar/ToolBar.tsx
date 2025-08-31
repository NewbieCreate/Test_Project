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
  penColor: string;
  setPenColor(color: string): void;
  strokeWidth: number;
  setStrokeWidth(width: number): void;
  handleUndo(): void;
  handleRedo(): void;
  handleDelete?: () => void;
  handleDuplicate?: () => void;
  addShape?: (type: Exclude<ShapeType, "text">, x: number, y: number) => void;
  addText?: (text: string, x: number, y: number) => void;
  addImage?: (imageSrc: string, x: number, y: number) => void;
}

const ToolBar: React.FC<ToolBarProps> = ({
  mode,
  setMode,
  penColor,
  setPenColor,
  strokeWidth,
  setStrokeWidth,
  handleUndo,
  handleRedo,
  handleDelete,
  handleDuplicate,
  addShape,
  addText,
  addImage,
}) => {
  const [activeButton, setActiveButton] = useState<string | null>(mode);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [imageInput, setImageInput] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  const colorArray = [
    "#000000",
    "#FFFFFF",
    "#CF3F41",
    "#2D66CB",
    "#E6B649",
    "#479734",
  ];
  const strokeWidths = [5, 10, 15];

  const handleToolClick = (tool: string) => {
    // 액션 툴
    if (tool === "undo") return handleUndo();
    if (tool === "redo") return handleRedo();
    if (tool === "delete") return handleDelete?.();
    if (tool === "duplicate") return handleDuplicate?.();

    setActiveButton(tool);
    setMode(tool);

    // 도형 추가
    const shapeTools: Exclude<ShapeType, "text">[] = [
      "rectangle",
      "circle",
      "triangle",
      "star",
      "arrow",
    ];
    if (addShape && shapeTools.includes(tool as Exclude<ShapeType, "text">)) {
      addShape(
        tool as Exclude<ShapeType, "text">,
        window.innerWidth / 2,
        window.innerHeight / 2
      );
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
    <div className="flex gap-2">
      {/* 메인 툴바 */}
      <div className="flex flex-col bg-white p-2 rounded shadow-lg w-[80px]">
        {[
          "pen",
          "eraser",
          "rectangle",
          "circle",
          "triangle",
          "star",
          "arrow",
          "text",
          "image",
        ].map((tool) => (
          <button
            key={tool}
            onClick={() => handleToolClick(tool)}
            className={`mb-1 p-2 rounded hover:bg-gray-200 ${
              activeButton === tool ? "bg-blue-50" : ""
            }`}
          >
            {tool}
          </button>
        ))}
        {/* 액션 버튼 */}
        {["undo", "redo", "delete", "duplicate"].map((tool) => (
          <button
            key={tool}
            onClick={() => handleToolClick(tool)}
            className="mb-1 p-2 rounded hover:bg-gray-200"
          >
            {tool}
          </button>
        ))}
      </div>

      {/* 펜 서브 패널 */}
      {activeButton === "pen" && (
        <div className="flex flex-col bg-white p-2 rounded shadow-lg">
          <div className="mb-2">
            <span>선 굵기</span>
            <div className="flex gap-1 mt-1">
              {strokeWidths.map((w) => (
                <button
                  key={w}
                  onClick={() => setStrokeWidth(w)}
                  className={`p-2 rounded ${
                    strokeWidth === w ? "bg-blue-50" : ""
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span>색상</span>
            <div className="flex gap-1 mt-1">
              {colorArray.map((c) => (
                <div
                  key={c}
                  onClick={() => setPenColor(c)}
                  className={`w-6 h-6 rounded cursor-pointer border ${
                    penColor === c ? "border-blue-500" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 텍스트 입력 */}
      {showTextInput && (
        <div className="flex flex-col bg-white p-2 rounded shadow-lg">
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="텍스트 입력"
            className="border p-1 rounded mb-1"
          />
          <div className="flex gap-1">
            <button
              onClick={handleTextSubmit}
              className="bg-blue-600 text-white px-2 py-1 rounded"
            >
              추가
            </button>
            <button
              onClick={() => {
                setShowTextInput(false);
                setActiveButton("pen");
                setMode("pen");
              }}
              className="bg-gray-500 text-white px-2 py-1 rounded"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 이미지 입력 */}
      {showImageInput && (
        <div className="flex flex-col bg-white p-2 rounded shadow-lg">
          <input
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            placeholder="이미지 URL"
            className="border p-1 rounded mb-1"
          />
          <div className="flex gap-1">
            <button
              onClick={handleImageSubmit}
              className="bg-blue-600 text-white px-2 py-1 rounded"
            >
              추가
            </button>
            <button
              onClick={() => {
                setShowImageInput(false);
                setActiveButton("pen");
                setMode("pen");
              }}
              className="bg-gray-500 text-white px-2 py-1 rounded"
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
