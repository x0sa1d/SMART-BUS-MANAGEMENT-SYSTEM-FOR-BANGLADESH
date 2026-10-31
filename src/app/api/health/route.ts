import { NextResponse } from "next/server";
import { checkDatabaseConnection, isDatabaseConfigured } from "@/lib/db";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const databaseConfigured = isDatabaseConfigured();
  const supabaseConfigured = isSupabaseConfigured();
  const database = databaseConfigured ? await checkDatabaseConnection() : false;

  return NextResponse.json({
    ok: database && supabaseConfigured,
    database,
    supabase: supabaseConfigured,
  });
}
