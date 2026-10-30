import { useRef, useState } from "react";

interface Props {
  onChange: (dataUrl: string | null) => void;
}

export function SignaturePad({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  function getContext() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }

  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    // Once a stroke starts, the pointer stays "captured" by the canvas even if the
    // drag moves outside its bounds -- clamp so it draws flush to the edge instead
    // of silently clipping (which made strokes signed near the bottom look cut off).
    const x = Math.min(Math.max((e.clientX - rect.left) * scaleX, 0), canvas.width);
    const y = Math.min(Math.max((e.clientY - rect.top) * scaleY, 0), canvas.height);
    return { x, y };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = getContext();
    if (!ctx) return;
    drawingRef.current = true;
    const { x, y } = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = getContext();
    if (!ctx) return;
    const { x, y } = pointFromEvent(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasSignature) setHasSignature(true);
  }

  // The pad canvas is mostly blank space around the actual strokes -- exporting
  // it as-is means the signature shrinks to near-nothing once scaled down to
  // the small inline size it's shown at in the document. Crop to the drawn
  // area (plus a little padding) so the exported image is just the signature.
  function trimToSignature(canvas: HTMLCanvasElement): string {
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas.toDataURL("image/png");
    const { width, height } = canvas;
    const pixels = ctx.getImageData(0, 0, width, height).data;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (pixels[(y * width + x) * 4 + 3] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) return canvas.toDataURL("image/png");

    const pad = 10;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width, maxX + pad);
    maxY = Math.min(height, maxY + pad);

    const trimmed = document.createElement("canvas");
    trimmed.width = maxX - minX;
    trimmed.height = maxY - minY;
    trimmed.getContext("2d")?.drawImage(canvas, minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
    return trimmed.toDataURL("image/png");
  }

  function finishStroke() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas && hasSignature) onChange(trimToSignature(canvas));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange(null);
  }

  return (
    <div className="signature-pad">
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        className="signature-pad-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerLeave={finishStroke}
      />
      <div className="signature-pad-actions">
        <span className="field-hint">Sign above using your mouse, trackpad, or finger.</span>
        <button type="button" className="btn-secondary-sm" onClick={clear}>
          Clear
        </button>
      </div>
    </div>
  );
}
