import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: number;
  type: "bot" | "user";
  text: string;
};

const AUTO_OPTIONS = [
  {
    label: "How it Works",
    reply: "Post task → Turtle accept karega → kaam complete → payment done 🐢",
  },
  {
    label: "Track My Task",
    reply: "Dashboard me jaake apna task status check karo 📊",
  },
  {
    label: "Tasker Payout",
    reply: "Admin manually UPI se payout karta hai after task complete 💰",
  },
  {
    label: "Become a Tasker",
    reply: "Profile complete karo aur UPI add karo to start earning 🚀",
  },
];

const INITIAL_MESSAGE: Message = {
  id: 0,
  type: "bot",
  text: "Namaste! 🐢 Main Task Turtle Support hoon. Aap kya jaanna chahte ho?",
};

export function TurtleChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [nextId, setNextId] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: messages triggers scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleOption(option: { label: string; reply: string }) {
    const userMsg: Message = { id: nextId, type: "user", text: option.label };
    const botMsg: Message = { id: nextId + 1, type: "bot", text: option.reply };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setNextId((n) => n + 2);
  }

  function handleLinkHover(
    e: React.MouseEvent<HTMLAnchorElement>,
    color: string,
  ) {
    e.currentTarget.style.color = color;
  }

  function handleBtnHover(
    e: React.MouseEvent<HTMLButtonElement>,
    bg: string,
    border: string,
  ) {
    e.currentTarget.style.background = bg;
    e.currentTarget.style.borderColor = border;
  }

  return (
    <>
      <style>{`
        @keyframes turtle-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes aura-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.12); }
        }
        @keyframes aura-pulse-2 {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.18); }
        }
        .turtle-float { animation: turtle-float 3s ease-in-out infinite; }
        .aura-ring-1 { animation: aura-pulse 2.5s ease-in-out infinite; }
        .aura-ring-2 { animation: aura-pulse-2 3s ease-in-out infinite 0.5s; }
        .aura-ring-3 { animation: aura-pulse 3.5s ease-in-out infinite 1s; }
      `}</style>

      {/* Floating Turtle Button */}
      <div
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center"
        style={{ width: 72, height: 72 }}
      >
        {/* Aura rings behind button */}
        <div
          className="absolute aura-ring-1 pointer-events-none"
          style={{
            inset: "-12px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,230,118,0.35) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute aura-ring-2 pointer-events-none"
          style={{
            inset: "-22px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,230,118,0.18) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute aura-ring-3 pointer-events-none"
          style={{
            inset: "-34px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,230,118,0.1) 0%, transparent 50%)",
          }}
        />

        {/* Ping ring */}
        <div
          className="absolute animate-ping pointer-events-none"
          style={{
            inset: 0,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,230,118,0.4) 0%, transparent 70%)",
            animationDuration: "2s",
          }}
        />

        {/* The button itself */}
        <button
          type="button"
          className="relative turtle-float flex items-center justify-center cursor-pointer"
          onClick={() => setIsOpen((o) => !o)}
          style={{
            width: 72,
            height: 72,
            background: "transparent",
            border: "none",
            outline: "none",
            padding: 0,
            filter: isOpen
              ? "drop-shadow(0 0 18px #00E676) drop-shadow(0 0 36px rgba(0,230,118,0.5))"
              : "drop-shadow(0 0 10px #00E676) drop-shadow(0 0 20px rgba(0,230,118,0.3))",
            transition: "filter 0.3s ease",
          }}
          data-ocid="chatbot.open_modal_button"
          aria-label="Open Task Turtle Support Chat"
        >
          {/* Turtle SVG */}
          <svg
            viewBox="0 0 64 64"
            width="60"
            height="60"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Task Turtle chatbot"
          >
            <title>Task Turtle</title>
            <defs>
              <radialGradient id="shellGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,80,80,0.18)" />
                <stop offset="50%" stopColor="rgba(0,230,118,0.6)" />
                <stop offset="100%" stopColor="#00C853" />
              </radialGradient>
              <radialGradient id="headGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00ff90" />
                <stop offset="100%" stopColor="#00C853" />
              </radialGradient>
            </defs>

            {/* Body base (dark) */}
            <ellipse cx="32" cy="34" rx="22" ry="18" fill="#001a0a" />

            {/* Legs */}
            <rect x="8" y="16" width="10" height="6" rx="3" fill="#00C853" />
            <rect x="46" y="16" width="10" height="6" rx="3" fill="#00C853" />
            <rect x="8" y="44" width="10" height="6" rx="3" fill="#00C853" />
            <rect x="46" y="44" width="10" height="6" rx="3" fill="#00C853" />

            {/* Tail */}
            <ellipse cx="13" cy="38" rx="4" ry="3" fill="#00C853" />

            {/* Main shell */}
            <ellipse cx="32" cy="32" rx="20" ry="16" fill="url(#shellGlow)" />

            {/* Shell patterns */}
            <ellipse
              cx="32"
              cy="32"
              rx="11"
              ry="8"
              fill="none"
              stroke="#00C853"
              strokeWidth="1.2"
              opacity="0.7"
            />
            <line
              x1="32"
              y1="16"
              x2="32"
              y2="48"
              stroke="#00C853"
              strokeWidth="1"
              opacity="0.5"
            />
            <line
              x1="12"
              y1="32"
              x2="52"
              y2="32"
              stroke="#00C853"
              strokeWidth="1"
              opacity="0.5"
            />
            <ellipse
              cx="32"
              cy="25"
              rx="4"
              ry="3"
              fill="#00C853"
              opacity="0.6"
            />
            <ellipse
              cx="24"
              cy="34"
              rx="4"
              ry="3"
              fill="#00C853"
              opacity="0.6"
            />
            <ellipse
              cx="40"
              cy="34"
              rx="4"
              ry="3"
              fill="#00C853"
              opacity="0.6"
            />

            {/* Head */}
            <circle cx="50" cy="24" r="8" fill="url(#headGlow)" />
            <circle cx="50" cy="24" r="7" fill="#00E676" />

            {/* Eye */}
            <circle cx="53" cy="22" r="2" fill="#001a0a" />
            <circle cx="53.6" cy="21.4" r="0.6" fill="white" />

            {/* Nostril */}
            <circle cx="56" cy="25" r="0.8" fill="#009140" />
          </svg>
        </button>
      </div>

      {/* Chat Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chatbox"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed z-50 flex flex-col"
            style={{
              bottom: "6rem",
              right: "1.5rem",
              width: "min(320px, calc(100vw - 3rem))",
              maxHeight: 500,
              background: "rgba(0,0,0,0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(0,230,118,0.3)",
              borderRadius: "1.5rem",
              boxShadow:
                "0 0 30px rgba(0,230,118,0.15), 0 8px 48px rgba(0,0,0,0.8)",
              overflow: "hidden",
            }}
            data-ocid="chatbot.modal"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #00E676 0%, #00C853 100%)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐢</span>
                <span className="font-bold text-black text-sm tracking-wide">
                  Task Turtle Support
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-black/20"
                style={{ color: "#000", fontWeight: 700 }}
                data-ocid="chatbot.close_button"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2"
              style={{ minHeight: 0 }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className="px-3 py-2 rounded-2xl text-sm max-w-[85%] leading-relaxed"
                    style={
                      msg.type === "user"
                        ? {
                            background:
                              "linear-gradient(135deg, #00E676 0%, #00C853 100%)",
                            color: "#000",
                            fontWeight: 600,
                            borderRadius: "1.2rem 1.2rem 0.2rem 1.2rem",
                          }
                        : {
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(0,230,118,0.15)",
                            color: "rgba(255,255,255,0.9)",
                            borderRadius: "1.2rem 1.2rem 1.2rem 0.2rem",
                          }
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Quick reply option buttons */}
              <div className="mt-2 flex flex-wrap gap-2">
                {AUTO_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleOption(opt)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer"
                    style={{
                      border: "1px solid rgba(0,230,118,0.4)",
                      color: "#00E676",
                      background: "rgba(0,230,118,0.05)",
                    }}
                    onMouseEnter={(e) =>
                      handleBtnHover(
                        e,
                        "rgba(0,230,118,0.18)",
                        "rgba(0,230,118,0.8)",
                      )
                    }
                    onMouseLeave={(e) =>
                      handleBtnHover(
                        e,
                        "rgba(0,230,118,0.05)",
                        "rgba(0,230,118,0.4)",
                      )
                    }
                    data-ocid={`chatbot.${opt.label.toLowerCase().replace(/\s+/g, "-")}.button`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Support Footer */}
            <div
              className="flex-shrink-0 px-4 py-3"
              style={{
                borderTop: "1px solid rgba(0,230,118,0.1)",
                background: "rgba(0,230,118,0.03)",
              }}
            >
              <div className="flex flex-col gap-0.5">
                <a
                  href="tel:9693420811"
                  className="text-xs flex items-center gap-1.5 transition-colors"
                  style={{ color: "rgba(0,230,118,0.7)" }}
                  onMouseEnter={(e) => handleLinkHover(e, "#00E676")}
                  onMouseLeave={(e) =>
                    handleLinkHover(e, "rgba(0,230,118,0.7)")
                  }
                >
                  <span>📞</span> 9693420811
                </a>
                <a
                  href="mailto:support.taskturtle@gmail.com"
                  className="text-xs flex items-center gap-1.5 transition-colors"
                  style={{ color: "rgba(0,230,118,0.7)" }}
                  onMouseEnter={(e) => handleLinkHover(e, "#00E676")}
                  onMouseLeave={(e) =>
                    handleLinkHover(e, "rgba(0,230,118,0.7)")
                  }
                >
                  <span>✉️</span> support.taskturtle@gmail.com
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
