import { motion } from "framer-motion";
import { Gift, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GameRewardBannerProps {
  reward: { code: string; discount: number } | null;
}

const GameRewardBanner = ({ reward }: GameRewardBannerProps) => {
  if (!reward) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(reward.code);
    toast.success("Code copied to clipboard!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full max-w-sm rounded-xl border border-accent/40 bg-gradient-to-br from-accent/10 via-card to-accent/5 p-5 shadow-[0_0_30px_hsl(var(--accent)/0.15)]"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-accent/20">
          <Gift size={18} className="text-accent" />
        </div>
        <div>
          <p className="font-display text-sm text-foreground">Reward Unlocked!</p>
          <p className="font-body text-xs text-muted-foreground">{reward.discount}% off your next order</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2 rounded-md bg-background/60 border border-border font-mono text-sm text-accent tracking-wider text-center">
          {reward.code}
        </div>
        <Button size="sm" variant="outline" onClick={copyCode} className="shrink-0">
          <Copy size={14} />
        </Button>
      </div>
      <p className="font-body text-[10px] text-muted-foreground mt-2 text-center">
        Valid for 7 days · Use at checkout
      </p>
    </motion.div>
  );
};

export default GameRewardBanner;
