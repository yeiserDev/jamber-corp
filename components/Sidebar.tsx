"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Users,
  Settings,
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
    <aside className="w-64 bg-[#0A2640] text-white flex flex-col flex-shrink-0 h-full rounded-3xl mr-3">
      <div className="p-8">
        <h1 className="text-2xl font-bold tracking-wide">Jamber Corp</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto pb-4">
        <Link
          href="/"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            isActive("/")
              ? "bg-white/10 text-white border-l-4 border-cyan-500"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
          {isActive("/") && (
            <span className="ml-auto bg-cyan-500 text-[#0A2640] text-xs font-bold px-1.5 py-0.5 rounded">2</span>
          )}
        </Link>

        <Link
          href="/gastos"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            isActive("/gastos")
              ? "bg-white/10 text-white border-l-4 border-cyan-500"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span>Gastos de Locales</span>
        </Link>

        <Link
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <FileText className="w-5 h-5" />
          <span>Documentos</span>
        </Link>

        <Link
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <Users className="w-5 h-5" />
          <span>Clientes</span>
        </Link>

        <div className="pt-8 pb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Otros</div>

        <Link
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Configuración</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </nav>
    </aside>
  );
}