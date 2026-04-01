import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RegisterForm } from "./form";

export default async function RegisterPage() {
  const session = await auth();
  if (session) redirect("/");
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-base font-bold text-white">M</div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">Momentum</h1>
            <p className="text-xs text-zinc-500">Create your account</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface-1 p-6">
          <h2 className="mb-5 text-sm font-medium text-zinc-300">Register</h2>
          <RegisterForm />
        </div>
        <p className="mt-4 text-center text-xs text-zinc-600">
          Already have an account?{" "}
          <a href="/login" className="text-accent hover:text-accent-hover">Sign in</a>
        </p>
      </div>
    </div>
  );
}
