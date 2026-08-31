import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Video background */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center section-padding">
        {/* Glitch / stylish headline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.h1
            className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[9rem] font-light tracking-[0.08em] sm:tracking-[0.15em] text-white leading-tight px-2"
            style={{
              textShadow: "0 0 40px rgba(255,255,255,0.15), 0 4px 30px rgba(0,0,0,0.5)",
            }}
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1.1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="block sm:inline">Check the</span>{" "}
            <span className="block sm:inline" style={{ fontFamily: "'Pacifico', cursive", letterSpacing: '0.02em', paddingBottom: '0.15em' }}>Drip</span>
          </motion.h1>
        </motion.div>

        <motion.div
          className="h-px w-20 bg-white/40 my-8"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
        />

        <motion.p
          className="font-body text-[10px] md:text-xs tracking-[0.5em] uppercase text-white/70"
          style={{ textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3, ease: "easeOut" }}
        >
          TDEV — Global Collection
        </motion.p>

        <motion.div
          className="mt-14"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6, ease: "easeOut" }}
        >
          <a
            href="#collections"
            className="group inline-flex items-center gap-3 border border-white/30 text-white px-12 py-4 text-[10px] tracking-[0.4em] uppercase font-body transition-all duration-500 hover:border-neon hover:text-neon hover:shadow-[var(--neon-glow-strong)] hover:bg-white/5 backdrop-blur-sm"
          >
            Explore
            <ChevronDown size={14} className="transition-transform duration-300 group-hover:translate-y-0.5" />
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
      >
        <motion.div
          className="w-5 h-8 border border-white/25 rounded-full flex justify-center pt-1.5"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-1.5 bg-white/50 rounded-full"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
