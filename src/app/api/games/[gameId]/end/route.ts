import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .eq("host_id", user.id)
    .single();

  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Update game status
  await supabase
    .from("games")
    .update({ status: "completed" })
    .eq("id", gameId);

  // Update game_state phase
  await supabase
    .from("game_state")
    .update({ phase: "gameOver", timer_running: false })
    .eq("game_id", gameId);

  // Increment question usage counts
  const { data: roundQuestions } = await supabase
    .from("round_questions")
    .select("question_id, round:rounds!inner(game_id)")
    .eq("round.game_id", gameId);

  if (roundQuestions && roundQuestions.length > 0) {
    const questionIds = roundQuestions.map((rq) => rq.question_id);
    await supabase.rpc("increment_question_usage", {
      p_question_ids: questionIds,
    });
  }

  return NextResponse.json({ success: true });
}
