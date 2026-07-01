"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  LogOut,
  Plus
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

  const navItems = [
    { href: "/",       label: "Dashboard",        icon: <LayoutDashboard className="w-[22px] h-[22px] stroke-[1.5] flex-shrink-0" /> },
    { href: "/gastos", label: "Gastos", icon: <Receipt         className="w-[22px] h-[22px] stroke-[1.5] flex-shrink-0" /> },
  ];

  return (
    <>
      {/* ── Sidebar — solo visible en md+ ─────────────────── */}
      <aside className="hidden md:flex w-60 bg-[#1d1d1f] text-white flex-col flex-shrink-0 h-full rounded-[22px] mr-3">
        {/* Logo */}
        <div className="px-6 pt-8 pb-6">
          <h1 className="text-[17px] font-semibold tracking-tight text-white">
            Jamber Corp
          </h1>
          <p className="text-[12px] text-white/40 mt-0.5 font-medium">Gestión de Locales</p>
        </div>

        {/* Nav principal */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
          {navItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-[12px] transition-all text-[14px] font-medium ${
                isActive(href)
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {icon}
              <span>{label}</span>
              <span className={`ml-auto bg-[#0071e3] text-white text-[11px] font-semibold px-2 py-0.5 rounded-full ${isActive(href) && href === "/" ? "block" : "hidden"}`}>
                2
              </span>
            </Link>
          ))}

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

      {/* ── Bottom Navigation (Floating Pill & FAB) — solo visible en móvil (<md) ── */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between gap-3 pointer-events-none">
        
        {/* Floating Nav Pill */}
        <nav className="flex-1 bg-white/95 backdrop-blur-xl border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[98px] flex items-center justify-around p-1.5 pointer-events-auto h-[60px]">
          {navItems.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-center h-full rounded-full transition-all duration-300 ${
                isActive(href)
                  ? "bg-[#f5f5f7] text-[#1d1d1f] px-5 gap-2"
                  : "text-[#86868b] hover:text-[#1d1d1f] px-3 w-12"
              }`}
            >
              {icon}
              <span className={`text-[14px] font-semibold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${isActive(href) ? "w-auto opacity-100 ml-1.5" : "w-0 opacity-0 ml-0"}`}>
                {label.split(" ")[0]}
              </span>
            </Link>
          ))}
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center h-full text-[#86868b] hover:text-[#1d1d1f] px-3 w-12 rounded-full transition-all duration-300"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-[22px] h-[22px] stroke-[1.5]" />
          </button>
        </nav>

        {/* Floating Action Button (+) */}
        <button
          onClick={() => document.dispatchEvent(new CustomEvent('open-new-gasto'))}
          className="w-[60px] h-[60px] bg-[#1d1d1f] rounded-full flex items-center justify-center text-white shadow-[0_8px_30px_rgb(0,0,0,0.2)] pointer-events-auto hover:scale-105 active:scale-95 transition-all flex-shrink-0"
          aria-label="Nuevo registro"
        >
          <Plus className="w-8 h-8 stroke-[1.5]" />
        </button>

      </div>
    </>
  );
}
