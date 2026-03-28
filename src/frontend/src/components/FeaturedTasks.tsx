import { ArrowRight, MapPin, Star, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { PublicTask } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { getSurgePrice, isSurgeActive } from "../utils/surgePricing";

const STATIC_TASKS = [
  {
    title: "Fix My Leaky Faucet",
    price: 45,
    description:
      "Kitchen faucet dripping non-stop. Need a certified plumber ASAP.",
    helper: "Rajesh M.",
    location: "Koramangala",
    rating: "4.9",
    image: "/assets/generated/task-faucet.dim_400x240.jpg",
    initials: "RM",
    category: "Errands",
    status: "open" as const,
  },
  {
    title: "Grocery Run",
    price: 25,
    description: "Pick up weekly groceries from local store. List provided.",
    helper: "Priya S.",
    location: "Indiranagar",
    rating: "5.0",
    image: "/assets/generated/task-grocery.dim_400x240.jpg",
    initials: "PS",
    category: "Grocery",
    status: "open" as const,
  },
  {
    title: "Furniture Assembly",
    price: 60,
    description: "IKEA wardrobe and 2 nightstands need to be assembled today.",
    helper: "Amit K.",
    location: "HSR Layout",
    rating: "4.8",
    image: "/assets/generated/task-furniture.dim_400x240.jpg",
    initials: "AK",
    category: "Errands",
    status: "accepted" as const,
  },
  {
    title: "Dog Walking",
    price: 20,
    description:
      "Daily 30-min walk for my golden retriever. Gentle & friendly.",
    helper: "Meera T.",
    location: "Jayanagar",
    rating: "4.9",
    image: "/assets/generated/task-dogwalk.dim_400x240.jpg",
    initials: "MT",
    category: "Errands",
    status: "completed" as const,
  },
];

type TaskStatus = "open" | "accepted" | "completed";

interface DisplayTask {
  id: string;
  title: string;
  price: number;
  description: string;
  location: string;
  category: string;
  status: TaskStatus;
  helper: string;
  initials: string;
  rating: string;
  image: string;
}

function statusColor(status: TaskStatus): {
  bg: string;
  text: string;
  label: string;
} {
  if (status === "open")
    return { bg: "rgba(0,230,118,0.15)", text: "#00E676", label: "Open" };
  if (status === "accepted")
    return {
      bg: "rgba(255,160,0,0.15)",
      text: "#FFA000",
      label: "In Progress",
    };
  return { bg: "rgba(120,120,120,0.15)", text: "#A7ADB3", label: "Completed" };
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "rgba(14,18,20,0.6)",
        borderColor: "rgba(255,255,255,0.09)",
      }}
    >
      <div
        className="h-44 animate-pulse"
        style={{ background: "rgba(255,255,255,0.06)" }}
      />
      <div className="p-4 flex flex-col gap-3">
        <div
          className="h-4 rounded-lg animate-pulse w-3/4"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div
          className="h-3 rounded-lg animate-pulse w-full"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div
          className="h-3 rounded-lg animate-pulse w-2/3"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
        <div
          className="h-8 rounded-lg animate-pulse mt-2"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
      </div>
    </div>
  );
}

export function FeaturedTasks() {
  const surgeActive = isSurgeActive();
  const { actor, isFetching } = useActor();
  const [tasks, setTasks] = useState<DisplayTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFetching || !actor) return;

    let cancelled = false;
    setLoading(true);

    actor
      .getAllTasks()
      .then((backendTasks: PublicTask[]) => {
        if (cancelled) return;
        if (backendTasks.length === 0) {
          // Use static fallback
          setTasks(STATIC_TASKS.map((t, i) => ({ ...t, id: String(i + 1) })));
        } else {
          const mapped: DisplayTask[] = backendTasks
            .slice(0, 8)
            .map((t, i) => ({
              id: t.id,
              title: t.title,
              price: Number(t.amount),
              description: t.description,
              location: t.location,
              category: t.category,
              status: t.status as TaskStatus,
              helper: "Local Helper",
              initials: t.category.slice(0, 2).toUpperCase(),
              rating: "5.0",
              image:
                STATIC_TASKS[i % STATIC_TASKS.length]?.image ??
                "/assets/generated/task-grocery.dim_400x240.jpg",
            }));
          setTasks(mapped);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTasks(STATIC_TASKS.map((t, i) => ({ ...t, id: String(i + 1) })));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [actor, isFetching]);

  const displayTasks =
    tasks.length > 0
      ? tasks
      : STATIC_TASKS.map((t, i) => ({ ...t, id: String(i + 1) }));

  return (
    <section id="tasks" className="py-24 relative">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "#00E676" }}
          >
            Featured Local Tasks
          </p>
          <h2 className="text-4xl font-bold text-white">
            Available Now in Your Area
          </h2>
          <p className="text-[#A7ADB3] mt-4 max-w-md mx-auto">
            Real tasks posted by real people in your neighbourhood, ready for a
            Tasker like you.
          </p>
        </motion.div>

        {/* Surge notice banner */}
        <AnimatePresence>
          {surgeActive && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="flex justify-center mb-8"
            >
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(255,160,0,0.12)",
                  color: "#FFA000",
                  border: "1px solid rgba(255,160,0,0.35)",
                }}
                data-ocid="tasks.toggle"
              >
                <Zap size={11} fill="#FFA000" />
                Surge pricing active · 11 PM \u2013 5 AM
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        {loading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            data-ocid="tasks.loading_state"
          >
            {[1, 2, 3, 4].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {displayTasks.map((task, i) => {
              const surgedNum = getSurgePrice(task.price);
              const st = statusColor(task.status);

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group rounded-2xl border overflow-hidden hover:shadow-[0_0_40px_rgba(0,230,118,0.12)] transition-all duration-300"
                  style={{
                    background: "rgba(14,18,20,0.6)",
                    borderColor: surgeActive
                      ? "rgba(255,160,0,0.18)"
                      : "rgba(255,255,255,0.09)",
                  }}
                  data-ocid={`tasks.item.${i + 1}`}
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={task.image}
                      alt={task.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Price badge */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      {surgeActive ? (
                        <>
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: "#FFA000",
                              color: "#050505",
                            }}
                          >
                            \u20b9{surgedNum}
                          </span>
                          <span
                            className="text-[10px] line-through"
                            style={{ color: "rgba(255,255,255,0.45)" }}
                          >
                            \u20b9{task.price}
                          </span>
                        </>
                      ) : (
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: "#00E676",
                            color: "#050505",
                          }}
                        >
                          \u20b9{task.price}
                        </span>
                      )}
                    </div>
                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          background: st.bg,
                          color: st.text,
                          border: `1px solid ${st.text}40`,
                        }}
                      >
                        {st.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-white font-semibold text-sm mb-1.5">
                      {task.title}
                    </h3>
                    <p className="text-[#A7ADB3] text-xs leading-relaxed mb-4">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin size={11} className="text-[#A7ADB3]" />
                        <span className="text-xs text-[#A7ADB3]">
                          {task.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star
                          size={11}
                          style={{ color: "#00E676", fill: "#00E676" }}
                        />
                        <span className="text-xs text-[#A7ADB3]">
                          {task.rating}
                        </span>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between pt-3 border-t"
                      style={{ borderColor: "rgba(255,255,255,0.08)" }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            backgroundColor: "rgba(0,230,118,0.15)",
                            color: "#00E676",
                          }}
                        >
                          {task.initials}
                        </div>
                        <div>
                          <p className="text-white text-xs font-medium">
                            {task.helper}
                          </p>
                          <p className="text-[#A7ADB3] text-[10px]">
                            {task.category}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:shadow-[0_0_15px_rgba(0,230,118,0.3)] active:scale-95"
                        style={{ backgroundColor: "#00E676", color: "#050505" }}
                        data-ocid={`tasks.button.${i + 1}`}
                      >
                        View
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <button
            type="button"
            className="px-8 py-3 rounded-full text-sm font-semibold border transition-all duration-200 hover:bg-[#00E676]/10"
            style={{ borderColor: "#00E676", color: "#00E676" }}
            data-ocid="tasks.secondary_button"
          >
            Browse All Tasks
          </button>
        </motion.div>
      </div>
    </section>
  );
}
