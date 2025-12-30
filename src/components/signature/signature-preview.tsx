"use client";

import { useEffect, useRef } from "react";
import type { SignaturePayloadV1 } from "@/types";

type Props = {
  signature: SignaturePayloadV1;
  height?: number;
};

function draw(
  canvas: HTMLCanvasElement,
  signature: SignaturePayloadV1,
  height: number,
) {
  const rect = canvas.getBoundingClientRect();
  const ratio = typeof window !== "undefined" ? window.devicePixelRatio ?? 1 : 1;
  const widthPx = Math.max(1, Math.round(rect.width * ratio));
  const heightPx = Math.max(1, Math.round(height * ratio));
  if (canvas.width !== widthPx) canvas.width = widthPx;
  if (canvas.height !== heightPx) canvas.height = heightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 2.2;

  for (const stroke of signature.strokes) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    const [x0, y0] = stroke[0];
    ctx.moveTo(x0 * canvas.width, y0 * canvas.height);
    for (let i = 1; i < stroke.length; i += 1) {
      const [x, y] = stroke[i];
      ctx.lineTo(x * canvas.width, y * canvas.height);
    }
    ctx.stroke();
  }
}

export function SignaturePreview({ signature, height = 120 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw(canvas, signature, height);
    const observer = new ResizeObserver(() => draw(canvas, signature, height));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [height, signature]);

  return (
    <div className="rounded-2xl border border-border bg-background">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height }}
      />
    </div>
  );
}

