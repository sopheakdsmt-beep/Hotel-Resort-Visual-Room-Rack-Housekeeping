import { useEffect, useRef, type PointerEvent } from "react";

type SignaturePadProps = {
  onChange: (dataUrl: string | null) => void;
};

export function SignaturePad({ onChange }: SignaturePadProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineWidth = 2.4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#241e18";
  }, []);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;
    const next = point(event);
    context.beginPath();
    context.moveTo(next.x, next.y);
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const context = ref.current?.getContext("2d");
    if (!context) return;
    const next = point(event);
    context.lineTo(next.x, next.y);
    context.stroke();
    hasInk.current = true;
  }

  function finish() {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(hasInk.current && ref.current ? ref.current.toDataURL("image/png") : null);
  }

  function clear() {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    hasInk.current = false;
    onChange(null);
  }

  return (
    <div className="sign-wrap">
      <canvas
        ref={ref}
        className="sign"
        aria-label="Guest signature"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
      />
      <button type="button" className="btn btn-line" onClick={clear}>
        Clear signature · សម្អាតហត្ថលេខា
      </button>
    </div>
  );
}
