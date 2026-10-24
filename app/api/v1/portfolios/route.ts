import { AppError } from "@/lib/error/error";
import { createPortfolio } from "@/lib/service/portfolio-service";
import { createClient } from "@/lib/supabase/server";
import { PostgrestError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const nameCharacterLimit = 70;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new AppError("Unauthenticated", { status: 401 });
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AppError("Invalid JSON", { status: 400 });
    }
    if (
      typeof body !== "object" ||
      body === null ||
      !("name" in body) ||
      typeof body.name !== "string"
    ) {
      throw new AppError("Name must be a string", { status: 400 });
    }
    const name: string = body.name.trim();
    if (!name || [...name].length > nameCharacterLimit) {
      throw new AppError(
        `Name should be between 1-${nameCharacterLimit} characters`,
        { status: 400 },
      );
    }

    const portfolio = await createPortfolio(name, user, supabase);
    return NextResponse.json({ portfolio }, { status: 201 });
  } catch (error) {
    let errorCode = 500;
    let errorMessage = "Unable to create an portfolio";

    if (error instanceof PostgrestError) console.error(error);
    if (
      error instanceof AppError &&
      typeof error.details?.status === "number"
    ) {
      console.error(error);
      errorCode = error.details.status;
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: errorCode });
  }
}
