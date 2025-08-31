"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function WhiteboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileName = searchParams.get("fileName") || "제목 없음";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(2);
  const [brushColor, setBrushColor] = useState("#000000");
  const [tool, setTool] = useState<"pen" | "eraser">("pen");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 크기 설정
    const resizeCanvas = () => {
      canvas.width = window.innerWidth - 40;
      canvas.height = window.innerHeight - 120;

      // 배경을 흰색으로 설정
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = tool === "eraser" ? brushSize * 3 : brushSize;
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : brushColor;
    ctx.lineCap = "round";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-800">{fileName}</h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={clearCanvas}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              지우기
            </button>
            <button
              onClick={saveCanvas}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white shadow-sm border-b px-6 py-3">
        <div className="flex items-center space-x-6">
          {/* Tool Selection */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTool("pen")}
              className={`p-2 rounded-lg ${
                tool === "pen"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              title="펜"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`p-2 rounded-lg ${
                tool === "eraser"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              title="지우개"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>

          {/* Brush Size */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">브러시 크기:</span>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-600 w-8">{brushSize}</span>
          </div>

          {/* Color Picker */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">색상:</span>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="p-5">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="border border-gray-300 rounded-lg shadow-lg cursor-crosshair mx-auto"
        />
      </div>
    </div>
  );
}
