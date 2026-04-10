import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { questionSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const difficulty = searchParams.get("difficulty");
  const answerType = searchParams.get("answer_type");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sort_by") ?? "created_at";
  const sortDir = searchParams.get("sort_dir") === "asc" ? true : false;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const perPage = parseInt(searchParams.get("per_page") ?? "50", 10);

  let query = supabase
    .from("questions")
    .select("*", { count: "exact" })
    .eq("host_id", user.id);

  if (category) query = query.eq("category", category);
  if (difficulty) query = query.eq("difficulty", difficulty);
  if (answerType) query = query.eq("answer_type", answerType);
  if (search) query = query.ilike("text", `%${search}%`);

  query = query
    .order(sortBy, { ascending: sortDir })
    .range((page - 1) * perPage, page * perPage - 1);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ questions: data, total: count, page, perPage });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("questions")
    .insert({ ...parsed.data, host_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
