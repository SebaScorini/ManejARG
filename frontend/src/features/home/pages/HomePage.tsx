import type { ReactElement } from "react";

import { Link } from "react-router-dom";

export function HomePage(): ReactElement {
  return (
    <section className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
      <div className="space-y-6">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.3em] text-cyan-200">
          Personal finance for Argentina
        </span>
        <div className="space-y-4">
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            Tu dinero, ordenado desde login hasta análisis.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-300">
            Base de ManejARG: cuentas, transacciones y recomendaciones sobre una estructura lista para escalar.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300" to="/signup">
            Crear cuenta
          </Link>
          <Link className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white hover:border-cyan-400/60 hover:text-cyan-200" to="/login">
            Entrar
          </Link>
        </div>
      </div>

      <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-slate-950/30">
        <div className="space-y-4">
          <div className="h-40 rounded-[1.5rem] bg-gradient-to-br from-cyan-400/25 via-sky-500/10 to-amber-300/10" />
          <div className="grid gap-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">Supabase Auth login/signup</div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">FastAPI JWT validation</div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">Initial schema migration</div>
          </div>
        </div>
      </aside>
    </section>
  );
}
