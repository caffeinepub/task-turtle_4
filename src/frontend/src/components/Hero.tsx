import { motion } from "motion/react";
import { HeroCarousel } from "./HeroCarousel";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border"
              style={{
                backgroundColor: "rgba(0,230,118,0.08)",
                borderColor: "rgba(0,230,118,0.25)",
                color: "#00E676",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "#00E676" }}
              />
              Now available in 20+ cities
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-white mb-6">
              <span style={{ color: "#00E676" }}>Any Task.</span>
              <br />
              <span className="text-white">Any Place.</span>
              <br />
              <span style={{ color: "#00E676" }}>By Nearby People.</span>
            </h1>

            <p className="text-[#A7ADB3] text-lg leading-relaxed mb-10 max-w-[480px]">
              Connect with trusted local helpers for anything you need — fast,
              safe, and affordable.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="px-8 py-3.5 rounded-full text-sm font-bold transition-all duration-200 hover:shadow-[0_0_30px_rgba(0,230,118,0.45)] active:scale-95"
                style={{ backgroundColor: "#00E676", color: "#050505" }}
                data-ocid="hero.primary_button"
              >
                Get Started Free
              </button>
              <a
                href="#how-it-works"
                className="text-sm font-semibold transition-colors duration-200 hover:opacity-80"
                style={{ color: "#00E676" }}
                data-ocid="hero.link"
              >
                Become a Tasker →
              </a>
            </div>

            <div className="flex gap-8 mt-12 pt-8 border-t border-white/10">
              {[
                { value: "50K+", label: "Tasks Completed" },
                { value: "12K+", label: "Verified Taskers" },
                { value: "4.9★", label: "Avg. Rating" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-[#A7ADB3] mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
            className="relative"
          >
            <HeroCarousel />

            <motion.div
              className="absolute -top-4 -right-4 rounded-2xl px-4 py-3 border backdrop-blur-md hidden lg:block"
              style={{
                background: "rgba(14,18,20,0.9)",
                borderColor: "rgba(0,230,118,0.2)",
              }}
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <div className="text-xs text-[#A7ADB3]">New task posted</div>
              <div className="text-sm font-semibold text-white mt-0.5">
                AC Repair · ₹800
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-4 -left-4 rounded-2xl px-4 py-3 border backdrop-blur-md hidden lg:block"
              style={{
                background: "rgba(14,18,20,0.9)",
                borderColor: "rgba(0,230,118,0.2)",
              }}
              animate={{ y: [0, 6, 0] }}
              transition={{
                duration: 3.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: "rgba(0,230,118,0.15)" }}
                >
                  ⭐
                </div>
                <div>
                  <div className="text-xs text-[#A7ADB3]">Task completed!</div>
                  <div className="text-xs font-semibold text-white">
                    Rated 5 stars
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
