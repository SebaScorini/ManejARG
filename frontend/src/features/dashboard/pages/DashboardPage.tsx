import type { ReactElement } from "react";

import { useAuth } from "@/features/auth/authContext";

export function DashboardPage(): ReactElement {
  const { session } = useAuth();

  return (
    <section className="space-y-8">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Foundation</p>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">Base lista para auth, cuentas y movimientos.</h1>
        <p className="max-w-2xl text-base leading-7 text-slate-300">
          Scaffold de Phase 1: sesión Supabase, backend JWT, migración inicial y espacio para el resto del flujo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Estado</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-300">Sesión activa</p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Usuario</p>
          <p className="mt-2 break-all text-base font-medium text-slate-100">{session?.user.email ?? session?.user.id}</p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Próximo paso</p>
          <p className="mt-2 text-base text-slate-100">Conectar cuentas y mostrar transacciones.</p>
        </article>
      </div>
    </section>
  );
}
