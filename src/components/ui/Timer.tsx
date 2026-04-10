"use client";

interface TimerProps {
  remaining: number;
  total: number;
  running?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Timer({ remaining, total, size = "md" }: TimerProps) {
  const fraction = total > 0 ? remaining / total : 0;
  const isLow = remaining <= 5 && remaining > 0;

  const sizes = {
    sm: { ring: 48, stroke: 3, text: "text-lg" },
    md: { ring: 80, stroke: 4, text: "text-3xl" },
    lg: { ring: 120, stroke: 5, text: "text-5xl" },
  };

  const { ring, stroke, text } = sizes[size];
  const radius = (ring - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display =
    minutes > 0
      ? `${minutes}:${seconds.toString().padStart(2, "0")}`
      : `${seconds}`;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={ring} height={ring} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-border)"
          strokeWidth={stroke}
        />
        {/* Progress ring */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          fill="none"
          stroke={isLow ? "var(--color-danger)" : "var(--color-accent)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span
        className={`absolute font-mono font-bold ${text} ${isLow ? "text-danger" : "text-text"}`}
      >
        {display}
      </span>
    </div>
  );
}
