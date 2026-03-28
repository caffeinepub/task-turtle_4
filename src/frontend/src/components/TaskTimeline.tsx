import {
  CheckCircle,
  ClipboardList,
  MapPin,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type { Variants } from "motion/react";
import { motion } from "motion/react";

interface TaskTimelineProps {
  currentStage?: number; // 1–5, default 1
}

const STAGES = [
  { label: "Task Posted", icon: ClipboardList },
  { label: "Accepted", icon: CheckCircle },
  { label: "On the Way", icon: Truck },
  { label: "Arrived", icon: MapPin },
  { label: "Verified", icon: ShieldCheck },
];

const GREEN = "#00E676";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export function TaskTimeline({ currentStage = 1 }: TaskTimelineProps) {
  const current = Math.max(1, Math.min(5, currentStage));

  const completedFraction = (current - 1) / (STAGES.length - 1);

  return (
    <div
      className="inline-block w-full max-w-sm rounded-2xl p-6 shadow-xl"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      data-ocid="task_timeline.card"
    >
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-1">
          Order Status
        </p>
        <h2 className="text-white text-lg font-bold">Tracking your task</h2>
      </div>

      {/* Timeline */}
      <motion.div
        className="relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Background line */}
        <div
          className="absolute left-[19px] top-[10px] bottom-[10px] w-[2px]"
          style={{ background: "rgba(255,255,255,0.08)", borderRadius: 999 }}
        />
        {/* Completed line overlay */}
        <div
          className="absolute left-[19px] top-[10px] w-[2px] transition-all duration-700"
          style={{
            background: `linear-gradient(to bottom, ${GREEN}, ${GREEN}99)`,
            borderRadius: 999,
            height: `calc((100% - 20px) * ${completedFraction})`,
            boxShadow: `0 0 8px ${GREEN}80`,
          }}
        />

        {STAGES.map((stage, index) => {
          const stageNum = index + 1;
          const isCompleted = stageNum < current;
          const isCurrent = stageNum === current;
          const isUpcoming = stageNum > current;
          const Icon = stage.icon;

          return (
            <motion.div
              key={stageNum}
              variants={itemVariants}
              className="relative flex items-start gap-4 mb-6 last:mb-0"
            >
              {/* Dot */}
              <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center">
                {/* Pulse ring for current */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `2px solid ${GREEN}`, opacity: 0.6 }}
                    animate={{ scale: [1, 1.55, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{
                      duration: 1.8,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />
                )}

                {/* Dot circle */}
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500"
                  style={{
                    background: isUpcoming ? "transparent" : GREEN,
                    border: isUpcoming
                      ? "2px solid rgba(255,255,255,0.2)"
                      : "none",
                    boxShadow: isCompleted
                      ? `0 0 10px ${GREEN}99, 0 0 20px ${GREEN}40`
                      : isCurrent
                        ? `0 0 14px ${GREEN}, 0 0 28px ${GREEN}60`
                        : "none",
                  }}
                >
                  {isCompleted && (
                    <svg
                      role="img"
                      aria-label="Completed"
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                    >
                      <path
                        d="M2 5l2.5 2.5L8 3"
                        stroke="#000"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {isCurrent && (
                    <div className="w-2 h-2 rounded-full bg-black" />
                  )}
                </div>
              </div>

              {/* Label */}
              <div className="flex flex-col justify-center min-h-10">
                <div className="flex items-center gap-2">
                  <Icon
                    size={14}
                    style={{
                      color: isUpcoming ? "rgba(255,255,255,0.25)" : GREEN,
                    }}
                  />
                  <span
                    className="font-medium"
                    style={{
                      fontSize: isCurrent ? "0.9375rem" : "0.875rem",
                      fontWeight: isCurrent ? 700 : isCompleted ? 500 : 400,
                      color: isCompleted
                        ? GREEN
                        : isCurrent
                          ? "#ffffff"
                          : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: `${GREEN}22`,
                        color: GREEN,
                        border: `1px solid ${GREEN}40`,
                      }}
                    >
                      In Progress
                    </span>
                  )}
                  {isCompleted && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: `${GREEN}12`,
                        color: `${GREEN}bb`,
                      }}
                    >
                      Done
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Footer hint */}
      <div
        className="mt-6 pt-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-xs text-white/25 text-center">
          Stage {current} of {STAGES.length} &mdash; {STAGES[current - 1].label}
        </p>
      </div>
    </div>
  );
}
