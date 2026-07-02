"use client";

import React, { useEffect, useState } from "react";

export default function BackgroundParticles() {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    // Generar partículas solo en cliente para evitar hydration mismatch
    const generated = Array.from({ length: 25 }).map(() => ({
      size: Math.random() * 4 + 2,
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.2,
      isGreen: Math.random() > 0.3,
    }));
    setParticles(generated);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1] bg-[#f4f5f7]">
      {/* ── Orbes de Luz ── */}
      <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-green-400/20 rounded-full blur-[80px] animate-[float_15s_ease-in-out_infinite]" />
      <div className="absolute top-[50%] right-[10%] w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-[100px] animate-[float_20s_ease-in-out_infinite_reverse]" />
      <div className="absolute bottom-[10%] left-[40%] w-[250px] h-[250px] bg-teal-400/15 rounded-full blur-[70px] animate-[float_18s_ease-in-out_infinite_2s]" />
      
      {/* ── Luciérnagas / Partículas ── */}
      {particles.map((p, i) => (
        <div
          key={i}
          className={`absolute rounded-full blur-[1px] animate-[firefly_ease-in-out_infinite] ${p.isGreen ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]"}`}
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            top: `${p.top}%`,
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}
