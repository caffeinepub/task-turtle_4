import { ShieldCheck, User } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const GREEN = "#00E676";
const AMBER = "#F59E0B";

export function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#050505" }}
    >
      {/* Ambient glows */}
      <div
        className="fixed top-0 left-0 w-[500px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(0,230,118,0.07) 0%, transparent 60%)",
          zIndex: 0,
        }}
      />
      <div
        className="fixed bottom-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 100% 100%, rgba(0,230,118,0.06) 0%, transparent 60%)",
          zIndex: 0,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "rgba(0,230,118,0.1)",
              border: "1px solid rgba(0,230,118,0.25)",
              boxShadow: "0 0 32px rgba(0,230,118,0.2)",
            }}
          >
            <span className="text-3xl">🐢</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            <span style={{ color: GREEN }}>Task</span> Turtle
          </h1>
          <p
            className="text-sm mt-1.5"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Any Task. Any Place. By Nearby People.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(0,230,118,0.05)",
          }}
        >
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">
              Welcome to Task Turtle
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Choose how you want to sign in
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Login as User */}
            <motion.button
              type="button"
              data-ocid="login.primary_button"
              onClick={login}
              disabled={isLoggingIn}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "rgba(0,230,118,0.08)",
                border: `1.5px solid ${GREEN}40`,
                boxShadow: "0 0 20px rgba(0,230,118,0.08)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(0,230,118,0.15)",
                  border: `1px solid ${GREEN}35`,
                }}
              >
                <User size={18} style={{ color: GREEN }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">
                  Login as User
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Post tasks, track orders, manage wallet
                </p>
              </div>
            </motion.button>

            {/* Login as Admin */}
            <motion.button
              type="button"
              data-ocid="login.secondary_button"
              onClick={login}
              disabled={isLoggingIn}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "rgba(245,158,11,0.06)",
                border: `1.5px solid ${AMBER}40`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(245,158,11,0.12)",
                  border: `1px solid ${AMBER}35`,
                }}
              >
                <ShieldCheck size={18} style={{ color: AMBER }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">
                  Login as Admin
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Platform control — tasks, taskers, users
                </p>
              </div>
            </motion.button>
          </div>

          {isLoggingIn && (
            <p
              className="text-center text-xs mt-5"
              style={{ color: "rgba(0,230,118,0.7)" }}
              data-ocid="login.loading_state"
            >
              Opening Internet Identity…
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <ShieldCheck size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            Secured by Internet Identity — no passwords, no data leaks.
          </p>
        </div>

        <p
          className="text-center text-xs mt-4"
          style={{ color: "rgba(255,255,255,0.15)" }}
        >
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgba(0,230,118,0.5)" }}
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
