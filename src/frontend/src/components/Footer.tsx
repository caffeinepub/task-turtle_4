import { Instagram, Linkedin, Twitter } from "lucide-react";
import { motion } from "motion/react";

const LINKS = [
  {
    title: "Company",
    items: ["About", "Blog", "Careers", "Press"],
  },
  {
    title: "Product",
    items: ["How it Works", "Pricing", "Safety", "FAQs"],
  },
  {
    title: "Community",
    items: ["Forum", "Tasker HQ", "Events", "Partner"],
  },
  {
    title: "Legal",
    items: ["Privacy", "Terms", "Cookies", "Licenses"],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const utmLink = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <footer className="py-16 px-6 relative">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border backdrop-blur-md p-10 lg:p-14"
          style={{
            background: "rgba(14,18,20,0.65)",
            borderColor: "rgba(255,255,255,0.09)",
            boxShadow: "0 0 80px rgba(0,230,118,0.05)",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-10 mb-12">
            <div className="lg:col-span-2">
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
                <h4 className="text-white text-sm font-semibold mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
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
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <p className="text-[#A7ADB3] text-xs">
              © {currentYear} Task Turtle. All rights reserved.
            </p>
            <p className="text-[#A7ADB3] text-xs">
              Built with ❤️ using{" "}
              <a
                href={utmLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                style={{ color: "#00E676" }}
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
