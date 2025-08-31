"use client";

import React, { useState } from "react";
import { FileCard } from "./FileCard";

interface FileItem {
  id: string;
  title: string;
  type: "draft" | "project";
  lastEdited: string;
  icon: string;
  iconColor: "purple" | "blue";
  preview: "blank" | "layout" | "wireframe" | "sticky";
  project?: string;
}

export function MainContent() {
  const [activeTab, setActiveTab] = useState("recent");
  const [viewMode, setViewMode] = useState("grid");
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: "1",
      title: "제목 없음",
      type: "draft",
      lastEdited: "25분 전 편집됨",
      icon: "P",
      iconColor: "purple",
      preview: "blank",
    },
    {
      id: "2",
      title: "제목 없음",
      type: "draft",
      lastEdited: "22시간 전 편집됨",
      icon: "P",
      iconColor: "purple",
      preview: "layout",
    },
    {
      id: "3",
      title: "와이어프레임 - 1차",
      type: "project",
      lastEdited: "2일 전 편집됨",
      icon: "D",
      iconColor: "blue",
      preview: "wireframe",
      project: "크래프톤 정글 - 굿잡",
    },
    {
      id: "4",
      title: "제목 없음",
      type: "draft",
      lastEdited: "4일 전 편집됨",
      icon: "P",
      iconColor: "purple",
      preview: "blank",
    },
    {
      id: "5",
      title: "제목 없음",
      type: "draft",
      lastEdited: "4일 전 편집됨",
      icon: "P",
      iconColor: "purple",
      preview: "blank",
    },
    {
      id: "6",
      title: "제목 없음",
      type: "draft",
      lastEdited: "4일 전 편집됨",
      icon: "P",
      iconColor: "purple",
      preview: "blank",
    },
    {
      id: "7",
      title: "제목 없음",
      type: "draft",
      lastEdited: "4일 전 편집됨",
      icon: "P",
      iconColor: "purple",
      preview: "sticky",
    },
    {
      id: "8",
      title: "제목 없음",
      type: "draft",
      lastEdited: "4일 전 편집됨",
      icon: "P",
      iconColor: "purple",
      preview: "blank",
    },
  ]);

  const tabs = [
    { id: "recent", label: "최근 본 항목" },
    { id: "shared", label: "공유된 파일" },
    { id: "projects", label: "공유 프로젝트" },
  ];

  const createNewFile = () => {
    const newFile: FileItem = {
      id: Date.now().toString(),
      title: "제목 없음",
      type: "draft",
      lastEdited: "방금 전 편집됨",
      icon: "P",
      iconColor: "purple",
      preview: "blank",
    };
    setFiles([newFile, ...files]);
  };

  const deleteFile = (fileId: string) => {
    setFiles(files.filter((file) => file.id !== fileId));
  };

  const updateFileTitle = (fileId: string, newTitle: string) => {
    setFiles(
      files.map((file) =>
        file.id === fileId ? { ...file, title: newTitle } : file
      )
    );
  };

  return (
    <main className="flex-1 p-6">
      {/* Title and New File Button */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-white">최근 항목</h1>
        <button
          onClick={createNewFile}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>새 파일</span>
        </button>
      </div>

      {/* Access Restriction Banner */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm">
          액세스 제한: 새로운 파일을 만들려면 풀 멤버가 될 수 있는 요금제로
          전환하세요.
        </p>
      </div>

      {/* Content Filtering/Sorting Bar */}
      <div className="flex items-center justify-between mb-6">
        {/* Tabs */}
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters/View Options */}
        <div className="flex items-center space-x-4">
          <select className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white">
            <option>모든 오거니제이션</option>
          </select>
          <select className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white">
            <option>모든 파일</option>
          </select>
          <select className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white">
            <option>최근 사용일</option>
          </select>

          {/* View Toggle */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
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
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
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
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* File Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {files.map((file) => (
          <FileCard
            key={file.id}
            {...file}
            onDelete={() => deleteFile(file.id)}
            onTitleChange={(newTitle) => updateFileTitle(file.id, newTitle)}
          />
        ))}
      </div>

      {/* Empty State */}
      {files.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            파일이 없습니다
          </h3>
          <p className="text-gray-500 mb-4">새 파일을 만들어보세요!</p>
          <button
            onClick={createNewFile}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            첫 파일 만들기
          </button>
        </div>
      )}
    </main>
  );
}
