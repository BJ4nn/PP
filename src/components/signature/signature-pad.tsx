"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SignaturePayloadV1 } from "@/types";

type Point = [number, number];

type Props = {
  value: SignaturePayloadV1 | null;
  onChange: (value: SignaturePayloadV1 | null) => void;
  disabled?: boolean;
  height?: number;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function totalPoints(signature: SignaturePayloadV1) {
  return signature.strokes.reduce((sum, stroke) => sum + stroke.length, 0);
}

function drawSignature(
  ctx: CanvasRenderingContext2D,
  signature: SignaturePayloadV1,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 2.2;

  for (const stroke of signature.strokes) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    const [x0, y0] = stroke[0];
    ctx.moveTo(x0 * width, y0 * height);
    for (let i = 1; i < stroke.length; i += 1) {
      const [x, y] = stroke[i];
      ctx.lineTo(x * width, y * height);
    }
    ctx.stroke();
  }
}

export function SignaturePad({ value, onChange, disabled, height = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const activeStrokeRef = useRef<Point[]>([]);
  const [hasPointer, setHasPointer] = useState(false);

  const signature = value;

  const canClear = !!signature && signature.strokes.length > 0;

  const hint = useMemo(() => {
    if (disabled) return "Podpis nie je dostupný.";
    if (!signature) return "Nakreslite podpis myšou alebo prstom.";
    const points = totalPoints(signature);
    return points < 20 ? "Pokračujte v podpise." : "Podpis je pripravený.";
  }, [disabled, signature]);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = typeof window !== "undefined" ? window.devicePixelRatio ?? 1 : 1;
    const nextWidth = Math.max(1, Math.round(rect.width * ratio));
    const nextHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== nextWidth) canvas.width = nextWidth;
    if (canvas.height !== nextHeight) canvas.height = nextHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (signature) drawSignature(ctx, signature, canvas.width, canvas.height);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    resizeCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, signature]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(canvas);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPoint = (event: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = clamp01((event.clientX - rect.left) / rect.width);
    const y = clamp01((event.clientY - rect.top) / rect.height);
    activeStrokeRef.current.push([x, y]);
  };

  const commitStroke = () => {
    const stroke = activeStrokeRef.current;
    activeStrokeRef.current = [];
    if (stroke.length < 2) return;

    const next: SignaturePayloadV1 = signature
      ? { ...signature, strokes: [...signature.strokes, stroke] }
      : { version: 1, strokes: [stroke] };

    if (totalPoints(next) > 5000) return;
    onChange(next);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    setHasPointer(true);
    drawingRef.current = true;
    activeStrokeRef.current = [];
    e.currentTarget.setPointerCapture(e.pointerId);
    addPoint(e.nativeEvent);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    if (!drawingRef.current) return;
    addPoint(e.nativeEvent);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const stroke = activeStrokeRef.current;
    if (stroke.length < 2) return;
    const [a, b] = [stroke[stroke.length - 2], stroke[stroke.length - 1]];
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(a[0] * canvas.width, a[1] * canvas.height);
    ctx.lineTo(b[0] * canvas.width, b[1] * canvas.height);
    ctx.stroke();
  };

  const onPointerUp = () => {
    if (disabled) return;
    if (!drawingRef.current) return;
    drawingRef.current = false;
    commitStroke();
  };

  const clear = () => {
    onChange(null);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-foreground">Podpis</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !canClear}
          onClick={clear}
        >
          Vymazať
        </Button>
      </div>
      <div className="rounded-2xl border border-border bg-background">
        <canvas
          ref={canvasRef}
          className={`w-full touch-none ${disabled ? "opacity-60" : ""}`}
          style={{ height }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {hint}
        {!hasPointer && !disabled ? " (Tip: na mobile použite prst.)" : null}
      </p>
    </div>
  );
}
