import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Access your Plan2Ponuda workspace.
        </p>
      </div>
      <Suspense fallback={<SignInFormFallback />}>
        <SignInForm />
      </Suspense>
    </main>
  );
}

function SignInFormFallback() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-10 rounded-md border border-slate-200 bg-slate-100" />
      <div className="h-10 rounded-md border border-slate-200 bg-slate-100" />
      <div className="h-10 rounded-md bg-slate-200" />
    </div>
  );
}
