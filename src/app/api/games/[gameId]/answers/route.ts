import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const supabase = await createServerSupabaseClient();

  // Verify host owns this game
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("id", gameId)
    .eq("host_id", user.id)
    .single();

  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get round_question_id from query params
  const roundQuestionId = request.nextUrl.searchParams.get("round_question_id");
  if (!roundQuestionId) {
    return NextResponse.json({ error: "round_question_id required" }, { status: 400 });
  }

  // Verify round_question_id belongs to this game
  const { data: rq } = await supabase
    .from("round_questions")
    .select("id, rounds!inner(game_id)")
    .eq("id", roundQuestionId)
    .eq("rounds.game_id", gameId)
    .single();

  if (!rq) {
    return NextResponse.json({ error: "Question not found in this game" }, { status: 404 });
  }

  // Fetch answers
  const { data: answers, error } = await supabase
    .from("team_answers")
    .select("*")
    .eq("round_question_id", roundQuestionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ answers: answers ?? [] });
}
