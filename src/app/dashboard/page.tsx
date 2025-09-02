"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  lastModified: Date;
  thumbnail?: string;
  tags: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "date">("date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // 샘플 프로젝트 데이터
  useEffect(() => {
    const sampleProjects: Project[] = [
      {
        id: "1",
        name: "프로젝트 기획안",
        lastModified: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
        tags: ["기획", "아이디어"],
      },
      {
        id: "2",
        name: "UI/UX 디자인",
        lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1일 전
        tags: ["디자인", "UI"],
      },
      {
        id: "3",
        name: "회의록",
        lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3일 전
        tags: ["회의", "문서"],
      },
      {
        id: "4",
        name: "브레인스토밍",
        lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1주일 전
        tags: ["아이디어", "창의성"],
      },
    ];
    setProjects(sampleProjects);
  }, []);

  const handleCreateNew = () => {
    const projectName = prompt("프로젝트 이름을 입력하세요:");
    if (projectName?.trim()) {
      const newProject: Project = {
        id: Date.now().toString(),
        name: projectName,
        lastModified: new Date(),
        tags: [],
      };
      setProjects([newProject, ...projects]);

      // 로컬 스토리지에 저장
      const recentFiles = JSON.parse(
        localStorage.getItem("recentFiles") || "[]"
      );
      recentFiles.unshift({
        id: newProject.id,
        name: newProject.name,
        timestamp: Date.now(),
      });
      localStorage.setItem(
        "recentFiles",
        JSON.stringify(recentFiles.slice(0, 10))
      );

      // 새 프로젝트로 이동
      router.push(`/whiteBoard?fileName=${encodeURIComponent(projectName)}`);
    }
  };

  const handleProjectClick = (project: Project) => {
    router.push(`/whiteBoard?fileName=${encodeURIComponent(project.name)}`);
  };

  const handleProjectDelete = (projectId: string) => {
    if (confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) {
      setProjects(projects.filter((p) => p.id !== projectId));
    }
  };

  const filteredProjects = projects
    .filter(
      (project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedTags.length === 0 ||
          selectedTags.some((tag) => project.tags.includes(tag)))
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return b.lastModified.getTime() - a.lastModified.getTime();
      }
      return a.name.localeCompare(b.name);
    });

  const allTags = Array.from(new Set(projects.flatMap((p) => p.tags)));

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return "방금 전";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-gray-500 hover:text-gray-900 mr-6">
                <svg
                  className="w-6 h-6"
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
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">📊 대시보드</h1>
            </div>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + 새 프로젝트
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="프로젝트 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
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
              </div>
            </div>

            {/* 태그 필터 */}
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTags((prev) =>
                      prev.includes(tag)
                        ? prev.filter((t) => t !== tag)
                        : [...prev, tag]
                    )
                  }
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTags.includes(tag)
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* 정렬 */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "date")}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">최신순</option>
              <option value="name">이름순</option>
            </select>

            {/* 뷰 모드 */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 ${
                  viewMode === "grid"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-white text-gray-600"
                }`}
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
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 ${
                  viewMode === "list"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-white text-gray-600"
                }`}
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
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 프로젝트 목록 */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              프로젝트가 없습니다
            </h3>
            <p className="text-gray-500 mb-6">
              새로운 프로젝트를 만들어보세요!
            </p>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              첫 프로젝트 만들기
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${
                  viewMode === "list" ? "p-4" : "p-6"
                }`}
                onClick={() => handleProjectClick(project)}
              >
                {viewMode === "grid" ? (
                  // 그리드 뷰
                  <>
                    <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-4xl text-gray-400">📋</span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2 truncate">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {formatDate(project.lastModified)}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{project.tags.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProjectDelete(project.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        삭제
                      </button>
                      <button className="text-blue-500 hover:text-blue-700 text-sm">
                        열기 →
                      </button>
                    </div>
                  </>
                ) : (
                  // 리스트 뷰
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl text-gray-400">📋</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(project.lastModified)}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {project.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProjectDelete(project.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded hover:bg-red-50"
                      >
                        삭제
                      </button>
                      <button className="text-blue-500 hover:text-blue-700 text-sm px-3 py-1 rounded hover:bg-blue-50">
                        열기 →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 통계 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 프로젝트</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {projects.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">최근 수정</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {projects.length > 0
                    ? formatDate(projects[0].lastModified)
                    : "없음"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">사용 태그</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {allTags.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">활성 상태</p>
                <p className="text-2xl font-semibold text-gray-900">온라인</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
