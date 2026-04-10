import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NewGameButton } from "./NewGameButton";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: games } = await supabase
    .from("games")
    .select("*")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  const { data: host } = await supabase
    .from("hosts")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-accent">
            {host?.default_game_title ?? "Trivia Night"}
          </h1>
          <p className="mt-1 text-text-mid">{user.email}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/branding"
            className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-surface-hi"
          >
            Branding
          </Link>
          <Link
            href="/dashboard/questions"
            className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-surface-hi"
          >
            Question Bank
          </Link>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Games</h2>
        <NewGameButton />
      </div>

      {!games || games.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-surface p-12 text-center">
          <p className="text-lg text-text-mid">No games yet</p>
          <p className="mt-2 text-sm text-text-dim">
            Create your first trivia game to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {games.map((game) => {
            const href =
              game.status === "live"
                ? `/game/${game.id}/live`
                : `/game/${game.id}/builder`;

            return (
              <Link
                key={game.id}
                href={href}
                className="flex items-center justify-between rounded-xl border border-surface-border bg-surface p-5 transition-colors hover:border-accent/30"
              >
                <div>
                  <h3 className="font-semibold text-text">{game.name}</h3>
                  <p className="mt-1 text-sm text-text-dim">
                    {new Date(game.created_at).toLocaleDateString()} {"\u00B7"}{" "}
                    <span
                      className={
                        game.status === "live"
                          ? "text-correct"
                          : game.status === "completed"
                            ? "text-text-mid"
                            : "text-accent"
                      }
                    >
                      {game.status}
                    </span>
                  </p>
                </div>
                {game.status === "live" && game.room_code && (
                  <span className="rounded bg-correct/10 px-3 py-1 font-mono text-lg font-bold text-correct">
                    {game.room_code}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
