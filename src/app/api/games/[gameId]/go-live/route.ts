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
  if (game.status === "live") {
    return NextResponse.json({ error: "Game is already live" }, { status: 400 });
  }

  // Generate a fresh room code
  const { data: roomCode } = await supabase.rpc("generate_room_code");

  // Update game to live
  const { error: updateError } = await supabase
    .from("games")
    .update({ status: "live", room_code: roomCode })
    .eq("id", gameId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Create game_state row
  const { error: stateError } = await supabase.from("game_state").insert({
    game_id: gameId,
    phase: "lobby",
  });

  if (stateError) {
    return NextResponse.json({ error: stateError.message }, { status: 500 });
  }

  return NextResponse.json({ roomCode, status: "live" });
}
