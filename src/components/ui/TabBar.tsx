"use client";

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onSelect: (id: string) => void;
}

export function TabBar({ tabs, active, onSelect }: TabBarProps) {
  return (
    <div className="flex gap-0.5 rounded-[10px] bg-surface-hi p-[3px]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`flex-1 rounded-lg px-4 py-2 text-[13px] font-bold transition-all duration-150 ${
            active === tab.id
              ? "bg-accent text-bg"
              : "text-text-dim hover:text-text-mid"
          }`}
        >
          {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
