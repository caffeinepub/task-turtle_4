import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const img1 = "/assets/generated/carousel-banner.dim_800x500.jpg";
const img2 = "/assets/generated/carousel-grocery.dim_800x500.jpg";
const img3 = "/assets/generated/carousel-courier.dim_800x500.jpg";
const img4 = "/assets/generated/carousel-homehelp.dim_800x500.jpg";

const images = [img1, img2, img3, img4];

const labels = [
  "Task Delivery",
  "Grocery Pickup",
  "Courier Delivery",
  "Home Help",
];

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance every 1.8 seconds, clear on unmount
  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 1800);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  const goTo = (i: number) => {
    setDirection(i > currentIndex ? 1 : -1);
    setCurrentIndex(i);
  };

  return (
    <div
      className="relative rounded-3xl overflow-hidden w-full aspect-[8/5] select-none shadow-[0_0_60px_rgba(0,230,118,0.15)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        {images.map((src, i) =>
          i === currentIndex ? (
            <motion.div
              key={src}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 40 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: d * -40 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {/* Full-width image */}
              <img
                src={src}
                alt={labels[i]}
                className="w-full h-full object-cover"
                draggable={false}
              />

              {/* Glossy overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

              {/* Label */}
              <div className="absolute bottom-10 left-4">
                <span className="bg-black/50 backdrop-blur border border-white/10 text-white text-xs rounded-full px-3 py-1">
                  {labels[i]}
                </span>
              </div>
            </motion.div>
          ) : null,
        )}
      </AnimatePresence>

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => goTo(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === currentIndex ? 20 : 6,
              height: 6,
              backgroundColor:
                i === currentIndex ? "#00E676" : "rgba(255,255,255,0.3)",
            }}
            aria-label={labels[i]}
          />
        ))}
      </div>
    </div>
  );
}
