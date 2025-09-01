"use client";

import React, { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header에 사이드바 토글 기능 전달 */}
      <Header onToggleSidebar={toggleSidebar} />

      <div className="flex">
        {/* Sidebar에 상태와 토글 함수 전달 */}
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

        {/* MainContent 추가 */}
        <MainContent />
      </div>
    </div>
  );
}
