import {
  ArrowRight,
  CheckSquare,
  CreditCard,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";

const GREEN = "#00E676";

const STEPS = [
  {
    icon: CheckSquare,
    title: "Post a Task",
    description:
      "Describe what you need, set your budget and location. Add category, urgency, and any special requirements. Takes less than 2 minutes.",
    detail:
      "Tasks can be anything — grocery runs, plumbing, delivery, tutoring, or any local errand you need help with.",
  },
  {
    icon: Users,
    title: "Get Matched",
    description:
      "Our system instantly matches you with verified nearby Taskers. Compare profiles, ratings, and earnings history.",
    detail:
      "All taskers are identity-verified and rated by previous customers, so you always know who's coming.",
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    description:
      "Pay upfront via Razorpay. Your money is held in escrow — completely safe until the task is verified done.",
    detail:
      "A 5% platform fee is deducted from the tasker's payout. You pay exactly what you see — no hidden charges.",
  },
  {
    icon: Shield,
    title: "OTP Verification",
    description:
      "When the task is complete, the tasker enters your unique 6-digit OTP to confirm delivery. Only you have the code.",
    detail:
      "This ensures no task is marked complete without your explicit approval.",
  },
  {
    icon: Star,
    title: "Rate & Release",
    description:
      "Once OTP is verified, payment is released to the tasker and you can leave a rating and review.",
    detail:
      "Your feedback keeps the platform safe and high-quality for everyone in the community.",
  },
];

export function HowItWorksPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#050505" }}>
      <Navbar />
      <div className="pt-28 pb-24 px-6">
        <div className="max-w-[900px] mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: GREEN }}
            >
              Simple Process
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How Task Turtle Works
            </h1>
            <p className="text-[#A7ADB3] text-lg max-w-xl mx-auto">
              From posting a task to verified completion — here's every step of
              the journey.
            </p>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-6 top-0 bottom-0 w-[2px] hidden md:block"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,230,118,0.5), rgba(0,230,118,0.05))",
              }}
            />

            <div className="flex flex-col gap-8">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.12 }}
                    className="relative md:pl-20"
                  >
                    {/* Circle dot on timeline */}
                    <div
                      className="absolute left-0 top-5 w-12 h-12 rounded-full items-center justify-center hidden md:flex"
                      style={{
                        background: "rgba(0,230,118,0.12)",
                        border: "2px solid rgba(0,230,118,0.4)",
                      }}
                    >
                      <Icon size={18} style={{ color: GREEN }} />
                    </div>

                    <div
                      className="rounded-2xl p-6 border"
                      style={{
                        background: "rgba(14,18,20,0.7)",
                        borderColor: "rgba(255,255,255,0.09)",
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold md:hidden"
                          style={{
                            background: "rgba(0,230,118,0.15)",
                            color: GREEN,
                          }}
                        >
                          {i + 1}
                        </div>
                        <span
                          className="text-xs font-bold uppercase tracking-widest"
                          style={{ color: GREEN }}
                        >
                          Step {i + 1}
                        </span>
                      </div>
                      <h3 className="text-white font-bold text-xl mb-2">
                        {step.title}
                      </h3>
                      <p className="text-[#A7ADB3] text-sm leading-relaxed mb-3">
                        {step.description}
                      </p>
                      <p
                        className="text-[#A7ADB3]/60 text-xs leading-relaxed border-t pt-3"
                        style={{ borderColor: "rgba(255,255,255,0.06)" }}
                      >
                        {step.detail}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.div
            className="text-center mt-14 flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <a
              href="#dashboard"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,230,118,0.4)]"
              style={{ backgroundColor: GREEN, color: "#050505" }}
            >
              Post Your First Task <ArrowRight size={14} />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold border transition-all duration-200 hover:bg-[#00E676]/10"
              style={{ borderColor: GREEN, color: GREEN }}
            >
              See All Features
            </a>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
