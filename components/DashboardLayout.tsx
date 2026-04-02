"use client";

import { useState, useEffect } from "react";
import { Search, Bell } from "lucide-react";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("userRole");
    if (storedUsername) setUsername(storedUsername);
    if (storedRole) setUserRole(storedRole);
  }, []);

  return (
    <div className="bg-gray-50 h-screen overflow-hidden flex text-slate-800 font-[family-name:var(--font-outfit)] p-3">
      <Sidebar />

      <main className="flex-1 h-full overflow-y-auto bg-[#F4F7FE] p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm">
              <Search className="w-5 h-5" />
            </button>
            <div className="relative">
              <button className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm">
                <Bell className="w-5 h-5" />
              </button>
              <span className="absolute top-0 right-0 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-white"></span>
            </div>
            {/* User profile removed as requested */}
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}