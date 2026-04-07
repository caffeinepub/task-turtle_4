import { Download } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

interface InstallButtonProps {
  /** 'navbar' = compact button for inside the navbar, 'banner' = floating banner */
  variant?: "navbar" | "banner";
}

export function InstallButton({ variant = "navbar" }: InstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
    }
  }

  // Don't render if no prompt available or already installed
  if (!deferredPrompt || installed) return null;

  if (variant === "banner") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9000,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 20px",
            borderRadius: 16,
            background: "rgba(0,0,0,0.92)",
            border: "1px solid rgba(0,255,136,0.3)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 0 40px rgba(0,255,136,0.15), 0 8px 32px rgba(0,0,0,0.8)",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 22 }}>&#x1F422;</span>
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.3,
              }}
            >
              Install Task Turtle
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
              Add to home screen for the best experience
            </p>
          </div>
          <motion.button
            type="button"
            onClick={handleInstall}
            whileTap={{ scale: 0.95 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #00ff88 0%, #00E676 100%)",
              color: "#000000",
              fontWeight: 700,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 0 16px rgba(0,255,136,0.4)",
            }}
          >
            <Download size={14} />
            Install
          </motion.button>
          <button
            type="button"
            onClick={() => setDeferredPrompt(null)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.3)",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  // navbar variant
  return (
    <motion.button
      type="button"
      onClick={handleInstall}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 100,
        background: "rgba(0,255,136,0.1)",
        border: "1px solid rgba(0,255,136,0.3)",
        color: "#00ff88",
        fontWeight: 600,
        fontSize: 13,
        cursor: "pointer",
        boxShadow: "0 0 12px rgba(0,255,136,0.15)",
        whiteSpace: "nowrap",
      }}
      aria-label="Install App"
    >
      <Download size={14} />
      Install App
    </motion.button>
  );
}
