import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { teamJoinSchema } from "@/lib/validators";
import { TEAM_COLORS } from "@/lib/constants";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();
  const parsed = teamJoinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { teamName, pin, deviceId, gameId } = parsed.data;

  // Verify game is live
  const { data: game } = await supabase
    .from("games")
    .select("*, host:hosts(*)")
    .eq("id", gameId)
    .eq("status", "live")
    .single();

  if (!game) {
    return NextResponse.json({ error: "Game not found or not live" }, { status: 404 });
  }

  const openJoin = game.host?.open_join ?? false;

  // Check if team exists
  const { data: existingTeam } = await supabase
    .from("teams")
    .select("*")
    .eq("game_id", gameId)
    .eq("name", teamName)
    .single();

  if (existingTeam) {
    // Joining existing team
    if (!openJoin && existingTeam.pin_hash) {
      if (!pin) {
        return NextResponse.json(
          { error: "PIN required", needsPin: true },
          { status: 400 }
        );
      }
      const pinMatch = await bcrypt.compare(pin, existingTeam.pin_hash);
      if (!pinMatch) {
        return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
      }
    }

    // Add as team member
    await supabase.from("team_members").insert({
      team_id: existingTeam.id,
      device_id: deviceId,
      is_captain: false,
    });

    return NextResponse.json({
      team: existingTeam,
      isCaptain: false,
      isNew: false,
    });
  }

  // Creating new team
  const { count: teamCount } = await supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("game_id", gameId);

  const joinOrder = teamCount ?? 0;
  const color = TEAM_COLORS[joinOrder % TEAM_COLORS.length];

  let pinHash: string | null = null;
  if (!openJoin && pin) {
    pinHash = await bcrypt.hash(pin, 10);
  }

  const { data: newTeam, error: teamError } = await supabase
    .from("teams")
    .insert({
      game_id: gameId,
      name: teamName,
      color,
      pin_hash: pinHash,
      join_order: joinOrder,
    })
    .select()
    .single();

  if (teamError) {
    if (teamError.code === "23505") {
      return NextResponse.json(
        { error: "Team name already taken" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: teamError.message }, { status: 500 });
  }

  // Add captain
  await supabase.from("team_members").insert({
    team_id: newTeam.id,
    device_id: deviceId,
    is_captain: true,
  });

  return NextResponse.json(
    { team: newTeam, isCaptain: true, isNew: true },
    { status: 201 }
  );
}
