import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { checkAndAwardCoupon, getGameImages } from "@/lib/gameCoupons";
import GameRewardBanner from "./GameRewardBanner";
import { RefreshCw, Image } from "lucide-react";

const GRID = 4;
const TOTAL = GRID * GRID;

interface Piece {
  id: number;
  currentPos: number;
  correctPos: number;
}

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
];

const JigsawPuzzle = () => {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [reward, setReward] = useState<{ code: string; discount: number } | null>(null);
  const [images, setImages] = useState<string[]>(DEFAULT_IMAGES);

  useEffect(() => {
    getGameImages().then(({ jigsawImages }) => {
      if (jigsawImages.length > 0) setImages(jigsawImages);
    });
  }, []);

  const imgSrc = images[imageIndex % images.length];

  const shuffle = useCallback(() => {
    const arr = Array.from({ length: TOTAL }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setPieces(arr.map((correctPos, currentPos) => ({ id: currentPos, currentPos, correctPos })));
    setMoves(0);
    setSolved(false);
    setSelected(null);
    setReward(null);
  }, []);

  useEffect(() => { shuffle(); }, [shuffle]);

  useEffect(() => {
    if (pieces.length > 0 && pieces.every((p) => p.currentPos === p.correctPos)) {
      setSolved(true);
      checkAndAwardCoupon("jigsaw", moves).then((r) => {
        if (r) setReward(r);
      });
    }
  }, [pieces]);

  const handleClick = (clickedPos: number) => {
    if (solved) return;
    if (selected === null) {
      setSelected(clickedPos);
    } else {
      setPieces((prev) => {
        const next = [...prev];
        const a = next.find((p) => p.currentPos === selected)!;
        const b = next.find((p) => p.currentPos === clickedPos)!;
        [a.currentPos, b.currentPos] = [b.currentPos, a.currentPos];
        return next;
      });
      setMoves((m) => m + 1);
      setSelected(null);
    }
  };

  const pieceSize = 100 / GRID;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <div className="px-4 py-2 rounded-full bg-secondary/80 border border-border">
          <span className="font-body text-sm text-muted-foreground">Moves: <span className="text-accent font-semibold">{moves}</span></span>
        </div>
        <Button size="sm" variant="outline" onClick={shuffle} className="gap-2 rounded-full">
          <RefreshCw size={14} /> Shuffle
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setImageIndex((i) => i + 1); shuffle(); }} className="gap-2 rounded-full">
          <Image size={14} /> New Image
        </Button>
      </div>

      {solved && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-accent font-display text-xl">
          🎉 Solved in {moves} moves!
        </motion.div>
      )}

      <GameRewardBanner reward={reward} />

      <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] rounded-2xl overflow-hidden bg-card shadow-[0_0_40px_hsl(var(--accent)/0.08)] border border-border/50">
        {pieces.map((piece) => {
          const row = Math.floor(piece.currentPos / GRID);
          const col = piece.currentPos % GRID;
          const srcRow = Math.floor(piece.correctPos / GRID);
          const srcCol = piece.correctPos % GRID;

          return (
            <motion.div
              key={piece.id}
              layout
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={() => handleClick(piece.currentPos)}
              className={`absolute cursor-pointer border border-background/20 transition-shadow ${
                selected === piece.currentPos
                  ? "ring-2 ring-accent z-10 shadow-[0_0_20px_hsl(var(--accent)/0.4)]"
                  : "hover:brightness-110"
              }`}
              style={{
                width: `${pieceSize}%`,
                height: `${pieceSize}%`,
                top: `${row * pieceSize}%`,
                left: `${col * pieceSize}%`,
                backgroundImage: `url(${imgSrc})`,
                backgroundSize: `${GRID * 100}% ${GRID * 100}%`,
                backgroundPosition: `${(srcCol / (GRID - 1)) * 100}% ${(srcRow / (GRID - 1)) * 100}%`,
              }}
            />
          );
        })}
      </div>

      <div className="text-center space-y-1">
        <p className="font-body text-xs text-muted-foreground max-w-sm">
          Click two pieces to swap them. Arrange all pieces to complete the image.
        </p>
        <p className="font-body text-[10px] text-accent/60">
          ✦ Solve in under 20 moves to earn a 15% discount coupon
        </p>
      </div>
    </div>
  );
};

export default JigsawPuzzle;
