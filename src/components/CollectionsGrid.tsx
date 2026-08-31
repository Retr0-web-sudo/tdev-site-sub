import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
// TDEV reference site images
import tdevFemmeHero from "@/assets/tdev-femme-hero.jpg";
import tdevHommeHero from "@/assets/tdev-homme-hero.jpg";
import tdevCottonBoll from "@/assets/tdev-cotton-boll.jpg";

const collections = [
  {
    title: "Femme",
    subtitle: "Spring 2026",
    image: tdevFemmeHero,
    alt: "Femme collection — Spring 2026 womenswear",
    span: "md:col-span-2 md:row-span-2",
    aspectClass: "aspect-[3/4] md:aspect-auto md:h-full",
  },
  {
    title: "Homme",
    subtitle: "Spring 2017",
    image: tdevHommeHero,
    alt: "Homme collection — refined menswear apparel",
    span: "",
    aspectClass: "aspect-square",
  },
  {
    title: "Global",
    subtitle: "Raw Materials",
    image: tdevCottonBoll,
    alt: "Global collection — raw cotton materials",
    span: "",
    aspectClass: "aspect-square",
  },
];

const CollectionsGrid = () => {
  return (
    <section id="collections" className="section-padding py-16 sm:py-24 md:py-36">
      <motion.div
        className="mb-8 sm:mb-14 md:mb-24 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div>
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground font-body mb-2 sm:mb-3">
            Collections
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-6xl font-light text-foreground leading-[1.1]">
            Curated
            <br className="hidden md:block" />
            <span className="italic"> for You</span>
          </h2>
        </div>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-body text-muted-foreground hover:text-foreground transition-colors duration-300 border-b border-border pb-1 self-start sm:self-auto"
        >
          View all
          <ArrowUpRight size={14} />
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:grid-rows-2 gap-3 md:gap-4 md:h-[82vh]">
        {collections.map((item, i) => (
          <motion.div
            key={item.title}
            className={`group relative block ${item.span}`}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: i * 0.12, ease: "easeOut" }}
          >
            <Link to={`/category/${item.title.toLowerCase()}`} className="block w-full h-full overflow-hidden">
              <div className={`relative w-full h-full ${item.aspectClass}`}>
                <img
                  src={item.image}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-white/60 font-body mb-1.5">
                      {item.subtitle}
                    </p>
                    <h3 className="font-display text-2xl md:text-3xl font-light text-white">
                      {item.title}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-0 translate-x-2">
                    <ArrowUpRight size={16} className="text-white" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CollectionsGrid;