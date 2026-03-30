import { useEffect, useRef, useState } from "react";

const MUMBAI_AREAS = [
  { name: "Bandra", x: 22, y: 62 },
  { name: "Andheri", x: 45, y: 24 },
  { name: "Dadar", x: 35, y: 49 },
  { name: "Kurla", x: 60, y: 39 },
  { name: "Thane", x: 75, y: 14 },
  { name: "Borivali", x: 55, y: 66 },
  { name: "Malad", x: 30, y: 32 },
];

const VERTICAL_LINES = [
  8.33, 16.66, 24.99, 33.32, 41.65, 49.98, 58.31, 66.64, 74.97, 83.3, 91.63,
  99.96,
];
const HORIZONTAL_LINES = [12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];

interface Turtle {
  id: number;
  x: number;
  y: number;
}

const INITIAL_TURTLES: Turtle[] = [
  { id: 1, x: 22, y: 68 },
  { id: 2, x: 45, y: 30 },
  { id: 3, x: 35, y: 55 },
  { id: 4, x: 60, y: 45 },
  { id: 5, x: 75, y: 20 },
  { id: 6, x: 55, y: 72 },
  { id: 7, x: 30, y: 38 },
];

export function LiveMap() {
  const [turtles, setTurtles] = useState<Turtle[]>(INITIAL_TURTLES);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTurtles((prev) =>
        prev.map((t) => ({
          ...t,
          x: Math.max(5, Math.min(92, t.x + (Math.random() - 0.5) * 3)),
          y: Math.max(5, Math.min(92, t.y + (Math.random() - 0.5) * 3)),
        })),
      );
    }, 1500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes turtlePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
        @keyframes blinkDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .turtle-ring {
          animation: turtlePulse 1.8s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
      `}</style>

      <section
        className="py-16 px-4"
        style={{ background: "#000000" }}
        data-ocid="livemap.section"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h2
                className="text-4xl font-bold text-white mb-2"
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  letterSpacing: "-0.02em",
                }}
              >
                Live Turtle Activity
              </h2>
              <p className="text-gray-400 text-base">
                Track active runners in your area
              </p>
            </div>

            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full self-start sm:self-auto"
              style={{
                background: "rgba(0,230,118,0.08)",
                border: "1px solid rgba(0,230,118,0.25)",
              }}
              data-ocid="livemap.success_state"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
                  boxShadow: "0 0 6px #00E676",
                  animation: "blinkDot 1.4s ease-in-out infinite",
                  display: "inline-block",
                }}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: "#00E676" }}
              >
                {turtles.length} Active Now
              </span>
            </div>
          </div>

          {/* Map container */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              height: "480px",
              border: "1px solid rgba(0,230,118,0.2)",
              boxShadow:
                "0 0 40px rgba(0,230,118,0.05), 0 8px 32px rgba(0,0,0,0.6)",
              background: "#0a1628",
            }}
            data-ocid="livemap.canvas_target"
          >
            <svg
              width="100%"
              height="100%"
              style={{ position: "absolute", inset: 0 }}
              aria-label="Live map of Mumbai with active turtle runners"
              role="img"
            >
              {/* Vertical grid lines */}
              {VERTICAL_LINES.map((pct) => (
                <line
                  key={`v-${pct}`}
                  x1={`${pct}%`}
                  y1="0"
                  x2={`${pct}%`}
                  y2="100%"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="1"
                />
              ))}
              {/* Horizontal grid lines */}
              {HORIZONTAL_LINES.map((pct) => (
                <line
                  key={`h-${pct}`}
                  x1="0"
                  y1={`${pct}%`}
                  x2="100%"
                  y2={`${pct}%`}
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="1"
                />
              ))}

              {/* Simulated road lines */}
              <line
                x1="0"
                y1="40%"
                x2="100%"
                y2="42%"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="2"
              />
              <line
                x1="0"
                y1="65%"
                x2="100%"
                y2="63%"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1.5"
              />
              <line
                x1="30%"
                y1="0"
                x2="32%"
                y2="100%"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="2"
              />
              <line
                x1="60%"
                y1="0"
                x2="62%"
                y2="100%"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1.5"
              />
              <line
                x1="15%"
                y1="0"
                x2="55%"
                y2="100%"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="1"
              />
              <line
                x1="45%"
                y1="0"
                x2="80%"
                y2="100%"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="1"
              />

              {/* Area labels */}
              {MUMBAI_AREAS.map((area) => (
                <text
                  key={area.name}
                  x={`${area.x}%`}
                  y={`${area.y}%`}
                  fill="rgba(255,255,255,0.12)"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  letterSpacing="1"
                >
                  {area.name.toUpperCase()}
                </text>
              ))}

              {/* Turtle markers */}
              {turtles.map((turtle) => (
                <g key={turtle.id}>
                  <circle
                    className="turtle-ring"
                    cx={`${turtle.x}%`}
                    cy={`${turtle.y}%`}
                    r="10"
                    fill="none"
                    stroke="#00E676"
                    strokeWidth="1.5"
                    opacity="0.4"
                    style={{ animationDelay: `${(turtle.id * 0.3) % 1.8}s` }}
                  />
                  <circle
                    cx={`${turtle.x}%`}
                    cy={`${turtle.y}%`}
                    r="5"
                    fill="#00E676"
                    style={{
                      filter:
                        "drop-shadow(0 0 6px #00E676) drop-shadow(0 0 12px rgba(0,230,118,0.5))",
                      transition: "cx 1.4s ease-in-out, cy 1.4s ease-in-out",
                    }}
                  />
                  <text
                    x={`${turtle.x}%`}
                    y={`${turtle.y + 3.5}%`}
                    textAnchor="middle"
                    fill="#00E676"
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="Inter, sans-serif"
                    dy="8"
                  >
                    🐢 #{turtle.id}
                  </text>
                </g>
              ))}
            </svg>

            {/* Glassmorphic overlay badge */}
            <div
              className="absolute top-4 right-4 flex flex-col items-center gap-1 px-4 py-3 rounded-xl"
              style={{
                background: "rgba(0,0,0,0.72)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(0,230,118,0.2)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                zIndex: 10,
                minWidth: "100px",
              }}
              data-ocid="livemap.panel"
            >
              <span
                className="text-3xl font-bold"
                style={{ color: "#00E676", fontVariantNumeric: "tabular-nums" }}
              >
                {turtles.length}
              </span>
              <span className="text-xs text-gray-400 text-center leading-tight">
                Turtles Online
              </span>
            </div>

            {/* Mumbai label */}
            <div
              className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg"
              style={{
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(0,230,118,0.12)",
              }}
            >
              <p className="text-white/50 text-xs font-medium">
                📍 Mumbai, India
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
