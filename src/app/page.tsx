"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) {
      router.push(`/play/${trimmed}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg px-4">
      <h1 className="font-display text-5xl text-accent">Trivia Night</h1>
      <p className="text-lg text-text-mid">Enter your room code to join</p>

      <form onSubmit={handleJoin} className="flex flex-col items-center gap-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ROOM CODE"
          maxLength={6}
          className="w-64 rounded-lg border border-surface-border bg-surface px-6 py-4 text-center font-mono text-3xl font-bold tracking-widest text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
          autoFocus
        />
        <button
          type="submit"
          disabled={!code.trim()}
          className="w-64 rounded-lg bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-dim disabled:opacity-40"
        >
          Join Game
        </button>
      </form>
    </div>
  );
}
