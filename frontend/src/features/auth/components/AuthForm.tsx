import type { FormEvent, ReactElement, ReactNode } from "react";

type AuthFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  secondaryAction: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  errorMessage: string | null;
  children: ReactNode;
};

export function AuthForm({
  title,
  description,
  submitLabel,
  secondaryAction,
  onSubmit,
  errorMessage,
  children,
}: AuthFormProps): ReactElement {
  return (
    <section className="mx-auto max-w-md rounded-[1.75rem] border border-white/10 bg-white/5 p-8 shadow-lg shadow-slate-950/40 backdrop-blur">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">ManejARG</p>
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        <p className="text-sm leading-6 text-slate-300">{description}</p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        {children}

        {errorMessage ? (
          <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </p>
        ) : null}

        <button
          className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          type="submit"
        >
          {submitLabel}
        </button>
      </form>

      <div className="mt-6 text-sm text-slate-300">{secondaryAction}</div>
    </section>
  );
}
