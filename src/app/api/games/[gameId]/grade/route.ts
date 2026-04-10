import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";
import { normalize } from "@/lib/grading";

const gradeSchema = z.object({
  round_question_id: z.string().uuid(),
  answer_text: z.string(), // The normalized answer to grade
  is_correct: z.boolean(),
  question_points: z.number().int().default(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify host owns this game
  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("id", gameId)
    .eq("host_id", user.id)
    .single();
  if (!game) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = gradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { round_question_id, answer_text, is_correct, question_points } = parsed.data;
  const normalizedTarget = normalize(answer_text);

  // Find all answers with matching normalized text for this question
  const { data: answers } = await supabase
    .from("team_answers")
    .select("*")
    .eq("round_question_id", round_question_id)
    .is("is_correct", null); // Only grade ungraded

  if (!answers) {
    return NextResponse.json({ error: "No answers found" }, { status: 404 });
  }

  const matching = answers.filter(
    (a) => normalize(a.answer_text) === normalizedTarget
  );

  // Update all matching answers
  const pointsEarned = is_correct ? question_points : 0;

  for (const answer of matching) {
    await supabase
      .from("team_answers")
      .update({ is_correct, points_earned: pointsEarned })
      .eq("id", answer.id);

    // Recalculate team score
    await supabase.rpc("update_team_score", { p_team_id: answer.team_id });
  }

  return NextResponse.json({
    graded: matching.length,
    is_correct,
    points_earned: pointsEarned,
  });
}
