import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { checkAndAwardCoupon } from "@/lib/gameCoupons";
import GameRewardBanner from "./GameRewardBanner";
import { RefreshCw } from "lucide-react";

const SIZE = 4;
const TOTAL = SIZE * SIZE;

const SlidingPuzzle = () => {
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [reward, setReward] = useState<{ code: string; discount: number } | null>(null);

  const goal = Array.from({ length: TOTAL }, (_, i) => (i + 1) % TOTAL);

  const isSolvable = (arr: number[]) => {
    let inversions = 0;
    const filtered = arr.filter((v) => v !== 0);
    for (let i = 0; i < filtered.length; i++) {
      for (let j = i + 1; j < filtered.length; j++) {
        if (filtered[i] > filtered[j]) inversions++;
      }
    }
    const blankRow = Math.floor(arr.indexOf(0) / SIZE);
    return SIZE % 2 === 0 ? (inversions + blankRow) % 2 === 1 : inversions % 2 === 0;
  };

  const shuffle = useCallback(() => {
    let arr: number[];
    do {
      arr = Array.from({ length: TOTAL }, (_, i) => i);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    } while (!isSolvable(arr) || JSON.stringify(arr) === JSON.stringify(goal));
    setTiles(arr);
    setMoves(0);
    setSolved(false);
    setReward(null);
  }, []);

  useEffect(() => { shuffle(); }, [shuffle]);

  useEffect(() => {
    if (tiles.length > 0 && JSON.stringify(tiles) === JSON.stringify(goal)) {
      setSolved(true);
      checkAndAwardCoupon("sliding", moves).then((r) => {
        if (r) setReward(r);
      });
    }
  }, [tiles]);

  const handleClick = (index: number) => {
    if (solved) return;
    const blank = tiles.indexOf(0);
    const bRow = Math.floor(blank / SIZE);
    const bCol = blank % SIZE;
    const tRow = Math.floor(index / SIZE);
    const tCol = index % SIZE;

    if ((Math.abs(bRow - tRow) === 1 && bCol === tCol) || (Math.abs(bCol - tCol) === 1 && bRow === tRow)) {
      const next = [...tiles];
      [next[blank], next[index]] = [next[index], next[blank]];
      setTiles(next);
      setMoves((m) => m + 1);
    }
  };

  const tileSize = 100 / SIZE;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 rounded-full bg-secondary/80 border border-border">
          <span className="font-body text-sm text-muted-foreground">Moves: <span className="text-accent font-semibold">{moves}</span></span>
        </div>
        <Button size="sm" variant="outline" onClick={shuffle} className="gap-2 rounded-full">
          <RefreshCw size={14} /> Shuffle
        </Button>
      </div>

      {solved && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-accent font-display text-xl">
          🎉 Solved in {moves} moves!
        </motion.div>
      )}

      <GameRewardBanner reward={reward} />

      <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] rounded-2xl overflow-hidden bg-card shadow-[0_0_40px_hsl(var(--accent)/0.08)] border border-border/50">
        {tiles.map((tile, index) => {
          if (tile === 0) return null;
          const row = Math.floor(index / SIZE);
          const col = index % SIZE;

          return (
            <motion.div
              key={tile}
              layout
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={() => handleClick(index)}
              className="absolute cursor-pointer flex items-center justify-center rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/20 hover:border-accent/40 hover:shadow-[0_0_15px_hsl(var(--accent)/0.2)] transition-all"
              style={{
                width: `calc(${tileSize}% - 4px)`,
                height: `calc(${tileSize}% - 4px)`,
                top: `calc(${row * tileSize}% + 2px)`,
                left: `calc(${col * tileSize}% + 2px)`,
              }}
            >
              <span className="font-display text-xl sm:text-2xl text-foreground">{tile}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center space-y-1">
        <p className="font-body text-xs text-muted-foreground max-w-sm">
          Slide tiles into the blank space. Arrange 1–15 in order.
        </p>
        <p className="font-body text-[10px] text-accent/60">
          ✦ Solve in under 40 moves to earn a 10% discount coupon
        </p>
      </div>
    </div>
  );
};

export default SlidingPuzzle;
