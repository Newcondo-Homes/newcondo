"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Breadcrumbs from "./Breadcrumbs";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        {/* Header */}
        <Header
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Breadcrumbs */}
        <div className="bg-white border-b px-6 py-3">
          <Breadcrumbs />
        </div>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}