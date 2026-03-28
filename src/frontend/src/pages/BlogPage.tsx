import { ArrowRight, Clock, User } from "lucide-react";
import { motion } from "motion/react";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";

const GREEN = "#00E676";

const POSTS = [
  {
    title: "How Surge Pricing Helps Taskers Earn More at Night",
    excerpt:
      "Task Turtle's surge pricing activates during peak hours (11 PM – 5 AM), ensuring taskers who work late are rewarded with higher payouts.",
    author: "Task Turtle Team",
    date: "Mar 25, 2026",
    readTime: "4 min read",
    tag: "Platform",
    tagColor: GREEN,
  },
  {
    title: "OTP Verification: Why Every Task Needs It",
    excerpt:
      "We built OTP-based delivery confirmation so no task can ever be marked complete without your explicit approval. Here's why it matters.",
    author: "Priya S.",
    date: "Mar 20, 2026",
    readTime: "3 min read",
    tag: "Safety",
    tagColor: "#00BCD4",
  },
  {
    title: "5 Tips for Getting Your Task Done Faster",
    excerpt:
      "Post at the right time, be specific in your description, and set a fair budget. We break down the top strategies to get matches instantly.",
    author: "Rahul V.",
    date: "Mar 15, 2026",
    readTime: "5 min read",
    tag: "Tips",
    tagColor: "#FFA000",
  },
  {
    title: "Becoming a Top-Rated Tasker: The Complete Guide",
    excerpt:
      "From completing your profile with Aadhar verification to maintaining a 5-star rating — everything a new tasker needs to know to succeed.",
    author: "Amit K.",
    date: "Mar 10, 2026",
    readTime: "7 min read",
    tag: "Taskers",
    tagColor: "#AB47BC",
  },
  {
    title: "Escrow Payments: Your Money is Always Safe",
    excerpt:
      "When you pay on Task Turtle, your money never goes directly to the tasker until you've verified the task is complete. Here's how it works.",
    author: "Task Turtle Team",
    date: "Mar 5, 2026",
    readTime: "4 min read",
    tag: "Payments",
    tagColor: "#66BB6A",
  },
  {
    title: "Task Turtle Now Available in 20+ Cities",
    excerpt:
      "We're expanding! From Mumbai and Bangalore to Pune and Hyderabad — Task Turtle's hyper-local network is growing fast.",
    author: "Task Turtle Team",
    date: "Mar 1, 2026",
    readTime: "2 min read",
    tag: "News",
    tagColor: "#EF5350",
  },
];

export function BlogPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#050505" }}>
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
              Blog
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Stories, Tips & Updates
            </h1>
            <p className="text-[#A7ADB3] text-lg max-w-xl mx-auto">
              Insights from the Task Turtle team and community — for taskers,
              customers, and the curious.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {POSTS.map((post, i) => (
              <motion.article
                key={post.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative rounded-2xl border p-6 hover:shadow-[0_0_40px_rgba(0,230,118,0.1)] transition-all duration-300 cursor-pointer"
                style={{
                  background: "rgba(14,18,20,0.7)",
                  borderColor: "rgba(255,255,255,0.09)",
                }}
              >
                {/* Tag */}
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
                  style={{
                    background: `${post.tagColor}18`,
                    color: post.tagColor,
                    border: `1px solid ${post.tagColor}35`,
                  }}
                >
                  {post.tag}
                </span>

                <h2 className="text-white font-bold text-lg leading-snug mb-3 group-hover:text-[#00E676] transition-colors duration-200">
                  {post.title}
                </h2>
                <p className="text-[#A7ADB3] text-sm leading-relaxed mb-6">
                  {post.excerpt}
                </p>

                <div
                  className="flex items-center justify-between mt-auto pt-4 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-[#A7ADB3]" />
                      <span className="text-[#A7ADB3] text-xs">
                        {post.author}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-[#A7ADB3]" />
                      <span className="text-[#A7ADB3] text-xs">
                        {post.readTime}
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    style={{ color: GREEN }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  />
                </div>

                <p className="text-[#A7ADB3]/40 text-xs mt-2">{post.date}</p>

                {/* Bottom accent */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-1/2 transition-all duration-500 rounded-full"
                  style={{ backgroundColor: GREEN }}
                />
              </motion.article>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <button
              type="button"
              className="px-8 py-3 rounded-full text-sm font-semibold border transition-all duration-200 hover:bg-[#00E676]/10"
              style={{ borderColor: GREEN, color: GREEN }}
            >
              Load More Articles
            </button>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
