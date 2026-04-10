interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-surface-border bg-surface p-5 transition-colors ${onClick ? "cursor-pointer hover:border-accent/30" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
