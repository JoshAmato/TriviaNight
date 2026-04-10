import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get game with rounds, round_questions, and questions
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .eq("host_id", user.id)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("game_id", gameId)
    .order("sort_order", { ascending: true });

  const roundIds = (rounds ?? []).map((r) => r.id);

  let roundQuestions: Record<string, Array<{ id: string; round_id: string; question_id: string; sort_order: number; question: Record<string, unknown> }>> = {};

  if (roundIds.length > 0) {
    const { data: rqData } = await supabase
      .from("round_questions")
      .select("*, question:questions(*)")
      .in("round_id", roundIds)
      .order("sort_order", { ascending: true });

    if (rqData) {
      for (const rq of rqData) {
        if (!roundQuestions[rq.round_id]) roundQuestions[rq.round_id] = [];
        roundQuestions[rq.round_id].push(rq as typeof rqData[number] & { question: Record<string, unknown> });
      }
    }
  }

  // Get game sponsors
  const { data: gameSponsors } = await supabase
    .from("game_sponsors")
    .select("*, sponsor:sponsors(*)")
    .eq("game_id", gameId);

  return NextResponse.json({
    ...game,
    rounds: (rounds ?? []).map((r) => ({
      ...r,
      questions: roundQuestions[r.id] ?? [],
    })),
    sponsors: (gameSponsors ?? []).map((gs) => gs.sponsor),
  });
}

const updateGameSchema = z.object({
  name: z.string().min(1).optional(),
  game_title: z.string().nullable().optional(),
  hide_scoreboard: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateGameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("games")
    .update(parsed.data)
    .eq("id", gameId)
    .eq("host_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("games")
    .delete()
    .eq("id", gameId)
    .eq("host_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
