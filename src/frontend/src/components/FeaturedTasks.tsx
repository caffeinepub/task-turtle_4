import { ArrowRight, MapPin, Star } from "lucide-react";
import { motion } from "motion/react";

const TASKS = [
  {
    title: "Fix My Leaky Faucet",
    price: "$45",
    description:
      "Kitchen faucet dripping non-stop. Need a certified plumber ASAP.",
    helper: "Rajesh M.",
    location: "Koramangala",
    rating: "4.9",
    image: "/assets/generated/task-faucet.dim_400x240.jpg",
    initials: "RM",
  },
  {
    title: "Grocery Run",
    price: "$25",
    description: "Pick up weekly groceries from local store. List provided.",
    helper: "Priya S.",
    location: "Indiranagar",
    rating: "5.0",
    image: "/assets/generated/task-grocery.dim_400x240.jpg",
    initials: "PS",
  },
  {
    title: "Furniture Assembly",
    price: "$60",
    description: "IKEA wardrobe and 2 nightstands need to be assembled today.",
    helper: "Amit K.",
    location: "HSR Layout",
    rating: "4.8",
    image: "/assets/generated/task-furniture.dim_400x240.jpg",
    initials: "AK",
  },
  {
    title: "Dog Walking",
    price: "$20",
    description:
      "Daily 30-min walk for my golden retriever. Gentle & friendly.",
    helper: "Meera T.",
    location: "Jayanagar",
    rating: "4.9",
    image: "/assets/generated/task-dogwalk.dim_400x240.jpg",
    initials: "MT",
  },
];

export function FeaturedTasks() {
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TASKS.map((task, i) => (
            <motion.div
              key={task.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group rounded-2xl border overflow-hidden hover:shadow-[0_0_40px_rgba(0,230,118,0.12)] transition-all duration-300"
              style={{
                background: "rgba(14,18,20,0.6)",
                borderColor: "rgba(255,255,255,0.09)",
              }}
              data-ocid={`tasks.item.${i + 1}`}
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={task.image}
                  alt={task.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: "#00E676", color: "#050505" }}
                >
                  {task.price}
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
                      <p className="text-[#A7ADB3] text-[10px]">Local Helper</p>
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
          ))}
        </div>

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
