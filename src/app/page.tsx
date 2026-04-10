import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <h1 className="font-display text-5xl text-accent">Trivia Night</h1>
      <p className="text-text-mid text-lg">Host your own trivia night</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-dim"
        >
          Log In
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-surface-border px-6 py-3 font-semibold text-text transition-colors hover:bg-surface-hi"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
