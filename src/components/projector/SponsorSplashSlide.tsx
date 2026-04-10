"use client";

interface SponsorSplashSlideProps {
  name: string;
  logoUrl?: string;
  color?: string;
}

export function SponsorSplashSlide({
  name,
  logoUrl,
  color = "#e8b931",
}: SponsorSplashSlideProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <p className="text-sm font-bold uppercase tracking-widest text-text-mid">
        Tonight&apos;s Sponsor
      </p>
      <div
        className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-2xl border-2"
        style={{
          backgroundColor: `${color}20`,
          borderColor: `${color}40`,
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={name}
            className="h-full w-full object-contain p-4"
          />
        ) : (
          <span
            className="font-display text-7xl"
            style={{ color }}
          >
            {name.charAt(0)}
          </span>
        )}
      </div>
      <h1 className="font-display text-5xl" style={{ color }}>
        {name}
      </h1>
    </div>
  );
}
