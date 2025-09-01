//page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

export default function WhiteboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileName = searchParams.get("fileName") || "제목 없음";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(2);
  const [brushColor, setBrushColor] = useState("#000000");
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // PDF 이미지 정보를 저장할 ref
  const pdfImageRef = useRef<{
    image: HTMLImageElement;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // 모든 PDF 페이지 이미지를 저장할 state
  const [pdfPages, setPdfPages] = useState<HTMLImageElement[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  // PDF 이미지 드래그 관련 상태
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pdfOffset, setPdfOffset] = useState({ x: 0, y: 0 });

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

      // PDF 이미지가 있으면 다시 그리기
      if (pdfImageRef.current) {
        const { image } = pdfImageRef.current;
        const scale = Math.min(
          canvas.width / image.width,
          canvas.height / image.height
        );
        const scaledWidth = image.width * scale;
        const scaledHeight = image.height * scale;
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;

        // PDF 이미지 정보 업데이트
        pdfImageRef.current = {
          image,
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
        };

        // 이미지 다시 그리기
        ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
      }
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

  // 통합된 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // PDF 이미지 드래그 처리
    if (pdfImageRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const { x, y, width, height } = pdfImageRef.current;

      // PDF 이미지 영역 내에서 클릭했는지 확인
      if (
        mouseX >= x &&
        mouseX <= x + width &&
        mouseY >= y &&
        mouseY <= y + height
      ) {
        setIsDraggingPdf(true);
        setDragStart({ x: mouseX - x, y: mouseY - y });
        e.preventDefault();
        return;
      }
    }

    // 그리기 시작
    startDrawing(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // PDF 이미지 드래그 처리
    if (isDraggingPdf && pdfImageRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // 새로운 오프셋 계산
      const newOffsetX =
        mouseX - dragStart.x - (canvas.width - pdfImageRef.current.width) / 2;
      const newOffsetY =
        mouseY - dragStart.y - (canvas.height - pdfImageRef.current.height) / 2;

      setPdfOffset({ x: newOffsetX, y: newOffsetY });

      // 캔버스 다시 그리기
      if (pdfPages[currentPage]) {
        displayPageOnCanvas(pdfPages[currentPage]);
      }
      return;
    }

    // 그리기 처리
    draw(e);
  };

  const handleMouseUp = () => {
    setIsDraggingPdf(false);
    stopDrawing();
  };

  // PDF 이미지 위치 초기화
  const resetPdfPosition = () => {
    setPdfOffset({ x: 0, y: 0 });
    if (pdfPages[currentPage]) {
      displayPageOnCanvas(pdfPages[currentPage]);
    }
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

  const handlePdfUpload = () => {
    fileInputRef.current?.click();
  };

  // 특정 페이지를 캔버스에 표시하는 함수
  const displayPageOnCanvas = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 크기에 맞게 이미지 스케일링 (더 작게 조정)
    const maxWidth = canvas.width * 0.8; // 캔버스 너비의 80%
    const maxHeight = canvas.height * 0.8; // 캔버스 높이의 80%

    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    // 중앙 위치에 오프셋 적용
    const centerX = (canvas.width - scaledWidth) / 2;
    const centerY = (canvas.height - scaledHeight) / 2;
    const x = centerX + pdfOffset.x;
    const y = centerY + pdfOffset.y;

    // 배경을 흰색으로 설정
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 이미지 그리기
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

    // PDF 이미지 정보 저장
    pdfImageRef.current = {
      image: img,
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    };
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

      // 첫 번째 페이지를 캔버스에 표시
      if (loadedImages.length > 0) {
        displayPageOnCanvas(loadedImages[0]);
      }
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
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      displayPageOnCanvas(pdfPages[newPage]);
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
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      displayPageOnCanvas(pdfPages[newPage]);
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
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={stopDrawing}
          className="border border-gray-300 rounded-lg shadow-lg cursor-crosshair mx-auto"
        />
      </div>
    </div>
  );
}
