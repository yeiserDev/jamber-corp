"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, Lock, Eye } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleGoogleSignup = () => {
    // Aquí irá la lógica de Google OAuth
    console.log("Google signup");
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
        <div className="flex flex-col justify-between p-2 sm:p-4 lg:p-6">

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0A2640] mb-6 sm:mb-8">Jamber Corp</h2>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-gray-900 mb-3 sm:mb-4 leading-tight">
              Bienvenido a <br /> Jamber Corp
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md">
              Plataforma de gestión automatizada de gastos de agua y luz para locales comerciales. Distribuye costos, lleva el control y genera reportes al instante.
            </p>
          </div>

          <form className="space-y-4 sm:space-y-5 max-w-md w-full" onSubmit={handleSubmit}>

            {/* Username Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-[#0A2640]" />
              </div>
              <input
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 sm:pl-14 pr-4 py-3 sm:py-4 rounded-full border border-gray-200/50 bg-white/60 backdrop-blur-sm focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/30 focus:bg-white/80 text-sm sm:text-base text-gray-700 placeholder-gray-400 transition-all"
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 sm:pl-14 pr-12 py-3 sm:py-4 rounded-full border border-gray-200/50 bg-white/60 backdrop-blur-sm focus:outline-none focus:border-[#0A2640] focus:ring-2 focus:ring-[#0A2640]/30 focus:bg-white/80 text-sm sm:text-base text-gray-700 placeholder-gray-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 sm:pr-5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-600 px-4 py-3 rounded-full text-sm text-center">
                {error}
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A2640] hover:bg-[#0A2640]/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 sm:py-4 rounded-full transition-all duration-200 shadow-lg shadow-[#0A2640]/30 hover:shadow-xl hover:shadow-[#0A2640]/40 text-base sm:text-lg transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              {loading ? "Iniciando..." : "Iniciar Sesión"}
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-300/50"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs sm:text-sm">o</span>
              <div className="flex-grow border-t border-gray-300/50"></div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full bg-white/80 backdrop-blur-sm border border-gray-300/50 hover:bg-white hover:border-gray-300 text-gray-700 font-medium py-3 sm:py-4 rounded-full flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 text-sm sm:text-base shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            {/* Register Link */}
            <p className="text-center text-gray-600 text-xs sm:text-sm mt-4">
              ¿No tienes una cuenta?{" "}
              <a href="#" className="text-[#0A2640] font-medium hover:underline hover:text-[#0A2640]/80 transition-colors">
                Regístrate
              </a>
            </p>
          </form>

          {/* User Stats Card */}
          <div className="mt-6 sm:mt-8 bg-white/60 backdrop-blur-sm border border-white/50 p-3 sm:p-4 rounded-full flex items-center justify-between shadow-lg max-w-md w-full">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex -space-x-2 sm:-space-x-3">
                <img
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white bg-gray-200 shadow-md"
                  src="https://i.pravatar.cc/100?img=33"
                  alt="User"
                />
                <img
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white bg-gray-200 shadow-md"
                  src="https://i.pravatar.cc/100?img=47"
                  alt="User"
                />
                <img
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white bg-gray-200 shadow-md"
                  src="https://i.pravatar.cc/100?img=12"
                  alt="User"
                />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">Únete a nuestros usuarios</p>
                <p className="text-[10px] sm:text-xs text-gray-600">Gestión eficiente y confiable</p>
              </div>
            </div>
            <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-300/50 bg-white/60 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:border-gray-300 text-gray-600 transition-all shadow-md">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Column - Decorative */}
        <div className="relative hidden lg:flex bg-gradient-to-br from-[#0A2640] via-[#0A2640] to-[#0d3050] rounded-3xl overflow-hidden flex-col p-8 xl:p-12 justify-between min-h-[600px] shadow-2xl">

          <h2 className="text-2xl xl:text-3xl font-normal text-white max-w-lg z-10 leading-snug drop-shadow-lg">
            Gestión inteligente de gastos de agua y luz para tus locales comerciales
          </h2>

          {/* Company Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[350px] h-[350px] xl:w-[450px] xl:h-[450px] animate-float">
              <Image
                src="/images/icon.png"
                alt="Jamber Corp"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Bottom Card - Stats & Features */}
          <div className="relative z-10 space-y-4">
            {/* Credentials Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 xl:p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm xl:text-base mb-2">Credenciales de Acceso</h3>
                  <div className="space-y-3">
                    {/* User Credentials */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                      <p className="text-white/90 text-xs font-semibold mb-1.5">👤 Usuario</p>
                      <div className="space-y-1">
                        <p className="text-white/70 text-xs">Usuario: <span className="text-white font-mono">chopchop</span></p>
                        <p className="text-white/70 text-xs">Password: <span className="text-white font-mono">123</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating animation keyframes are defined in globals.css */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}