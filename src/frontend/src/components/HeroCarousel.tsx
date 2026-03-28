import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const SLIDES = [
  {
    src: "/assets/generated/carousel-banner.dim_800x500.jpg",
    label: "Task Delivery",
  },
  {
    src: "/assets/generated/carousel-grocery.dim_800x500.jpg",
    label: "Grocery Pickup",
  },
  {
    src: "/assets/generated/carousel-courier.dim_800x500.jpg",
    label: "Courier Delivery",
  },
  {
    src: "/assets/generated/carousel-homehelp.dim_800x500.jpg",
    label: "Home Help",
  },
];

const AUTOPLAY_INTERVAL = 1800;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (next: number, dir: number) => {
    setDirection(dir);
    setIndex(next);
  };

  const advance = useCallback(() => {
    setDirection(1);
    setIndex((i) => (i + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(advance, AUTOPLAY_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, advance]);

  const handleDragEnd = (_: never, info: { offset: { x: number } }) => {
    if (info.offset.x < -40) {
      goTo((index + 1) % SLIDES.length, 1);
    } else if (info.offset.x > 40) {
      goTo((index - 1 + SLIDES.length) % SLIDES.length, -1);
    }
  };

  return (
    <div
      className="relative rounded-3xl overflow-hidden w-full aspect-[8/5] select-none shadow-[0_0_60px_rgba(0,230,118,0.15)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={{
            enter: (d: number) => ({ opacity: 0, x: d * 30 }),
            center: { opacity: 1, x: 0 },
            exit: (d: number) => ({ opacity: 0, x: d * -30 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.55, ease: "easeInOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <img
            src={SLIDES[index].src}
            alt={SLIDES[index].label}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />

          {/* Glossy overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          {/* Label pill */}
          <div className="absolute bottom-10 left-4">
            <span className="bg-black/50 backdrop-blur border border-white/10 text-white text-xs rounded-full px-3 py-1">
              {SLIDES[index].label}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.label}
            type="button"
            onClick={() => goTo(i, i > index ? 1 : -1)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === index ? 20 : 6,
              height: 6,
              backgroundColor:
                i === index ? "#00E676" : "rgba(255,255,255,0.3)",
            }}
            data-ocid="hero.toggle"
            aria-label={slide.label}
          />
        ))}
      </div>
    </div>
  );
}
