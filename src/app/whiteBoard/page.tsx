//page.tsx
"use client";

import React, { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// WhiteBoard를 SSR 없이 동적 임포트
const WhiteBoard = dynamic(() => import("@/components/WhiteBoard/WhiteBoard"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500">화이트보드 로딩 중...</div>
    </div>
  ),
});

// 에러 바운더리 컴포넌트
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("WhiteBoard Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">오류가 발생했습니다</div>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function WhiteboardPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileName = searchParams.get("fileName") || "제목 없음";

  // 파일명 변경 감지
  const [currentFileName, setCurrentFileName] = useState(fileName);

  // URL 파라미터 변경 시 파일명 업데이트
  React.useEffect(() => {
    setCurrentFileName(fileName);
  }, [fileName]);

  // 대시보드로 돌아가기
  const handleBackToDashboard = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  // 파일명 편집
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [editingFileName, setEditingFileName] = useState(currentFileName);

  const handleFileNameEdit = useCallback(() => {
    setIsEditingFileName(true);
    setEditingFileName(currentFileName);
  }, [currentFileName]);

  const handleFileNameSave = useCallback(() => {
    // 여기서 파일명 변경 API 호출 가능
    setCurrentFileName(editingFileName);
    setIsEditingFileName(false);
  }, [editingFileName]);

  const handleFileNameCancel = useCallback(() => {
    setEditingFileName(currentFileName);
    setIsEditingFileName(false);
  }, [currentFileName]);

  // 저장 핸들러
  const handleSave = useCallback(() => {
    console.log("[DEBUG] Save requested from page");
    // 여기서 실제 저장 로직 구현
    // 예: API 호출, 로컬 스토리지 저장 등
  }, []);

  // 공유 핸들러
  const handleShare = useCallback(() => {
    console.log("[DEBUG] Share requested from page");
    // 여기서 실제 공유 로직 구현
    // 예: URL 복사, 소셜 미디어 공유 등
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToDashboard}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="대시보드로 돌아가기"
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

            {/* 파일명 표시/편집 */}
            <div className="flex items-center space-x-2">
              {isEditingFileName ? (
                <>
                  <input
                    type="text"
                    value={editingFileName}
                    onChange={(e) => setEditingFileName(e.target.value)}
                    className="text-xl font-semibold text-gray-800 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleFileNameSave}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="저장"
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleFileNameCancel}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="취소"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <h1
                    className="text-xl font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={handleFileNameEdit}
                    title="클릭하여 편집"
                  >
                    {currentFileName}
                  </h1>
                  <button
                    onClick={handleFileNameEdit}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="파일명 편집"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 추가 액션 버튼들 */}
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              title="저장"
            >
              저장
            </button>
            <button
              className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              title="공유"
            >
              공유
            </button>
          </div>
        </div>
      </div>

      {/* WhiteBoard 컴포넌트 사용 */}
      <ErrorBoundary>
        <WhiteBoard
          fileName={currentFileName}
          onSave={handleSave}
          onShare={handleShare}
          autoSave={true}
          autoSaveInterval={60000} // 1분마다 자동 저장
        />
      </ErrorBoundary>
    </div>
  );
}

export default function WhiteboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-gray-500">화이트보드 로딩 중...</div>
          </div>
        </div>
      }
    >
      <WhiteboardPageContent />
    </Suspense>
  );
}
