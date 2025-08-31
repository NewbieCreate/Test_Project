"use client";

import React from "react";

export function Header() {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - User profile */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              MM
            </div>
            <span className="text-sm font-medium">
              나중에 유저 프로필 들어갈곳
            </span>
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
