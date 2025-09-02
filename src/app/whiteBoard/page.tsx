//page.tsx
"use client";

import React, { useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import dynamic from "next/dynamic";
import useWhiteBoard from "@/components/WhiteBoard/WhiteBoard";
import ToolBar from "@/components/WhiteBoard/ToolBar/ToolBar";

// CanvasComponent를 SSR 없이 동적 임포트
const CanvasComponent = dynamic(
  () => import("@/components/WhiteBoard/CanvasComponent"),
  {
    ssr: false,
  }
);

export default function WhiteboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileName = searchParams.get("fileName") || "제목 없음";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // WhiteBoard 훅 사용
  const {
    // 상태
    lines,
    currentLine,
    shapes,
    selectedShapeIds,
    selectedLineIds = [], // 기본값 추가
    selectionBox,
    tool,
    brushColor,
    brushSize,
    pdfPages,
    currentPage,
    pdfOffset,

    // 히스토리 상태
    canUndo,
    canRedo,

    // 이벤트 핸들러
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleShapeClick,
    handleLineClick = () => {}, // 기본값 추가
    handleShapeDragEnd,
    handleShapeTransformEnd,
    handleSelectionBoxChange,
    handlePdfImageChange,

    // 액션 함수
    addShape,
    addText,
    addImage,
    deleteSelectedShapes,
    clearCanvas,
    resetPdfPosition,
    undo,
    redo,

    // 상태 설정 함수
    setTool,
    setBrushColor,
    setBrushSize,
    setPdfPages,
    setCurrentPage,
  } = useWhiteBoard();

  // ToolBar에서 사용할 추가 함수들
  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  const handleDuplicate = () => {
    // 선택된 도형 복제 로직 (나중에 구현)
    console.log("Duplicate");
  };

  const saveCanvas = () => {
    // 캔버스 저장 로직은 CanvasComponent에서 처리
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const dataURL = canvas.toDataURL();
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = dataURL;
      link.click();
    }
  };

  const handlePdfUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      alert("PDF 파일만 업로드 가능합니다.");
      return;
    }

    setIsPdfLoading(true);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      // NestJS 백엔드로 모든 페이지 요청
      const response = await axios.post(
        "http://localhost:3001/api/pdf/to-images?format=png&scale=1.5",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const { images, count } = response.data;
      console.log(`PDF 변환 완료: ${count}페이지`);

      // 모든 페이지 이미지를 로드
      const loadedImages: HTMLImageElement[] = [];

      for (let i = 0; i < images.length; i++) {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            loadedImages.push(img);
            resolve();
          };
          img.onerror = reject;
          img.src = images[i];
        });
      }

      setPdfPages(loadedImages);
      setCurrentPage(0); // 첫 번째 페이지부터 시작
    } catch (error) {
      console.error("PDF 업로드 오류:", error);
      if (axios.isAxiosError(error)) {
        alert(
          `PDF 업로드 중 오류가 발생했습니다: ${
            error.response?.data || error.message
          }`
        );
      } else {
        alert("PDF 업로드 중 오류가 발생했습니다.");
      }
    } finally {
      setIsPdfLoading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />

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
            {/* 페이지 네비게이션 */}
            {pdfPages.length > 1 && (
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                <button
                  onClick={() => {
                    if (currentPage > 0) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                  disabled={currentPage === 0}
                  className={`p-1 rounded ${
                    currentPage === 0
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
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
                <span className="text-sm text-gray-600">
                  {currentPage + 1} / {pdfPages.length}
                </span>
                <button
                  onClick={() => {
                    if (currentPage < pdfPages.length - 1) {
                      setCurrentPage(currentPage + 1);
                    }
                  }}
                  disabled={currentPage === pdfPages.length - 1}
                  className={`p-1 rounded ${
                    currentPage === pdfPages.length - 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}

            <button
              onClick={handlePdfUpload}
              disabled={isPdfLoading}
              className={`px-4 py-2 text-white rounded-lg flex items-center space-x-2 ${
                isPdfLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isPdfLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>변환중...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>PDF 연동</span>
                </>
              )}
            </button>
            <button
              onClick={clearCanvas}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              지우기
            </button>
            {pdfPages.length > 0 && (
              <button
                onClick={resetPdfPosition}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                title="PDF 위치 초기화"
              >
                PDF 위치 초기화
              </button>
            )}
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
        <div className="flex items-center justify-between">
          {/* 왼쪽 - ToolBar 컴포넌트 */}
          <div className="flex items-center space-x-4">
            <ToolBar
              mode={tool}
              setMode={(mode) => setTool(mode as "pen" | "eraser" | "select")}
              handleUndo={handleUndo}
              handleRedo={handleRedo}
              handleDelete={deleteSelectedShapes}
              handleDuplicate={handleDuplicate}
              addShape={(type) => addShape(type)}
              addText={addText}
              addImage={addImage}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          </div>

          {/* 오른쪽 - 추가 도구들 */}
          <div className="flex items-center space-x-4">
            {/* 선택된 도형 삭제 */}
            {selectedShapeIds.length > 0 && (
              <button
                onClick={deleteSelectedShapes}
                className="px-3 py-1 rounded bg-orange-500 text-white hover:bg-orange-600 text-sm"
              >
                선택 삭제 ({selectedShapeIds.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 펜 툴 서브 툴바 */}
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
                      onClick={() => setBrushSize(size)}
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
                    "#FFFFFF",
                    "#CF3F41",
                    "#2D66CB",
                    "#E6B649",
                    "#479734",
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setBrushColor(color)}
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="p-5">
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
          onShapeDragEnd={handleShapeDragEnd}
          onShapeTransformEnd={handleShapeTransformEnd}
          onSelectionBoxChange={handleSelectionBoxChange}
          onPdfImageChange={handlePdfImageChange}
        />
      </div>
    </div>
  );
}
