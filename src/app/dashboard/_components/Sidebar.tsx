"use client";

import React from "react";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      className={`bg-gray-800 w-64 min-h-screen transition-all duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Q 검색"
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-2">
          <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium">
            ① 최근 항목
          </div>
          <div className="text-gray-300 px-3 py-2 text-sm">템플릿 및 도구</div>
        </nav>

        {/* Team/Project Sections */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-gray-300 text-sm">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>나중에 공유된 친구 파일 볼 수 있는곳</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-300 text-sm px-3 py-2 hover:bg-gray-700 rounded cursor-pointer">
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
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
            </svg>
            <span>모든 공유 프로젝트</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-300 text-sm px-3 py-2 hover:bg-gray-700 rounded cursor-pointer">
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>휴지통</span>
          </div>
        </div>

        {/* Favorites */}
        <div>
          <h3 className="text-gray-300 text-sm font-medium mb-2">즐겨찾기</h3>
        </div>
      </div>
    </aside>
  );
}
