"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewGameButton() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (res.ok) {
      const game = await res.json();
      router.push(`/game/${game.id}/builder`);
    }
    setCreating(false);
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent-dim"
      >
        + New Game
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Game name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        autoFocus
        className="rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent"
      />
      <button
        onClick={handleCreate}
        disabled={creating || !name.trim()}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent-dim disabled:opacity-50"
      >
        {creating ? "..." : "Create"}
      </button>
      <button
        onClick={() => {
          setShowForm(false);
          setName("");
        }}
        className="rounded-lg px-3 py-2 text-sm text-text-mid hover:text-text"
      >
        Cancel
      </button>
    </div>
  );
}
