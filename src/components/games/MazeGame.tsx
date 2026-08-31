import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { checkAndAwardCoupon } from "@/lib/gameCoupons";
import GameRewardBanner from "./GameRewardBanner";
import { RefreshCw } from "lucide-react";

const ROWS = 15;
const COLS = 15;

type Cell = { top: boolean; right: boolean; bottom: boolean; left: boolean; visited: boolean };

const generateMaze = (): Cell[][] => {
  const grid: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ top: true, right: true, bottom: true, left: true, visited: false }))
  );
  const stack: [number, number][] = [];
  grid[0][0].visited = true;
  stack.push([0, 0]);

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const neighbors: [number, number, string, string][] = [];
    if (r > 0 && !grid[r - 1][c].visited) neighbors.push([r - 1, c, "top", "bottom"]);
    if (r < ROWS - 1 && !grid[r + 1][c].visited) neighbors.push([r + 1, c, "bottom", "top"]);
    if (c > 0 && !grid[r][c - 1].visited) neighbors.push([r, c - 1, "left", "right"]);
    if (c < COLS - 1 && !grid[r][c + 1].visited) neighbors.push([r, c + 1, "right", "left"]);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const [nr, nc, wall, opposite] = neighbors[Math.floor(Math.random() * neighbors.length)];
      (grid[r][c] as any)[wall] = false;
      (grid[nr][nc] as any)[opposite] = false;
      grid[nr][nc].visited = true;
      stack.push([nr, nc]);
    }
  }
  return grid;
};

const MazeGame = () => {
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [pos, setPos] = useState<[number, number]>([0, 0]);
  const [trail, setTrail] = useState<Set<string>>(new Set(["0-0"]));
  const [won, setWon] = useState(false);
  const [steps, setSteps] = useState(0);
  const [reward, setReward] = useState<{ code: string; discount: number } | null>(null);

  const newMaze = useCallback(() => {
    setMaze(generateMaze());
    setPos([0, 0]);
    setTrail(new Set(["0-0"]));
    setWon(false);
    setSteps(0);
    setReward(null);
  }, []);

  useEffect(() => { newMaze(); }, [newMaze]);

  const move = useCallback((dr: number, dc: number) => {
    if (won) return;
    setPos(([r, c]) => {
      const cell = maze[r]?.[c];
      if (!cell) return [r, c];
      if (dr === -1 && cell.top) return [r, c];
      if (dr === 1 && cell.bottom) return [r, c];
      if (dc === -1 && cell.left) return [r, c];
      if (dc === 1 && cell.right) return [r, c];

      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return [r, c];

      setSteps((s) => s + 1);
      setTrail((prev) => new Set(prev).add(`${nr}-${nc}`));
      if (nr === ROWS - 1 && nc === COLS - 1) {
        setWon(true);
        checkAndAwardCoupon("maze", steps + 1).then((r) => {
          if (r) setReward(r);
        });
      }
      return [nr, nc] as [number, number];
    });
  }, [maze, won, steps]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": case "w": e.preventDefault(); move(-1, 0); break;
        case "ArrowDown": case "s": e.preventDefault(); move(1, 0); break;
        case "ArrowLeft": case "a": e.preventDefault(); move(0, -1); break;
        case "ArrowRight": case "d": e.preventDefault(); move(0, 1); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  const cellSize = 100 / COLS;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 rounded-full bg-secondary/80 border border-border">
          <span className="font-body text-sm text-muted-foreground">Steps: <span className="text-accent font-semibold">{steps}</span></span>
        </div>
        <Button size="sm" variant="outline" onClick={newMaze} className="gap-2 rounded-full">
          <RefreshCw size={14} /> New Maze
        </Button>
      </div>

      {won && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-accent font-display text-xl">
          🎉 Escaped in {steps} steps!
        </motion.div>
      )}

      <GameRewardBanner reward={reward} />

      <div
        className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] rounded-2xl overflow-hidden bg-card shadow-[0_0_40px_hsl(var(--accent)/0.08)] border border-border/50"
        tabIndex={0}
      >
        {maze.map((row, r) =>
          row.map((cell, c) => {
            const isTrail = trail.has(`${r}-${c}`);
            return (
              <div
                key={`${r}-${c}`}
                className="absolute"
                style={{
                  width: `${cellSize}%`,
                  height: `${cellSize}%`,
                  top: `${r * cellSize}%`,
                  left: `${c * cellSize}%`,
                  borderTop: cell.top ? "1px solid hsl(var(--border))" : "none",
                  borderRight: cell.right ? "1px solid hsl(var(--border))" : "none",
                  borderBottom: cell.bottom ? "1px solid hsl(var(--border))" : "none",
                  borderLeft: cell.left ? "1px solid hsl(var(--border))" : "none",
                  backgroundColor: isTrail ? "hsl(var(--accent) / 0.06)" : "transparent",
                }}
              >
                {r === 0 && c === 0 && (
                  <div className="w-full h-full flex items-center justify-center text-[7px] sm:text-[9px] font-body font-semibold text-accent/80 tracking-wider">
                    START
                  </div>
                )}
                {r === ROWS - 1 && c === COLS - 1 && (
                  <div className="w-full h-full flex items-center justify-center text-[7px] sm:text-[9px] font-body font-semibold text-accent/80 tracking-wider">
                    END
                  </div>
                )}
              </div>
            );
          })
        )}
        <motion.div
          className="absolute rounded-full bg-accent shadow-[0_0_12px_hsl(var(--accent)/0.5)]"
          animate={{
            top: `${pos[0] * cellSize + cellSize / 2}%`,
            left: `${pos[1] * cellSize + cellSize / 2}%`,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{
            width: `${cellSize * 0.6}%`,
            height: `${cellSize * 0.6}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Mobile controls */}
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        <div />
        <Button size="sm" variant="outline" onClick={() => move(-1, 0)} className="rounded-full">↑</Button>
        <div />
        <Button size="sm" variant="outline" onClick={() => move(0, -1)} className="rounded-full">←</Button>
        <Button size="sm" variant="outline" onClick={() => move(1, 0)} className="rounded-full">↓</Button>
        <Button size="sm" variant="outline" onClick={() => move(0, 1)} className="rounded-full">→</Button>
      </div>

      <div className="text-center space-y-1">
        <p className="font-body text-xs text-muted-foreground max-w-sm">
          Use arrow keys or WASD to navigate. Reach the END to escape.
        </p>
        <p className="font-body text-[10px] text-accent/60">
          ✦ Escape in under 35 steps to earn a 10% discount coupon
        </p>
      </div>
    </div>
  );
};

export default MazeGame;
