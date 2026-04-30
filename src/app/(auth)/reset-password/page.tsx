import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-3xl font-semibold">Set new password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose a new password for your Plan2Ponuda account.
        </p>
      </div>
      <ResetPasswordForm token={token ?? ""} />
    </main>
  );
}
