import { useState, useRef, useCallback, useEffect } from "react";
import { PdfImageInfo, PdfOffset } from "../types";

export const usePDF = () => {
  const [pdfPages, setPdfPages] = useState<HTMLImageElement[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pdfOffset, setPdfOffset] = useState<PdfOffset>({ x: 0, y: 0 });
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const pdfImageRef = useRef<PdfImageInfo | null>(null);

  // 초기화 완료 표시
  useEffect(() => {
    if (!isInitialized) {
      console.log("[DEBUG] usePDF hook initialized");
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const handlePdfImageChange = useCallback((image: HTMLImageElement | null) => {
    if (image) {
      pdfImageRef.current = {
        image,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
    } else {
      pdfImageRef.current = null;
    }
  }, []);

  const resetPdfPosition = useCallback(() => {
    setPdfOffset({ x: 0, y: 0 });
  }, []);

  const clearPdf = useCallback(() => {
    setPdfPages([]);
    setCurrentPage(0);
    setPdfOffset({ x: 0, y: 0 });
    pdfImageRef.current = null;
  }, []);

  const nextPage = useCallback(() => {
    if (currentPage < pdfPages.length - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, pdfPages.length]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback(
    (pageNumber: number) => {
      if (pageNumber >= 0 && pageNumber < pdfPages.length) {
        setCurrentPage(pageNumber);
      }
    },
    [pdfPages.length]
  );

  return {
    pdfPages,
    currentPage,
    pdfOffset,
    isDraggingPdf,
    pdfImageRef,
    setPdfPages,
    setCurrentPage,
    setPdfOffset,
    setIsDraggingPdf,
    handlePdfImageChange,
    resetPdfPosition,
    clearPdf,
    nextPage,
    prevPage,
    goToPage,
    hasPdf: pdfPages.length > 0,
    totalPages: pdfPages.length,
    canGoNext: currentPage < pdfPages.length - 1,
    canGoPrev: currentPage > 0,
  };
};
