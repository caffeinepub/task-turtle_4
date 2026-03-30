import { useEffect, useState } from "react";

// Import images as modules so build pipeline always includes them
import imgBanner from "/assets/generated/carousel-banner.dim_800x500.jpg";
import imgCourier from "/assets/generated/carousel-courier.dim_800x500.jpg";
import imgGrocery from "/assets/generated/carousel-grocery.dim_800x500.jpg";
import imgHomehelp from "/assets/generated/carousel-homehelp.dim_800x500.jpg";

const slides = [
  { src: imgBanner, label: "Task Delivery" },
  { src: imgGrocery, label: "Grocery Pickup" },
  { src: imgCourier, label: "Courier Delivery" },
  { src: imgHomehelp, label: "Home Help" },
];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 1800);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      className="relative rounded-3xl overflow-hidden w-full select-none shadow-[0_0_60px_rgba(0,230,118,0.15)]"
      style={{ aspectRatio: "8/5" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* All images stacked; only current is visible */}
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: i === current ? 1 : 0,
            zIndex: i === current ? 1 : 0,
          }}
        >
          <img
            src={slide.src}
            alt={slide.label}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Glossy overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          {/* Label */}
          <div className="absolute bottom-10 left-4" style={{ zIndex: 2 }}>
            <span className="bg-black/50 backdrop-blur border border-white/10 text-white text-xs rounded-full px-3 py-1">
              {slide.label}
            </span>
          </div>
        </div>
      ))}

      {/* Dot indicators */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5"
        style={{ zIndex: 10 }}
      >
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? 20 : 6,
              height: 6,
              backgroundColor:
                i === current ? "#00E676" : "rgba(255,255,255,0.3)",
            }}
            aria-label={slide.label}
          />
        ))}
      </div>
    </div>
  );
}
