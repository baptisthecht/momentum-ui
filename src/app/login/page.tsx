import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { LoginForm } from "./form";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-base font-bold text-white">
            M
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">Momentum</h1>
            <p className="text-xs text-zinc-500">Trading bot control panel</p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-border bg-surface-1 p-6">
          <h2 className="mb-5 text-sm font-medium text-zinc-300">Sign in to your account</h2>
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-zinc-600">
          Secure server-side authentication
        </p>
      </div>
    </div>
  );
}
