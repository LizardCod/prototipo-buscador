import React, { useState } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  ShieldCheck,
  User,
} from 'lucide-react';
import { AppUser, authenticateUser, TEST_USERS } from '../utils/auth';

interface LoginViewProps {
  onLogin: (user: AppUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const matched = authenticateUser(email, password);
    if (!matched) {
      setError('Correo o contraseña incorrectos. Usa uno de los usuarios de prueba.');
      return;
    }
    onLogin(matched);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-11 h-11 rounded-2xl bg-blue-700 text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Prototipo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control de acceso por nivel de usuario
          </p>
        </div>

        {/* Credentials Card (borderless with soft shadow) */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.08)] p-5 sm:p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-slate-700"
            >
              Correo electrónico
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@prototipo.local"
              className="w-full min-h-[46px] px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-slate-700"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[46px] pl-3.5 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Ver contraseña'
                }
                className="min-h-[40px] min-w-[40px] flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-50 text-red-800 rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full min-h-[48px] px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar sesión</span>
          </button>
        </form>

        {/* Quick Test Users */}
        <section className="space-y-2.5">
          <p className="text-xs font-semibold text-slate-500 px-1">
            Usuarios de prueba (acceso directo en 1 toque)
          </p>
          <div className="space-y-2.5">
            {TEST_USERS.map((u) => {
              const isAdmin = u.role === 'admin';
              return (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl shadow-[0_2px_12px_-3px_rgba(15,23,42,0.08)] p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isAdmin
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isAdmin ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-x-2 text-xs">
                        <span className="font-bold text-slate-900">
                          {u.roleLabel}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-600">{u.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {u.permissionsSummary}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 pt-0.5 tabular-nums">
                        {u.email} · clave: {u.password}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onLogin(u)}
                      className={`flex-1 min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isAdmin
                          ? 'bg-blue-700 hover:bg-blue-800 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      Entrar como {isAdmin ? 'Administrador' : 'Cliente'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(u.email);
                        setPassword(u.password);
                        setError(null);
                      }}
                      className="min-h-[42px] px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
                    >
                      Rellenar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
