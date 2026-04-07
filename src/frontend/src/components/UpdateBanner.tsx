import { RefreshCw, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export function UpdateBanner() {
  const [show, setShow] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const handler = () => setShow(true);
    window.addEventListener("sw-update-available", handler);
    return () => window.removeEventListener("sw-update-available", handler);
  }, []);

  function handleUpdate() {
    setUpdating(true);
    // Tell the waiting SW to take control
    navigator.serviceWorker?.getRegistration().then((registration) => {
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      // controllerchange event in index.html will reload the page
      // Fallback: reload after 1.5s if no controller change event fires
      setTimeout(() => window.location.reload(), 1500);
    });
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "10px 16px",
            background: "rgba(0,0,0,0.95)",
            borderBottom: "1px solid rgba(0,255,136,0.3)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 4px 24px rgba(0,0,0,0.8), 0 0 40px rgba(0,255,136,0.1)",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#00ff88",
              boxShadow: "0 0 8px #00ff88",
              flexShrink: 0,
              animation: "pulse 1.5s infinite",
            }}
          />
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            ✨ New update available for Task Turtle
          </p>
          <motion.button
            type="button"
            onClick={handleUpdate}
            disabled={updating}
            whileTap={{ scale: 0.95 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #00ff88 0%, #00E676 100%)",
              color: "#000",
              fontWeight: 700,
              fontSize: 12,
              border: "none",
              cursor: updating ? "default" : "pointer",
              opacity: updating ? 0.7 : 1,
              boxShadow: "0 0 12px rgba(0,255,136,0.4)",
            }}
          >
            <RefreshCw size={12} className={updating ? "animate-spin" : ""} />
            {updating ? "Updating..." : "Update Now"}
          </motion.button>
          <button
            type="button"
            onClick={() => setShow(false)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              cursor: "pointer",
              padding: 4,
            }}
            aria-label="Dismiss update banner"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
