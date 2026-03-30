import {
  Bell,
  Clock,
  CreditCard,
  MapPin,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";

const GREEN = "#00E676";

const FEATURES = [
  {
    icon: Zap,
    title: "Surge Pricing",
    description:
      "Dynamic pricing during peak hours ensures taskers earn more and tasks get done faster during high-demand periods.",
  },
  {
    icon: Shield,
    title: "OTP Verification",
    description:
      "Every task completion is secured with a one-time password — only you can mark your task as done.",
  },
  {
    icon: CreditCard,
    title: "Escrow Payments",
    description:
      "Your payment is held safely in escrow and only released once the task is verified complete.",
  },
  {
    icon: MapPin,
    title: "Hyper-Local Matching",
    description:
      "Get matched with verified helpers in your exact neighbourhood — fast, nearby, and reliable.",
  },
  {
    icon: Star,
    title: "Ratings & Reviews",
    description:
      "Every tasker is rated after each job, keeping quality high and building trust across the community.",
  },
  {
    icon: Users,
    title: "Verified Taskers",
    description:
      "All taskers go through identity verification with Aadhar or Student ID before they can accept tasks.",
  },
  {
    icon: Clock,
    title: "Real-Time Tracking",
    description:
      "Follow your task through every stage — Accepted → On the Way → Arrived → OTP → Verified.",
  },
  {
    icon: Bell,
    title: "Instant Notifications",
    description:
      "Get notified the moment a tasker accepts your job, is on the way, or when the task is complete.",
  },
];

export function FeaturesPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000000" }}>
      <Navbar />
      <div className="pt-28 pb-24 px-6">
        <div className="max-w-[1200px] mx-auto">
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
              Platform Features
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything you need to get tasks done
            </h1>
            <p className="text-[#A7ADB3] text-lg max-w-xl mx-auto">
              Task Turtle is built with powerful features that make hiring local
              help safe, fast, and reliable.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="relative rounded-2xl p-6 border backdrop-blur-md group hover:shadow-[0_0_40px_rgba(0,230,118,0.12)] transition-all duration-300"
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    borderColor: "rgba(0,230,118,0.12)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      background: "rgba(0,230,118,0.1)",
                      border: "1px solid rgba(0,230,118,0.2)",
                    }}
                  >
                    <Icon size={20} style={{ color: GREEN }} />
                  </div>
                  <h3 className="text-white font-semibold text-base mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-[#A7ADB3] text-sm leading-relaxed">
                    {feat.description}
                  </p>
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-1/2 transition-all duration-500 rounded-full"
                    style={{ backgroundColor: GREEN }}
                  />
                </motion.div>
              );
            })}
          </div>

          <motion.div
            className="text-center mt-14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <a
              href="#dashboard"
              className="inline-block px-8 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,230,118,0.4)]"
              style={{ backgroundColor: GREEN, color: "#000000" }}
            >
              Get Started Free →
            </a>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
