"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, Lock, Eye, Users, ShieldCheck, ArrowRight, ArrowLeft, Zap, Droplets } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Completa ambos campos");
      return;
    }
    
    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Guardar sesión en localStorage
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userRole", data.user.role);

        window.dispatchEvent(new Event('auth-change'));

        // Redirigir al dashboard
        router.push("/");
      } else {
        setError(data.message || "Credenciales incorrectas");
        setLoading(false);
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError("Error al intentar iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 md:p-8 font-[family-name:var(--font-outfit)]">

      {/* Animated Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large gradient orbs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-indigo-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-20 w-20 h-20 border-2 border-cyan-400/30 rounded-2xl rotate-12 animate-float"></div>
        <div className="absolute top-40 right-32 w-16 h-16 border-2 border-blue-400/30 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-32 left-40 w-24 h-24 border-2 border-indigo-400/30 rounded-2xl -rotate-12 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 right-20 w-12 h-12 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-lg rotate-45 animate-float" style={{ animationDelay: '1.5s' }}></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Glassmorphism Login Card */}
      <div className="relative backdrop-blur-xl bg-white/70 p-4 sm:p-6 md:p-8 rounded-3xl md:rounded-[40px] shadow-2xl border border-white/50 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">

        {/* Left Column - Form */}
        <div className="flex flex-col justify-between p-2 sm:p-4 lg:p-6 relative">

          <div>
            <button 
              onClick={() => router.push('/')}
              className="w-10 h-10 mb-6 flex items-center justify-center bg-white/50 hover:bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full shadow-sm text-gray-600 hover:text-[#0A2640] transition-all hover:-translate-x-1"
              title="Volver al Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 sm:gap-5 mb-8 sm:mb-10 group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-[1.25rem] bg-gradient-to-b from-[#1E293B] to-[#0F172A] shadow-[0_0_40px_rgba(14,165,233,0.15)] border border-gray-700/50 relative overflow-hidden">
                {/* Ambient Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                {/* Premium Water & Light SVG Logo */}
                <div className="relative w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 z-10">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
                    {/* Glowing Water Drop Outline (Stops where lightning overlaps) */}
                    <path d="M18 6C18 6 6 18 6 30C6 36.627 11.373 42 18 42C24.627 42 30 36.627 30 30C30 26 28 22 25 19" stroke="url(#blueGrad)" strokeWidth="3" strokeLinecap="round" filter="drop-shadow(0px 0px 6px rgba(56,189,248,0.6))" />
                    
                    {/* Inner Water Drop Fill */}
                    <path d="M18 10C18 10 9 20 9 30C9 34.97 13.03 39 18 39C22.97 39 27 34.97 27 30C27 26 25 22 23 19" fill="url(#blueGrad)" fillOpacity="0.3" />
                    
                    {/* 3D Glowing Lightning Bolt */}
                    <path d="M30 2L16 22H26L20 46L42 18H30L34 2Z" fill="url(#yellowGrad)" filter="drop-shadow(0px 4px 10px rgba(250,204,21,0.6))" />

                    <defs>
                      <linearGradient id="blueGrad" x1="6" y1="6" x2="30" y2="42" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#7DD3FC" />
                        <stop offset="0.5" stopColor="#0EA5E9" />
                        <stop offset="1" stopColor="#2563EB" />
                      </linearGradient>
                      <linearGradient id="yellowGrad" x1="16" y1="2" x2="42" y2="46" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FEF08A" />
                        <stop offset="0.5" stopColor="#F59E0B" />
                        <stop offset="1" stopColor="#B45309" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0A2640] to-blue-600 tracking-tight">
                  Jamber Corp
                </span>
                <span className="text-xs sm:text-sm text-gray-500 font-medium tracking-widest uppercase">
                  Gestión Inteligente
                </span>
              </div>
            </div>
            <p className="hidden sm:block text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md">
              Ingresa tus credenciales seguras para poder gestionar registros y usuarios.
            </p>
          </div>

          <div className="max-w-md w-full">
            {/* Error Message Global */}
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-600 px-4 py-3 rounded-2xl text-sm text-center mb-6 animate-fade-in">
                {error}
              </div>
            )}

            {/* View: Administrador */}
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#0A2640]" />
                </div>
                <input
                  type="text"
                  placeholder="Usuario administrador"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-14 pr-4 py-3.5 rounded-full border border-gray-200/50 bg-white/60 backdrop-blur-sm focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/30 text-gray-700 placeholder-gray-400 transition-all"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-12 py-3.5 rounded-full border border-gray-200/50 bg-white/60 backdrop-blur-sm focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/30 text-gray-700 placeholder-gray-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0A2640] hover:bg-[#0A2640]/90 disabled:bg-gray-400 text-white font-medium py-3.5 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 mt-2"
              >
                {loading ? "Verificando..." : "Acceder al Sistema"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Decorative */}
        <div className="relative hidden lg:flex bg-gradient-to-br from-[#0A2640] via-[#0A2640] to-[#0d3050] rounded-3xl overflow-hidden flex-col p-8 xl:p-12 justify-between min-h-[600px] shadow-2xl">

          <div className="relative z-10">
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white max-w-md leading-[1.1] tracking-tight drop-shadow-md">
              Control total de tus <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                locales comerciales
              </span>
            </h2>
          </div>

          {/* App Preview Image */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-12">
            <div className="relative w-[90%] h-[55%] xl:w-[85%] xl:h-[65%] animate-float shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl xl:rounded-3xl overflow-hidden border border-white/10 ring-1 ring-white/5">
              <Image
                src="/dashboard-mockup.png"
                alt="Jamber Corp Dashboard Preview"
                fill
                className="object-cover object-top opacity-95"
                priority
              />
              
              {/* Overlay gradient to blend bottom edge */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0A2640] to-transparent"></div>
            </div>
          </div>
          
          <div className="relative z-10">
             <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Control de Acceso Seguro</h3>
                  <p className="text-white/70 text-xs mt-1 leading-relaxed">Roles especializados para mantener la integridad de los datos financieros.</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}