"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface FileCardProps {
  id: string;
  title: string;
  type: "draft" | "project";
  lastEdited: string;
  icon: string;
  iconColor: "purple" | "blue";
  preview: "blank" | "layout" | "wireframe" | "sticky";
  project?: string;
  onDelete: () => void;
  onTitleChange: (newTitle: string) => void;
}

export function FileCard({
  id,
  title,
  type,
  lastEdited,
  icon,
  iconColor,
  preview,
  project,
  onDelete,
  onTitleChange,
}: FileCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const getIconColor = () => {
    return iconColor === "purple" ? "bg-purple-600" : "bg-blue-600";
  };

  const handleTitleSave = () => {
    if (editTitle.trim()) {
      onTitleChange(editTitle.trim());
    } else {
      setEditTitle(title); // 원래 제목으로 복원
    }
    setIsEditing(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(title);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      handleTitleCancel();
    }
  };

  const handleCardClick = () => {
    // 제목 편집 중이면 클릭 무시
    if (isEditing) return;

    // 화이트보드 페이지로 이동
    router.push(
      `/whiteBoard?fileId=${id}&fileName=${encodeURIComponent(title)}`
    );
  };

  const renderPreview = () => {
    switch (preview) {
      case "blank":
        return <div className="w-full h-full bg-white" />;

      case "layout":
        return (
          <div className="w-full h-full bg-white p-2">
            <div className="w-full h-2 bg-gray-300 mb-2"></div>
            <div className="w-full h-2 bg-gray-300 mb-2"></div>
            <div className="flex space-x-2">
              <div className="w-1/2 h-2 bg-gray-300"></div>
              <div className="w-1/2 h-2 bg-gray-300"></div>
            </div>
          </div>
        );

      case "wireframe":
        return (
          <div className="w-full h-full bg-white p-2">
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-full h-2 bg-gray-300 rounded"></div>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-600">Wireframe</div>
          </div>
        );

      case "sticky":
        return (
          <div className="w-full h-full bg-pink-200 p-2 flex flex-col justify-between">
            <div className="text-xs text-gray-700 font-mono">
              npm install web-vitals
            </div>
            <div className="text-xs text-gray-700">류승찬</div>
          </div>
        );

      default:
        return <div className="w-full h-full bg-white" />;
    }
  };

  return (
    <div
      className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors group cursor-pointer"
      onClick={!isEditing ? handleCardClick : undefined}
    >
      {/* Preview Area */}
      <div className="aspect-video bg-white relative">
        {renderPreview()}

        {/* Icon overlay */}
        <div
          className={`absolute top-2 right-2 w-6 h-6 ${getIconColor()} rounded flex items-center justify-center text-white text-xs font-semibold`}
        >
          {icon}
        </div>

        {/* Delete Button - Hover시에만 표시 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 left-2 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
          title="파일 삭제"
        >
          <svg
            className="w-3 h-3"
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
      </div>

      {/* File Info */}
      <div className="p-3">
        {/* Editable Title */}
        <div className="mb-1">
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleTitleSave}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleTitleSave}
                className="text-green-400 hover:text-green-300"
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
                onClick={handleTitleCancel}
                className="text-red-400 hover:text-red-300"
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
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <h3
                className="text-white font-medium text-sm truncate flex-1 cursor-pointer hover:text-blue-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                title="제목 편집"
              >
                {title}
              </h3>
              <svg
                className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
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
            </div>
          )}
        </div>

        {project && <p className="text-gray-400 text-xs mb-1">{project}</p>}
        <p className="text-gray-500 text-xs">
          {type === "draft" ? "초안" : "프로젝트"} · {lastEdited}
        </p>
      </div>
    </div>
  );
}
