import { LoginErrorCode } from "@/lib/auth/error/error";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (!tokenHash || type !== "email") {
    const errorCode : LoginErrorCode = "invalid_link";
    return NextResponse.redirect(new URL(`/auth/login?error=${errorCode}`, request.url));
  }

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) {
      console.error("Magic link verification faled", {code: error.code, status: error.status})
      const reason : LoginErrorCode = error.code === "otp_expired" ? "invalid_link": "verification_failed";
      return NextResponse.redirect(new URL(`/auth/login?error=${reason}`, request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error: unknown) {
    console.error("Unexpected error occured during user signin", error);
    const errorCode : LoginErrorCode = "server_error";
    return NextResponse.redirect(new URL(`/auth/login?error=${errorCode}`, request.url));
  }
}