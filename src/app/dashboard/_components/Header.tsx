"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

interface UserProfile {
  idx: number;
  name: string;
}

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);
  const params = useParams();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setUserNotFound(false);

        // 🔍 디버깅: params 전체 구조 확인
        console.log("=== 디버깅 정보 ===");
        console.log("전체 params:", params);
        console.log("params의 모든 키:", Object.keys(params || {}));

        // 모든 가능한 파라미터 이름들을 확인
        const possibleKeys = ["id", "userId", "userIdx", "user"];
        possibleKeys.forEach((key) => {
          console.log(`params.${key}:`, params?.[key]);
        });

        // 🔍 현재 URL 확인
        console.log("현재 URL:", window.location.pathname);

        // 여러 가지 방법으로 userIdx 추출 시도
        let userIdx: number | null = null;

        // 방법 1: params.id 사용
        if (params?.id) {
          const idValue = Array.isArray(params.id) ? params.id[0] : params.id;
          userIdx = parseInt(idValue, 10);
          console.log("방법 1 - params.id로 파싱된 userIdx:", userIdx);
        }

        // 방법 2: 다른 가능한 키들 시도
        if (!userIdx || isNaN(userIdx)) {
          for (const key of possibleKeys) {
            const value = params?.[key];
            if (value) {
              const keyValue = Array.isArray(value) ? value[0] : value;
              const parsedValue = parseInt(keyValue, 10);
              if (!isNaN(parsedValue) && parsedValue > 0) {
                userIdx = parsedValue;
                console.log(
                  `방법 2 - params.${key}로 파싱된 userIdx:`,
                  userIdx
                );
                break;
              }
            }
          }
        }

        // 방법 3: URL에서 직접 추출
        if (!userIdx || isNaN(userIdx)) {
          const urlPath = window.location.pathname;
          const pathSegments = urlPath.split("/").filter((segment) => segment);
          console.log("URL 세그먼트들:", pathSegments);

          // URL에서 숫자인 부분 찾기
          for (const segment of pathSegments) {
            const parsedSegment = parseInt(segment, 10);
            if (!isNaN(parsedSegment) && parsedSegment > 0) {
              userIdx = parsedSegment;
              console.log("방법 3 - URL에서 추출한 userIdx:", userIdx);
              break;
            }
          }
        }

        console.log("최종 결정된 userIdx:", userIdx);

        // userIdx가 여전히 유효하지 않다면 에러
        if (!userIdx || isNaN(userIdx) || userIdx <= 0) {
          console.log("❌ 유효하지 않은 userIdx, 기본값 1 사용");
          userIdx = 1; // 임시로 기본값 사용
        }

        console.log(`🚀 API 호출: http://localhost:3001/header/${userIdx}`);

        const response = await axios.get<UserProfile>(
          `http://localhost:3001/header/${userIdx}`
        );

        console.log("✅ API 응답 성공:", response.data);
        setUser(response.data);
      } catch (error) {
        console.error("❌ 사용자 데이터를 가져오는 중 오류 발생:", error);

        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setUserNotFound(true);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [params]); // params 전체를 의존성에 추가

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Hamburger menu + User profile */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="flex items-center space-x-2">
            {loading ? (
              <>
                <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
                <div className="w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
              </>
            ) : userNotFound ? (
              <>
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                  !
                </div>
                <span className="text-sm font-medium text-red-400">
                  사용자를 찾을 수 없음
                </span>
              </>
            ) : user ? (
              <>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white">
                  {user.name}
                </span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                  U
                </div>
                <span className="text-sm font-medium text-white">사용자</span>
              </>
            )}
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-5 5v-5zM4.5 17H9l-4.5 4.5V17z"
            />
          </svg>
        </div>

        {/* Right side - App icons */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <span>디자인</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <span>FigJam</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <span>Slides</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <span>Buzz</span>
          </div>
          <div className="w-6 h-6 bg-gray-600 rounded"></div>
        </div>
      </div>
    </header>
  );
}
