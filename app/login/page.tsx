"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, Lock, Eye, Users, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";

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
            <h2 className="text-lg sm:text-xl font-bold text-[#0A2640] mb-6 sm:mb-8">Jamber Corp</h2>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-gray-900 mb-3 sm:mb-4 leading-tight">
              Acceso a <br /> Administrador
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md">
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

          <h2 className="text-2xl xl:text-3xl font-normal text-white max-w-lg z-10 leading-snug drop-shadow-lg">
            Gestión inteligente de gastos de agua y luz para tus locales comerciales
          </h2>

          {/* Company Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[350px] h-[350px] xl:w-[450px] xl:h-[450px] animate-float opacity-90">
              <Image
                src="/icon-512x512.png"
                alt="Jamber Corp Logo"
                fill
                className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                priority
              />
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
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
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