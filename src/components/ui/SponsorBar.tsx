"use client";

import { useEffect, useState } from "react";

interface Sponsor {
  name: string;
  logo_url?: string;
  color?: string;
}

interface SponsorBarProps {
  sponsors: Sponsor[];
}

export function SponsorBar({ sponsors }: SponsorBarProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (sponsors.length <= 1) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % sponsors.length),
      4000
    );
    return () => clearInterval(timer);
  }, [sponsors.length]);

  if (!sponsors.length) return null;

  const sponsor = sponsors[index];

  return (
    <div className="flex h-10 items-center justify-center gap-2.5 bg-black/80 text-xs text-text-mid tracking-wide">
      <span className="text-[11px] font-semibold">Sponsored by</span>
      <div
        className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border"
        style={{
          backgroundColor: `${sponsor.color ?? "#e8b931"}30`,
          borderColor: `${sponsor.color ?? "#e8b931"}50`,
        }}
      >
        {sponsor.logo_url ? (
          <img
            src={sponsor.logo_url}
            alt={sponsor.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="font-mono text-[9px] font-black"
            style={{ color: sponsor.color ?? "#e8b931" }}
          >
            {sponsor.name.charAt(0)}
          </span>
        )}
      </div>
      <span className="text-[13px] font-extrabold text-text">
        {sponsor.name}
      </span>
    </div>
  );
}
