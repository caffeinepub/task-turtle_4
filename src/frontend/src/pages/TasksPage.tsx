import { ArrowRight, Filter, MapPin, Search, Star, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { PublicTask } from "../backend.d";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { useActor } from "../hooks/useActor";
import { getSurgePrice, isSurgeActive } from "../utils/surgePricing";

const GREEN = "#00E676";

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
    category: "Plumbing",
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
    category: "Home",
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
    category: "Pets",
    status: "open" as const,
  },
  {
    title: "AC Repair",
    price: 800,
    description: "AC not cooling. Need a technician to diagnose and fix.",
    helper: "Suresh P.",
    location: "Whitefield",
    rating: "4.7",
    image: "/assets/generated/task-grocery.dim_400x240.jpg",
    initials: "SP",
    category: "Repairs",
    status: "open" as const,
  },
  {
    title: "Math Tutoring",
    price: 300,
    description: "Need a tutor for Class 10 board exam preparation.",
    helper: "Ananya R.",
    location: "Bandra",
    rating: "5.0",
    image: "/assets/generated/task-faucet.dim_400x240.jpg",
    initials: "AR",
    category: "Education",
    status: "open" as const,
  },
  {
    title: "Bike Delivery",
    price: 150,
    description: "Deliver a parcel from Andheri to Borivali.",
    helper: "Rahul V.",
    location: "Andheri",
    rating: "4.6",
    image: "/assets/generated/task-dogwalk.dim_400x240.jpg",
    initials: "RV",
    category: "Delivery",
    status: "open" as const,
  },
  {
    title: "House Cleaning",
    price: 500,
    description: "Deep clean 2BHK apartment. All supplies provided.",
    helper: "Kavya N.",
    location: "Powai",
    rating: "4.9",
    image: "/assets/generated/task-furniture.dim_400x240.jpg",
    initials: "KN",
    category: "Cleaning",
    status: "open" as const,
  },
];

const CATEGORIES = [
  "All",
  "Grocery",
  "Delivery",
  "Cleaning",
  "Plumbing",
  "Repairs",
  "Home",
  "Pets",
  "Education",
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

function statusColor(status: TaskStatus) {
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

export function TasksPage() {
  const surgeActive = isSurgeActive();
  const { actor, isFetching } = useActor();
  const [tasks, setTasks] = useState<DisplayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    if (isFetching) return;
    if (!actor) {
      setTasks(STATIC_TASKS.map((t, i) => ({ ...t, id: String(i + 1) })));
      setLoading(false);
      return;
    }
    actor
      .getAllTasks()
      .then((backendTasks: PublicTask[]) => {
        if (backendTasks.length === 0) {
          setTasks(STATIC_TASKS.map((t, i) => ({ ...t, id: String(i + 1) })));
        } else {
          setTasks(
            backendTasks.map((t, i) => ({
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
              image: STATIC_TASKS[i % STATIC_TASKS.length]?.image ?? "",
            })),
          );
        }
      })
      .catch(() =>
        setTasks(STATIC_TASKS.map((t, i) => ({ ...t, id: String(i + 1) }))),
      )
      .finally(() => setLoading(false));
  }, [actor, isFetching]);

  const displayTasks = (
    tasks.length > 0
      ? tasks
      : STATIC_TASKS.map((t, i) => ({ ...t, id: String(i + 1) }))
  )
    .filter((t) => activeCategory === "All" || t.category === activeCategory)
    .filter(
      (t) =>
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.location.toLowerCase().includes(search.toLowerCase()),
    );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000000" }}>
      <Navbar />
      <div className="pt-28 pb-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: GREEN }}
            >
              Browse Tasks
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Tasks Available Near You
            </h1>
            <p className="text-[#A7ADB3] text-lg max-w-xl mx-auto">
              Real tasks posted by real people in your neighbourhood.
            </p>
          </motion.div>

          {/* Search + Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A7ADB3]"
              />
              <input
                type="text"
                placeholder="Search tasks or locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl text-sm text-white placeholder-[#A7ADB3] outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} style={{ color: GREEN }} />
              <span className="text-xs text-[#A7ADB3]">
                {displayTasks.length} tasks
              </span>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200"
                style={
                  activeCategory === cat
                    ? {
                        backgroundColor: GREEN,
                        color: "#000000",
                        borderColor: GREEN,
                      }
                    : {
                        background: "transparent",
                        color: "#A7ADB3",
                        borderColor: "rgba(255,255,255,0.15)",
                      }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Surge banner */}
          <AnimatePresence>
            {surgeActive && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-center mb-6"
              >
                <span
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: "rgba(255,160,0,0.12)",
                    color: "#FFA000",
                    border: "1px solid rgba(255,160,0,0.35)",
                  }}
                >
                  <Zap size={11} fill="#FFA000" /> Surge pricing active · 11 PM
                  – 5 AM
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    borderColor: "rgba(0,230,118,0.12)",
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
                  </div>
                </div>
              ))}
            </div>
          ) : displayTasks.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#A7ADB3] text-lg">
                No tasks found. Try a different search or category.
              </p>
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
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                    className="group rounded-2xl border overflow-hidden hover:shadow-[0_0_40px_rgba(0,230,118,0.12)] transition-all duration-300"
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      borderColor: surgeActive
                        ? "rgba(255,160,0,0.18)"
                        : "rgba(255,255,255,0.09)",
                    }}
                  >
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={task.image}
                        alt={task.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "/assets/generated/task-default.dim_400x240.jpg";
                        }}
                      />
                      <div className="absolute top-3 right-3">
                        {surgeActive ? (
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: "#FFA000",
                              color: "#000000",
                            }}
                          >
                            ₹{surgedNum}
                          </span>
                        ) : (
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{ backgroundColor: GREEN, color: "#000000" }}
                          >
                            ₹{task.price}
                          </span>
                        )}
                      </div>
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
                            style={{ color: GREEN, fill: GREEN }}
                          />
                          <span className="text-xs text-[#A7ADB3]">
                            {task.rating}
                          </span>
                        </div>
                      </div>
                      <div
                        className="flex items-center justify-between pt-3 border-t"
                        style={{ borderColor: "rgba(0,230,118,0.12)" }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: "rgba(0,230,118,0.15)",
                              color: GREEN,
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
                          style={{ backgroundColor: GREEN, color: "#000000" }}
                        >
                          View <ArrowRight size={11} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
