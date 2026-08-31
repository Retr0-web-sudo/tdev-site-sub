import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { checkAndAwardCoupon, getGameImages } from "@/lib/gameCoupons";
import GameRewardBanner from "./GameRewardBanner";

interface Card {
  id: number;
  emoji: string;
  image?: string;
  flipped: boolean;
  matched: boolean;
}

const FASHION_EMOJIS = ["👗", "👠", "👜", "💎", "🧵", "✂️", "👒", "🧤"];

const MemoryGame = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [locked, setLocked] = useState(false);
  const [reward, setReward] = useState<{ code: string; discount: number } | null>(null);
  const [customImages, setCustomImages] = useState<string[]>([]);

  useEffect(() => {
    getGameImages().then(({ memoryImages }) => {
      if (memoryImages.length >= 8) setCustomImages(memoryImages.slice(0, 8));
    });
  }, []);

  const shuffle = useCallback(() => {
    const useImages = customImages.length >= 8;
    const items = useImages ? customImages.slice(0, 8) : FASHION_EMOJIS;
    const pairs = [...items, ...items];
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    setCards(
      pairs.map((item, i) =>
        useImages
          ? { id: i, emoji: "", image: item, flipped: false, matched: false }
          : { id: i, emoji: item, flipped: false, matched: false }
      )
    );
    setFlippedIds([]);
    setMoves(0);
    setWon(false);
    setLocked(false);
    setReward(null);
  }, [customImages]);

  useEffect(() => { shuffle(); }, [shuffle]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched)) {
      setWon(true);
      checkAndAwardCoupon("memory", moves).then((r) => {
        if (r) setReward(r);
      });
    }
  }, [cards, moves]);

  const handleFlip = (id: number) => {
    if (locked || won) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newFlipped = [...flippedIds, id];
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, flipped: true } : c)));
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [first, second] = newFlipped;
      const c1 = cards.find((c) => c.id === first)!;
      const c2 = cards.find((c) => c.id === second)!;

      const match = c1.image ? c1.image === c2.image : c1.emoji === c2.emoji;
      if (match) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === first || c.id === second ? { ...c, matched: true } : c))
          );
          setFlippedIds([]);
          setLocked(false);
        }, 400);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === first || c.id === second ? { ...c, flipped: false } : c))
          );
          setFlippedIds([]);
          setLocked(false);
        }, 800);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-4">
        <span className="font-body text-sm text-muted-foreground">Moves: {moves}</span>
        <Button size="sm" variant="outline" onClick={shuffle}>Reset</Button>
      </div>

      {won && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-accent font-display text-xl">
          🎉 Matched all in {moves} moves!
        </motion.div>
      )}

      <GameRewardBanner reward={reward} />

      <div className="grid grid-cols-4 gap-2 sm:gap-3 w-[320px] sm:w-[400px]">
        <AnimatePresence>
          {cards.map((card) => (
            <motion.div
              key={card.id}
              layout
              onClick={() => handleFlip(card.id)}
              className={`aspect-square rounded-lg cursor-pointer flex items-center justify-center text-2xl sm:text-3xl transition-all duration-300 border ${
                card.matched
                  ? "bg-accent/20 border-accent/40 shadow-[0_0_15px_hsl(var(--accent)/0.3)]"
                  : card.flipped
                  ? "bg-card border-accent/60 shadow-lg"
                  : "bg-secondary/80 border-border hover:border-accent/30 hover:shadow-md"
              }`}
              whileHover={!card.flipped && !card.matched ? { scale: 1.05 } : {}}
              whileTap={!card.flipped && !card.matched ? { scale: 0.95 } : {}}
            >
              <AnimatePresence mode="wait">
                {card.flipped || card.matched ? (
                  <motion.span
                    key="front"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {card.image ? (
                      <img src={card.image} alt="" className="w-full h-full object-cover rounded-md" />
                    ) : (
                      card.emoji
                    )}
                  </motion.span>
                ) : (
                  <motion.span
                    key="back"
                    initial={{ rotateY: -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-display text-lg text-muted-foreground/30"
                  >
                    ✦
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <p className="font-body text-xs text-muted-foreground max-w-sm text-center">
        Flip two cards to find matching pairs. Match all 8 pairs to win. Under 12 moves earns a coupon!
      </p>
    </div>
  );
};

export default MemoryGame;
