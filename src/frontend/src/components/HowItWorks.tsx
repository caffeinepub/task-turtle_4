import { CheckSquare, Star, Users } from "lucide-react";
import { motion } from "motion/react";

const STEPS = [
  {
    icon: CheckSquare,
    title: "Post a Task",
    description:
      "Describe what you need, set your budget and location. Takes less than 2 minutes.",
  },
  {
    icon: Users,
    title: "Match with a Helper",
    description:
      "Get matched with verified nearby Taskers instantly. Compare profiles and reviews.",
  },
  {
    icon: Star,
    title: "Done & Rated",
    description:
      "Task completed, payment released, rate your experience. Quality guaranteed.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Heading */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "#00E676" }}
          >
            Simple Process
          </p>
          <h2 className="text-4xl font-bold text-white">How it Works</h2>
          <p className="text-[#A7ADB3] mt-4 max-w-md mx-auto">
            Getting help has never been this easy. Three simple steps to get
            your task done.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative rounded-2xl p-7 border backdrop-blur-md group hover:shadow-[0_0_40px_rgba(0,230,118,0.12)] transition-all duration-300"
                style={{
                  background: "rgba(0,0,0,0.6)",
                  borderColor: "rgba(0,230,118,0.12)",
                }}
                data-ocid={`how_it_works.card.${i + 1}`}
              >
                {/* Corner glow */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(0,230,118,0.12) 0%, transparent 70%)",
                    transform: "translate(30%, -30%)",
                  }}
                />

                {/* Step number */}
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-2xl mb-5"
                  style={{ backgroundColor: "rgba(0,230,118,0.1)" }}
                >
                  <Icon size={20} style={{ color: "#00E676" }} />
                </div>

                <div
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: "#00E676" }}
                >
                  Step {i + 1}
                </div>

                <h3
                  className="text-xl font-semibold text-white mb-3"
                  style={{ color: "#00E676" }}
                >
                  {step.title}
                </h3>

                <p className="text-[#A7ADB3] text-sm leading-relaxed">
                  {step.description}
                </p>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-1/2 transition-all duration-500 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
