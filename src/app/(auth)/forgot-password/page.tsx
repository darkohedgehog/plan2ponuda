import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-3xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your email and we will prepare password reset instructions if
          the account exists.
        </p>
      </div>
      <ForgotPasswordForm />
    </main>
  );
}
