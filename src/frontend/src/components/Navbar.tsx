import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Tasks", href: "#tasks" },
  { label: "Blog", href: "#blog" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { identity, clear } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [currentHash, setCurrentHash] = useState(
    () => window.location.hash || "#home",
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = () => setCurrentHash(window.location.hash || "#home");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  function handleLogout() {
    clear();
    window.location.hash = "";
  }

  function isActive(href: string) {
    if (href === "#home")
      return !currentHash || currentHash === "#home" || currentHash === "";
    return currentHash === href;
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[rgba(5,5,5,0.85)] backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between h-[68px]">
          <a
            href="#home"
            className="flex items-center gap-2 group"
            data-ocid="navbar.link"
          >
            <span className="text-2xl leading-none">🐢</span>
            <span className="text-lg font-bold tracking-tight text-white">
              <span style={{ color: "#00E676" }}>Task</span> Turtle
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-full"
                style={
                  isActive(link.href)
                    ? {
                        color: "#00E676",
                        backgroundColor: "rgba(0,230,118,0.1)",
                      }
                    : { color: "#A7ADB3" }
                }
                data-ocid="navbar.link"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <a
                  href="#dashboard"
                  className="px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,230,118,0.4)] active:scale-95 flex items-center gap-1.5"
                  style={{ backgroundColor: "#00E676", color: "#050505" }}
                  data-ocid="navbar.dashboard_link"
                >
                  Go to Dashboard →
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 hover:bg-white/5"
                  style={{
                    borderColor: "rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                  data-ocid="navbar.logout_button"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="px-5 py-2 text-sm font-semibold rounded-full border transition-all duration-200 hover:bg-[#00E676]/10"
                  style={{ borderColor: "#00E676", color: "#00E676" }}
                  data-ocid="navbar.login_button"
                >
                  Login
                </button>
                <button
                  type="button"
                  className="px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,230,118,0.4)] active:scale-95"
                  style={{ backgroundColor: "#00E676", color: "#050505" }}
                  data-ocid="navbar.post_task_button"
                >
                  Post a Task
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-[#A7ADB3] hover:text-white transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            data-ocid="navbar.toggle"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[rgba(5,5,5,0.95)] backdrop-blur-xl border-t border-white/10 px-6 pb-6"
          >
            <nav className="flex flex-col gap-1 pt-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-3 text-sm font-medium transition-colors rounded-xl"
                  style={
                    isActive(link.href)
                      ? {
                          color: "#00E676",
                          backgroundColor: "rgba(0,230,118,0.08)",
                        }
                      : { color: "#A7ADB3" }
                  }
                  onClick={() => setMobileOpen(false)}
                  data-ocid="navbar.link"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                {isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      className="flex-1 py-2.5 text-sm font-semibold rounded-full text-center"
                      style={{ backgroundColor: "#00E676", color: "#050505" }}
                      onClick={() => {
                        setMobileOpen(false);
                        window.location.hash = "dashboard";
                      }}
                      data-ocid="navbar.dashboard_link"
                    >
                      Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        handleLogout();
                      }}
                      className="flex-1 py-2.5 text-sm font-medium rounded-full border"
                      style={{
                        borderColor: "rgba(255,255,255,0.15)",
                        color: "rgba(255,255,255,0.6)",
                      }}
                      data-ocid="navbar.logout_button"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="flex-1 py-2.5 text-sm font-semibold rounded-full border"
                      style={{ borderColor: "#00E676", color: "#00E676" }}
                      data-ocid="navbar.login_button"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      className="flex-1 py-2.5 text-sm font-semibold rounded-full"
                      style={{ backgroundColor: "#00E676", color: "#050505" }}
                      data-ocid="navbar.post_task_button"
                    >
                      Post a Task
                    </button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
