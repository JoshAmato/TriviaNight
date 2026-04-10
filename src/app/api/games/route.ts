import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const createGameSchema = z.object({
  name: z.string().min(1, "Game name is required"),
  game_title: z.string().optional(),
  hide_scoreboard: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createGameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Generate a temporary room code (will be replaced on go-live)
  const { data: codeResult } = await supabase.rpc("generate_room_code");
  const roomCode = codeResult || Math.random().toString(36).substring(2, 6).toUpperCase();

  const { data, error } = await supabase
    .from("games")
    .insert({
      host_id: user.id,
      name: parsed.data.name,
      game_title: parsed.data.game_title || null,
      hide_scoreboard: parsed.data.hide_scoreboard,
      room_code: roomCode,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
