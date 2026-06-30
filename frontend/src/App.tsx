import type { ReactElement, ReactNode } from "react";

import { Link, Navigate, Route, Routes } from "react-router-dom";

import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { LogoutPage } from "@/features/auth/pages/LogoutPage";
import { SignupPage } from "@/features/auth/pages/SignupPage";
import { HomePage } from "@/features/home/pages/HomePage";
import { useAuth } from "@/features/auth/authContext";

function ProtectedRoute({ children }: { children: ReactNode }): ReactElement {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-300">
        Cargando sesión...
      </div>
    );
  }

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  return <>{children}</>;
}

export default function App(): ReactElement {
  const { session } = useAuth();

  return (
    <div className="min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4 sm:px-8">
          <Link className="text-lg font-semibold uppercase tracking-[0.2em] text-cyan-300" to="/">
            ManejARG
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            {session ? (
              <>
                <Link className="rounded-full border border-white/10 px-4 py-2 hover:border-cyan-400/50 hover:text-cyan-200" to="/app">
                  Dashboard
                </Link>
                <Link className="rounded-full border border-white/10 px-4 py-2 hover:border-cyan-400/50 hover:text-cyan-200" to="/logout">
                  Salir
                </Link>
              </>
            ) : (
              <>
                <Link className="rounded-full border border-white/10 px-4 py-2 hover:border-cyan-400/50 hover:text-cyan-200" to="/login">
                  Entrar
                </Link>
                <Link className="rounded-full bg-cyan-400 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-300" to="/signup">
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </header>

        <main className="flex-1 px-6 py-8 sm:px-8 lg:px-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/logout" element={<LogoutPage />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
