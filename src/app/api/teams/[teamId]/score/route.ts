import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const scoreAdjustSchema = z.object({
  delta: z.number().int(),
  reason: z.string().default("manual"),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = scoreAdjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Insert score adjustment
  const { error: insertError } = await supabase
    .from("score_adjustments")
    .insert({
      team_id: teamId,
      delta: parsed.data.delta,
      reason: parsed.data.reason,
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Recalculate score
  await supabase.rpc("update_team_score", { p_team_id: teamId });

  // Get updated score
  const { data: team } = await supabase
    .from("teams")
    .select("score")
    .eq("id", teamId)
    .single();

  return NextResponse.json({ newScore: team?.score ?? 0 });
}
