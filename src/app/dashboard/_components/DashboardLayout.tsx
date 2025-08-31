"use client";

import React, { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";

export function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} />
        <MainContent />
      </div>
    </div>
  );
}
