"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored) setUsername(stored);
  }, []);

  return (
    <div className="bg-[#f5f5f7] h-screen overflow-hidden flex font-[family-name:var(--font-inter),_-apple-system,_BlinkMacSystemFont,_'SF_Pro_Display',_system-ui,_sans-serif] md:p-3">
      <Sidebar />

      {/* Contenido principal — scroll solo aquí */}
      <main className="flex-1 min-h-0 overflow-y-auto md:rounded-[18px] bg-[#f5f5f7]">
        {/* Top bar */}
        {title && (
          <header className="sticky top-0 z-10 flex justify-between items-center px-4 md:px-8 py-4 md:py-5 bg-[#f5f5f7]/80 backdrop-blur-xl border-b border-black/[0.04]">
            <h2 className="text-[18px] md:text-[22px] font-semibold text-[#1d1d1f] tracking-tight">{title}</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button className="p-2 text-[#6e6e73] hover:text-[#1d1d1f] bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-black/[0.06] transition-all">
                  <Bell className="w-4 h-4" />
                </button>
                <span className="absolute top-0.5 right-0.5 bg-[#0071e3] w-2 h-2 rounded-full border-2 border-[#f5f5f7]" />
              </div>
              {username && (
                <div className="flex items-center gap-2.5 pl-2">
                  <div className="w-7 h-7 rounded-full bg-[#1d1d1f] flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-white uppercase">
                      {username.charAt(0)}
                    </span>
                  </div>
                  <span className="hidden sm:block text-[13px] font-medium text-[#1d1d1f]">{username}</span>
                </div>
              )}
            </div>
          </header>
        )}

        {/* Contenido con padding bottom para el bottom nav en móvil */}
        <div className="px-4 md:px-8 py-4 md:py-6 pb-24 md:pb-6">
          {children}
        </div>
      </main>
    </div>
  );
}
