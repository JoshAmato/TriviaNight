import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { wagerSubmitSchema } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const supabase = createServiceClient();

  const body = await request.json();
  const parsed = wagerSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { wager_amount, round_id, device_id } = parsed.data;

  // Verify captain
  const { data: member } = await supabase
    .from("team_members")
    .select("is_captain")
    .eq("team_id", teamId)
    .eq("device_id", device_id)
    .single();

  if (!member?.is_captain) {
    return NextResponse.json(
      { error: "Only the team captain can submit wagers" },
      { status: 403 }
    );
  }

  // Validate wager amount against team score
  const { data: team } = await supabase
    .from("teams")
    .select("score, game_id")
    .eq("id", teamId)
    .single();

  // Verify round_id belongs to the team's game
  const { data: round } = await supabase
    .from("rounds")
    .select("id")
    .eq("id", round_id)
    .eq("game_id", team?.game_id)
    .single();

  if (!round) {
    return NextResponse.json({ error: "Invalid round" }, { status: 403 });
  }

  const maxWager = Math.max(1, team?.score ?? 0);
  const clampedWager = Math.min(Math.max(1, wager_amount), maxWager);

  const { data, error } = await supabase
    .from("team_wagers")
    .upsert(
      {
        team_id: teamId,
        round_id,
        wager_amount: clampedWager,
      },
      { onConflict: "team_id,round_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
