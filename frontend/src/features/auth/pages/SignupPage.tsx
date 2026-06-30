import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthForm } from "@/features/auth/components/AuthForm";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function SignupPage(): ReactElement {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    navigate("/app", { replace: true });
  };

  return (
    <AuthForm
      description="Abrí tu cuenta y dejá listo el acceso para conectar wallets después."
      errorMessage={!isSupabaseConfigured ? "Faltan variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY." : errorMessage}
      onSubmit={handleSubmit}
      secondaryAction={
        <>
          Ya tenés cuenta? <Link className="text-cyan-300 underline-offset-4 hover:underline" to="/login">Entrá acá</Link>.
        </>
      }
      submitLabel="Crear cuenta"
      title="Crear cuenta"
    >
      <label className="block space-y-2 text-sm text-slate-200">
        <span>Email</span>
        <input
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/70"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="vos@correo.com"
          required
          type="email"
          value={email}
        />
      </label>

      <label className="block space-y-2 text-sm text-slate-200">
        <span>Contraseña</span>
        <input
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/70"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 6 caracteres"
          required
          type="password"
          value={password}
        />
      </label>
    </AuthForm>
  );
}
