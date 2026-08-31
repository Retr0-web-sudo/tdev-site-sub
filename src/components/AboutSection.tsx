import { motion } from "framer-motion";
import tdevCottonBoll from "@/assets/tdev-cotton-boll.jpg";

const AboutSection = () => {
  return (
    <section id="about" className="py-16 sm:py-24 md:py-36 relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={tdevCottonBoll} 
          alt="" 
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary via-secondary/95 to-secondary" />
      </div>
      
      {/* Decorative accent line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 sm:h-16 bg-gradient-to-b from-transparent to-accent/30 z-10" />
      
      <div className="section-padding max-w-3xl mx-auto text-center px-4 sm:px-6 relative z-10">
        <motion.p
          className="text-[10px] tracking-[0.5em] uppercase text-accent font-body mb-4"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          Our Philosophy
        </motion.p>
        <motion.h2
          className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-light text-foreground mb-8 sm:mb-10 leading-[1.15]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        >
          Rooted in Nature,
          <br />
          <span className="italic">Refined by Design</span>
        </motion.h2>

        <motion.div
          className="w-12 h-px bg-accent/40 mx-auto mb-10"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        />

        <motion.p
          className="font-body text-sm md:text-base text-muted-foreground leading-[1.9] max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
        >
          TDEV is a celebration of natural materials and timeless craftsmanship.
          Each piece in our collection is thoughtfully designed to bridge the gap
          between sustainable fashion and modern elegance — from field to fabric,
          from concept to closet.
        </motion.p>

        <motion.div
          className="mt-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          <a
            href="#contact"
            className="inline-block border border-foreground/20 text-foreground px-12 py-3.5 text-[10px] tracking-[0.35em] uppercase font-body hover:bg-foreground hover:text-primary-foreground transition-all duration-500"
          >
            Our Philosophy
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;