import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Puzzle, Grid3X3, Route, Layers } from "lucide-react";
import { motion } from "framer-motion";
import JigsawPuzzle from "@/components/games/JigsawPuzzle";
import SlidingPuzzle from "@/components/games/SlidingPuzzle";
import MazeGame from "@/components/games/MazeGame";
import MemoryGame from "@/components/games/MemoryGame";
import { supabase } from "@/integrations/supabase/client";

interface GameRule {
  maxScore: number;
  discount: number;
  label: string;
}

const DEFAULT_TIERS = [
  { game: "Memory", target: "< 12 moves", reward: "20% off", icon: "🃏" },
  { game: "Jigsaw", target: "< 20 moves", reward: "15% off", icon: "🧩" },
  { game: "Slider", target: "< 40 moves", reward: "10% off", icon: "⬜" },
  { game: "Maze", target: "< 35 steps", reward: "10% off", icon: "🏁" },
];

const Games = () => {
  const [tiers, setTiers] = useState(DEFAULT_TIERS);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "game_settings")
      .single()
      .then(({ data }) => {
        if (data?.value && (data.value as any).rules) {
          const r = (data.value as any).rules as Record<string, GameRule>;
          const scoreLabels: Record<string, string> = {
            memory: "moves", jigsaw: "moves", sliding: "moves", maze: "steps",
          };
          const icons: Record<string, string> = {
            memory: "🃏", jigsaw: "🧩", sliding: "⬜", maze: "🏁",
          };
          setTiers(
            Object.entries(r).map(([key, rule]) => ({
              game: rule.label,
              target: `< ${rule.maxScore} ${scoreLabels[key] || "moves"}`,
              reward: `${rule.discount}% off`,
              icon: icons[key] || "🎮",
            }))
          );
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      <Navbar />

      <div className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-body text-xs tracking-[0.3em] uppercase text-accent mb-3">
              Play · Win · Save
            </p>
            <h1 className="font-display text-4xl sm:text-6xl font-light tracking-wider mb-4">
              Arcade
            </h1>
            <p className="font-body text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Challenge yourself with our mini games. Beat the target score to unlock exclusive discount codes for your next purchase.
            </p>
          </motion.div>

          <Tabs defaultValue="memory" className="w-full">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-4 mb-10 h-12 bg-secondary/50 rounded-full p-1">
              <TabsTrigger value="memory" className="gap-2 font-body text-xs sm:text-sm rounded-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Layers size={15} /> Memory
              </TabsTrigger>
              <TabsTrigger value="jigsaw" className="gap-2 font-body text-xs sm:text-sm rounded-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Puzzle size={15} /> Jigsaw
              </TabsTrigger>
              <TabsTrigger value="sliding" className="gap-2 font-body text-xs sm:text-sm rounded-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Grid3X3 size={15} /> Slider
              </TabsTrigger>
              <TabsTrigger value="maze" className="gap-2 font-body text-xs sm:text-sm rounded-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Route size={15} /> Maze
              </TabsTrigger>
            </TabsList>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <TabsContent value="memory">
                <MemoryGame />
              </TabsContent>
              <TabsContent value="jigsaw">
                <JigsawPuzzle />
              </TabsContent>
              <TabsContent value="sliding">
                <SlidingPuzzle />
              </TabsContent>
              <TabsContent value="maze">
                <MazeGame />
              </TabsContent>
            </motion.div>
          </Tabs>

          <motion.div
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {tiers.map((tier) => (
              <div
                key={tier.game}
                className="text-center p-4 rounded-xl border border-border/50 bg-gradient-to-b from-card to-secondary/30"
              >
                <span className="text-2xl mb-2 block">{tier.icon}</span>
                <p className="font-display text-sm text-foreground">{tier.game}</p>
                <p className="font-body text-[10px] text-muted-foreground mt-1">{tier.target}</p>
                <p className="font-body text-xs text-accent font-semibold mt-1">{tier.reward}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Games;
