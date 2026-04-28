"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-60 bg-[#1d1d1f] text-white flex flex-col flex-shrink-0 h-full rounded-[22px] mr-3">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-[17px] font-semibold tracking-tight text-white">
          Jamber Corp
        </h1>
        <p className="text-[12px] text-white/40 mt-0.5 font-medium">Gestión de Locales</p>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        <Link
          href="/"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-[12px] transition-all text-[14px] font-medium ${
            isActive("/")
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          <LayoutDashboard className="w-[18px] h-[18px] flex-shrink-0" />
          <span>Dashboard</span>
          {isActive("/") && (
            <span className="ml-auto bg-[#0071e3] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
              2
            </span>
          )}
        </Link>

        <Link
          href="/gastos"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-[12px] transition-all text-[14px] font-medium ${
            isActive("/gastos")
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          <Receipt className="w-[18px] h-[18px] flex-shrink-0" />
          <span>Gastos de Locales</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-white/50 hover:text-white hover:bg-white/[0.06] rounded-[12px] transition-all text-[14px] font-medium"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          <span>Cerrar Sesión</span>
        </button>
      </nav>

      {/* Footer del sidebar */}
      <div className="px-5 pb-6">
        <div className="flex items-center gap-2 p-3 rounded-[12px] bg-white/[0.04]">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          <span className="text-[12px] text-white/40 font-medium">Sistema activo</span>
        </div>
      </div>
    </aside>
  );
}
