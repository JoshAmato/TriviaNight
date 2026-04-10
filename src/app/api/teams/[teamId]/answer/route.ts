import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { answerSubmitSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const supabase = createServiceClient();

  const body = await request.json();
  const parsed = answerSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { answer_text, round_question_id, device_id } = parsed.data;

  // Verify team member is captain
  const { data: member } = await supabase
    .from("team_members")
    .select("is_captain")
    .eq("team_id", teamId)
    .eq("device_id", device_id)
    .single();

  if (!member?.is_captain) {
    return NextResponse.json(
      { error: "Only the team captain can submit answers" },
      { status: 403 }
    );
  }

  // Verify round_question_id belongs to the team's game
  const { data: team } = await supabase
    .from("teams")
    .select("game_id")
    .eq("id", teamId)
    .single();

  const { data: rq } = await supabase
    .from("round_questions")
    .select("id, rounds!inner(game_id)")
    .eq("id", round_question_id)
    .eq("rounds.game_id", team?.game_id)
    .single();

  if (!rq) {
    return NextResponse.json({ error: "Invalid question" }, { status: 403 });
  }

  // Upsert answer (allows re-submission before timer expires)
  const { data, error } = await supabase
    .from("team_answers")
    .upsert(
      {
        team_id: teamId,
        round_question_id,
        answer_text,
      },
      { onConflict: "team_id,round_question_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
