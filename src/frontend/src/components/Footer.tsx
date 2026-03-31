import { Instagram, Linkedin, Twitter } from "lucide-react";
import { motion } from "motion/react";

const LINKS = [
  { title: "Company", items: ["About", "Blog", "Careers", "Press"] },
  { title: "Product", items: ["How it Works", "Pricing", "Safety", "FAQs"] },
  { title: "Community", items: ["Forum", "Tasker HQ", "Events", "Partner"] },
  { title: "Legal", items: ["Privacy", "Terms", "Cookies", "Licenses"] },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 sm:py-16 px-4 sm:px-6 relative">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border backdrop-blur-md p-6 sm:p-10 lg:p-14"
          style={{
            background: "rgba(0,0,0,0.65)",
            borderColor: "rgba(0,230,118,0.12)",
            boxShadow: "0 0 80px rgba(0,230,118,0.05)",
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 lg:gap-10 mb-10 sm:mb-12">
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🐢</span>
                <span className="text-lg font-bold text-white">
                  <span style={{ color: "#00E676" }}>Task</span> Turtle
                </span>
              </div>
              <p className="text-[#A7ADB3] text-sm leading-relaxed mb-6">
                Connecting people with trusted local helpers for everyday tasks
                — fast, safe, and affordable.
              </p>
              <div className="flex items-center gap-3">
                {[
                  {
                    icon: Twitter,
                    label: "Twitter",
                    href: "https://twitter.com",
                  },
                  {
                    icon: Instagram,
                    label: "Instagram",
                    href: "https://instagram.com",
                  },
                  {
                    icon: Linkedin,
                    label: "LinkedIn",
                    href: "https://linkedin.com",
                  },
                ].map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 hover:border-[#00E676]/50 hover:bg-[#00E676]/10"
                    style={{ borderColor: "rgba(255,255,255,0.12)" }}
                    data-ocid="footer.link"
                  >
                    <Icon size={15} style={{ color: "#00E676" }} />
                  </a>
                ))}
              </div>
            </div>

            {LINKS.map((col) => (
              <div key={col.title}>
                <h4 className="text-white text-sm font-semibold mb-3 sm:mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-2">
                  {col.items.map((item) => (
                    <li key={item}>
                      <a
                        href={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-[#A7ADB3] text-sm hover:text-white transition-colors duration-150"
                        data-ocid="footer.link"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 sm:pt-8 border-t"
            style={{ borderColor: "rgba(0,230,118,0.12)" }}
          >
            <p className="text-[#A7ADB3] text-xs">
              © {currentYear} Task Turtle. All rights reserved.
            </p>

            {/* Founder branding — replaces caffeine.ai attribution */}
            <div className="flex flex-col items-center sm:items-end gap-0.5">
              <p
                className="text-xs font-semibold"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Founder of TaskTurtle
              </p>
              <p className="text-sm font-bold" style={{ color: "#00E676" }}>
                Ayush Singh Rajput
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
