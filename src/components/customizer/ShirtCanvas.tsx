import { useRef, useState, useEffect, useCallback } from "react";
import { Paintbrush, Type, Eraser, RotateCcw, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShirtCanvasProps {
  shirtColor: string;
  onCanvasRef: (canvas: HTMLCanvasElement | null) => void;
}

type Tool = "brush" | "eraser" | "text";

const BRUSH_SIZES = [2, 5, 10, 20];
const COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#FF6B00", "#FFD700",
  "#00C853", "#2979FF", "#7C4DFF", "#E91E63", "#795548",
];

const ShirtCanvas = ({ shirtColor, onCanvasRef }: ShirtCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Arial");
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 400;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "transparent";
      ctx.clearRect(0, 0, 400, 500);
    }
    onCanvasRef(canvas);
  }, [onCanvasRef]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (tool === "text") {
      if (!textInput.trim()) return;
      const pos = getPos(e);
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.fillText(textInput, pos.x, pos.y);
      return;
    }
    setIsDrawing(true);
    lastPos.current = getPos(e);
  }, [tool, textInput, fontSize, fontFamily, color, getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !lastPos.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? "rgba(0,0,0,0)" : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.stroke();
    lastPos.current = pos;
  }, [isDrawing, tool, color, brushSize, getPos]);

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.globalCompositeOperation = "source-over";
  }, []);

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-card border border-border rounded-lg">
        <Button
          size="sm" variant={tool === "brush" ? "default" : "ghost"}
          onClick={() => setTool("brush")}
          className="font-body text-xs"
        >
          <Paintbrush size={14} className="mr-1" /> Brush
        </Button>
        <Button
          size="sm" variant={tool === "eraser" ? "default" : "ghost"}
          onClick={() => setTool("eraser")}
          className="font-body text-xs"
        >
          <Eraser size={14} className="mr-1" /> Eraser
        </Button>
        <Button
          size="sm" variant={tool === "text" ? "default" : "ghost"}
          onClick={() => setTool("text")}
          className="font-body text-xs"
        >
          <Type size={14} className="mr-1" /> Text
        </Button>
        <div className="h-6 w-px bg-border mx-1" />
        <Button size="sm" variant="ghost" onClick={clearCanvas} className="font-body text-xs text-red-400">
          <RotateCcw size={14} className="mr-1" /> Clear
        </Button>
      </div>

      {/* Color & size */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? "border-accent scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          {BRUSH_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setBrushSize(s)}
              className={`flex items-center justify-center w-8 h-8 rounded transition-colors ${brushSize === s ? "bg-accent/20" : "hover:bg-muted"}`}
            >
              <Circle size={s + 4} fill={brushSize === s ? "currentColor" : "none"} className="text-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Text options */}
      {tool === "text" && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-card border border-border rounded-lg">
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type text, then click on shirt..."
            className="flex-1 min-w-[150px] px-3 py-1.5 bg-background border border-border rounded text-sm font-body text-foreground"
          />
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="px-2 py-1.5 bg-background border border-border rounded text-sm font-body text-foreground"
          >
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier</option>
            <option value="Impact">Impact</option>
            <option value="Comic Sans MS">Comic Sans</option>
          </select>
          <input
            type="number" min={10} max={72} value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-16 px-2 py-1.5 bg-background border border-border rounded text-sm font-body text-foreground"
          />
        </div>
      )}

      {/* Canvas area */}
      <div className="relative flex justify-center">
        {/* Shirt silhouette background */}
        <div
          className="relative rounded-lg shadow-lg overflow-hidden"
          style={{ width: 400, maxWidth: "100%" }}
        >
          <svg viewBox="0 0 400 500" className="w-full h-auto" style={{ display: "block" }}>
            {/* Shirt shape */}
            <path
              d="M80 0 L0 80 L60 120 L60 500 L340 500 L340 120 L400 80 L320 0 L260 40 Q200 70 140 40 Z"
              fill={shirtColor}
              stroke="hsl(25, 12%, 20%)"
              strokeWidth="2"
            />
            {/* Collar */}
            <path
              d="M140 40 Q170 65 200 70 Q230 65 260 40"
              fill="none"
              stroke="hsl(25, 12%, 25%)"
              strokeWidth="1.5"
            />
          </svg>
          {/* Canvas overlay positioned on shirt body */}
          <canvas
            ref={canvasRef}
            className="absolute cursor-crosshair"
            style={{
              top: "18%", left: "18%", width: "64%", height: "72%",
              touchAction: "none",
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>
      </div>
    </div>
  );
};

export default ShirtCanvas;
