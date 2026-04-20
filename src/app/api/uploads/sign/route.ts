import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/guards";

export async function POST() {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  return NextResponse.json({
    uploadUrl: null,
    fileKey: null,
    message: "Upload signing placeholder for private Supabase Storage bucket.",
  });
}
