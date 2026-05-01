import Link from "next/link";

import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-10">
      <Link
        className="w-fit text-sm font-semibold text-slate-500 outline-none transition-colors hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-100"
        href="/"
      >
        Back to Home
      </Link>
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">
          Create account
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Set up your electrician quoting workspace.
        </p>
      </div>
      <SignUpForm />
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          className="font-semibold text-blue-700 hover:text-blue-800"
          href="/sign-in"
        >
          Sign in
        </Link>
      </p>
    </main>
  );
}
