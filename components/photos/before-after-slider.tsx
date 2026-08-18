"use client";

import * as React from "react";
import Image from "next/image";
import { GripHorizontal } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel: string;
  afterLabel: string;
}

export function BeforeAfterSlider({ beforeUrl, afterUrl, beforeLabel, afterLabel }: BeforeAfterSliderProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState(50);
  const dragging = React.useRef(false);

  function updateFromClientX(clientX: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    updateFromClientX(e.clientX);
  }
  function handlePointerUp() {
    dragging.current = false;
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-square w-full touch-none select-none overflow-hidden rounded-radius-lg bg-beige-50"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <Image src={afterUrl} alt={afterLabel} fill sizes="400px" className="object-cover" unoptimized />
      <Image
        src={beforeUrl}
        alt={beforeLabel}
        fill
        sizes="400px"
        className="object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        unoptimized
      />

      <div
        className="absolute inset-y-0 z-10 flex w-0.5 -translate-x-1/2 items-center justify-center bg-white"
        style={{ left: `${position}%` }}
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-white shadow-soft-md">
          <GripHorizontal className="size-4 text-navy-500" />
        </div>
      </div>

      <span className="absolute bottom-2 left-2 rounded-radius-full bg-navy-500/70 px-2 py-0.5 text-[11px] font-medium text-white">
        {beforeLabel}
      </span>
      <span className="absolute bottom-2 right-2 rounded-radius-full bg-navy-500/70 px-2 py-0.5 text-[11px] font-medium text-white">
        {afterLabel}
      </span>
    </div>
  );
}
