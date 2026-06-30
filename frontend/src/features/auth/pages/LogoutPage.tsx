import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "@/lib/supabase";

export function LogoutPage(): ReactElement {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const signOut = async (): Promise<void> => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setErrorMessage(error.message);
      }
    };

    void signOut();
  }, []);

  return (
    <section className="mx-auto max-w-lg rounded-[1.75rem] border border-white/10 bg-white/5 p-8 text-center text-slate-100">
      <h1 className="text-3xl font-semibold">Sesión cerrada</h1>
      <p className="mt-3 text-sm text-slate-300">
        {errorMessage ?? "Ya podés volver a entrar o crear otra cuenta."}
      </p>
      <Link className="mt-6 inline-flex rounded-full bg-cyan-400 px-5 py-2.5 font-medium text-slate-950" to="/login">
        Volver a entrar
      </Link>
    </section>
  );
}
