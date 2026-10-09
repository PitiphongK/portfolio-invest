import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const { data, error } = await supabase.from("accounts").select();
  if (error) {
    console.error("Fail to get accounts data: ", error);
    return NextResponse.json(
      { error: "Fail to get accounts data: "},
      { status: 500 }
    )
  }
  return NextResponse.json({ data });
}
