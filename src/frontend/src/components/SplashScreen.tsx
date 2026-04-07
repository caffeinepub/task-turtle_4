import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "tt_splash_shown";

// Generate a soft startup chime using Web Audio API
function playStartupChime() {
  try {
    const AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext })
        .webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    // Three-note ascending chime: C5 → E5 → G5
    const notes = [
      { freq: 523.25, start: 0, duration: 0.4 },
      { freq: 659.25, start: 0.18, duration: 0.4 },
      { freq: 783.99, start: 0.36, duration: 0.6 },
    ];

    for (const { freq, start, duration } of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      // Soft envelope: fast attack, slow release
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + start + duration,
      );

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    }
  } catch {
    // Audio not available — fail silently
  }
}

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const playedRef = useRef(false);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem(SESSION_KEY)) return;
    setVisible(true);
  }, []);

  function dismiss() {
    if (exiting || !visible) return;

    // Play chime on first interaction (respects autoplay policy)
    if (!playedRef.current) {
      playedRef.current = true;
      playStartupChime();
    }

    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 700);
  }

  if (!visible) return null;

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onClick={dismiss}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "#000000",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {/* Ambient glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 50% 50%, rgba(0,255,136,0.08) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
            }}
          >
            {/* Icon with neon glow */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 30px rgba(0,255,136,0.3), 0 0 60px rgba(0,255,136,0.1)",
                  "0 0 60px rgba(0,255,136,0.6), 0 0 100px rgba(0,255,136,0.2)",
                  "0 0 30px rgba(0,255,136,0.3), 0 0 60px rgba(0,255,136,0.1)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 28,
                overflow: "hidden",
                border: "1.5px solid rgba(0,255,136,0.4)",
              }}
            >
              <img
                src="/icon-512x512.png"
                alt="Task Turtle"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/icon-192x192.png";
                }}
              />
            </motion.div>

            {/* App name */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              style={{ textAlign: "center" }}
            >
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                  color: "#ffffff",
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                <span style={{ color: "#00ff88" }}>Task</span> Turtle
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.05em",
                }}
              >
                Any Task. Any Place. Nearby.
              </p>
            </motion.div>
          </motion.div>

          {/* Tap prompt */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            style={{
              position: "absolute",
              bottom: 48,
              fontSize: 12,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.1em",
            }}
          >
            TAP ANYWHERE TO CONTINUE
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
