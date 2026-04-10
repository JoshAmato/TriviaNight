interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  className?: string;
}

export function Badge({
  children,
  color,
  bg,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${className}`}
      style={{
        backgroundColor: bg ?? "var(--color-surface-hi)",
        color: color ?? "var(--color-text-dim)",
      }}
    >
      {children}
    </span>
  );
}
