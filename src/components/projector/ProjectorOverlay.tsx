"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface ProjectorOverlayProps {
  onNextPhase: () => void;
  onToggleScoreboard: () => void;
  onSponsorSplash: () => void;
  currentPhase: string;
}

export function ProjectorOverlay({
  onNextPhase,
  onToggleScoreboard,
  onSponsorSplash,
  currentPhase,
}: ProjectorOverlayProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      {/* Toggle button (bottom right) */}
      <button
        onClick={() => setVisible(!visible)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-surface/80 p-3 text-text-mid backdrop-blur hover:text-text"
        title="Toggle projector controls"
      >
        &#x2699;
      </button>

      {/* Overlay panel */}
      {visible && (
        <div className="fixed bottom-16 right-4 z-50 rounded-xl border border-surface-border bg-surface/95 p-4 shadow-xl backdrop-blur">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-mid">
            Projector Controls
          </p>
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={onNextPhase}>
              Next Phase
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onToggleScoreboard}
            >
              Toggle Scoreboard
            </Button>
            <Button size="sm" variant="secondary" onClick={onSponsorSplash}>
              Sponsor Splash
            </Button>
            <p className="mt-1 text-xs text-text-dim">
              Phase: {currentPhase}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
