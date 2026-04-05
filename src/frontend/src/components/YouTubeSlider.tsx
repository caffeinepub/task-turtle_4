import { useCallback, useEffect, useRef, useState } from "react";

const YT_API_KEY = "AIzaSyAZIDVP-08VUxVzNIYALm7JKzAHuW_M0SU";
// Channel ID for @taskturtle (resolved from handle)
const CHANNEL_HANDLE = "taskturtle";

interface YTVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

function YouTubeLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={(size * 20) / 28}
      viewBox="0 0 28 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="YouTube"
    >
      <title>YouTube</title>
      <rect width="28" height="20" rx="5" fill="#FF0000" />
      <path d="M11.5 6L19 10L11.5 14V6Z" fill="white" />
    </svg>
  );
}

async function resolveChannelId(handle: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handle}&key=${YT_API_KEY}`,
    );
    const data = await res.json();
    return data?.items?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function fetchLatestVideos(channelId: string): Promise<YTVideo[]> {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=6&order=date&type=video&key=${YT_API_KEY}`,
  );
  const data = await res.json();
  if (!data.items) return [];
  return data.items.map(
    (item: {
      id: { videoId: string };
      snippet: {
        title: string;
        publishedAt: string;
        thumbnails: {
          maxres?: { url: string };
          high?: { url: string };
          default?: { url: string };
        };
      };
    }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      // Prefer maxres, fallback to high, then standard
      thumbnail:
        item.snippet.thumbnails?.maxres?.url ||
        `https://i.ytimg.com/vi/${item.id.videoId}/maxresdefault.jpg`,
      publishedAt: item.snippet.publishedAt,
    }),
  );
}

const GREEN = "#00E676";
const SLIDE_INTERVAL = 3000;

export function YouTubeSlider() {
  const [videos, setVideos] = useState<YTVideo[]>([]);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resolve channel ID on mount
  useEffect(() => {
    resolveChannelId(CHANNEL_HANDLE).then((id) => {
      if (id) setChannelId(id);
      else
        setError(
          "Could not find YouTube channel. Please check the channel handle.",
        );
    });
  }, []);

  // Fetch videos when channelId is available, and auto-refresh every 5 min
  const loadVideos = useCallback(async (chId: string) => {
    try {
      setError(null);
      const vids = await fetchLatestVideos(chId);
      if (vids.length === 0) {
        setError("No videos found on this channel yet.");
      } else {
        setVideos(vids);
        setCurrent(0);
      }
    } catch {
      setError("Failed to load videos. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!channelId) return;
    loadVideos(channelId);
    // Auto-refresh every 5 minutes
    refreshRef.current = setInterval(
      () => loadVideos(channelId),
      5 * 60 * 1000,
    );
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [channelId, loadVideos]);

  // Visible count based on viewport (tracked via state)
  const [visibleCount, setVisibleCount] = useState(3);
  useEffect(() => {
    function updateVisible() {
      const w = window.innerWidth;
      if (w < 640) setVisibleCount(1);
      else if (w < 1024) setVisibleCount(2);
      else setVisibleCount(3);
    }
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  const maxIndex = Math.max(0, videos.length - visibleCount);

  // Auto-slide
  useEffect(() => {
    if (isPaused || videos.length === 0) return;
    intervalRef.current = setInterval(() => {
      setIsTransitioning(true);
      setCurrent((prev) => {
        const next = prev + 1;
        if (next > maxIndex) return 0;
        return next;
      });
      setTimeout(() => setIsTransitioning(false), 400);
    }, SLIDE_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, videos.length, maxIndex]);

  function goTo(idx: number) {
    setIsTransitioning(true);
    setCurrent(Math.max(0, Math.min(idx, maxIndex)));
    setTimeout(() => setIsTransitioning(false), 400);
  }

  // Thumbnail fallback
  function handleThumbError(
    e: React.SyntheticEvent<HTMLImageElement>,
    videoId: string,
  ) {
    const el = e.currentTarget;
    const src = el.src;
    if (src.includes("maxresdefault")) {
      el.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    } else if (src.includes("hqdefault")) {
      el.src = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    }
  }

  return (
    <section
      id="youtube-videos"
      className="py-24 relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,230,118,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-[1200px] mx-auto px-6 relative">
        {/* Heading */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="flex items-center gap-3 mb-4">
            <YouTubeLogo size={32} />
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: GREEN }}
            >
              Our Channel
            </p>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Know more about TaskTurtle
          </h2>
          <p className="text-white/50 mt-3 max-w-md text-sm">
            Watch our latest videos and learn how Task Turtle works for you.
          </p>
        </div>

        {/* States */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{
                borderColor: "rgba(0,230,118,0.2)",
                borderTopColor: GREEN,
              }}
            />
          </div>
        )}

        {error && !loading && (
          <div
            className="text-center py-12 rounded-2xl border"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,80,80,0.2)",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            <YouTubeLogo size={40} />
            <p className="mt-4 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && videos.length > 0 && (
          <>
            {/* Slider track */}
            <div className="relative overflow-hidden">
              <div
                className="flex gap-5"
                style={{
                  transform: `translateX(calc(-${current * (100 / visibleCount)}% - ${current * (20 / visibleCount)}px))`,
                  transition: isTransitioning
                    ? "transform 0.4s cubic-bezier(0.4,0,0.2,1)"
                    : "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
                  width: `calc(${videos.length * (100 / visibleCount)}% + ${(videos.length - 1) * 20}px)`,
                }}
              >
                {videos.map((video) => (
                  <a
                    key={video.videoId}
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 group cursor-pointer block"
                    style={{
                      width: `calc(${100 / visibleCount}% - ${(20 * (visibleCount - 1)) / visibleCount}px)`,
                    }}
                  >
                    <div
                      className="rounded-2xl overflow-hidden border transition-all duration-300 group-hover:shadow-[0_0_32px_rgba(0,230,118,0.18)] group-hover:border-[rgba(0,230,118,0.35)]"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        borderColor: "rgba(0,230,118,0.12)",
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => handleThumbError(e, video.videoId)}
                        />
                        {/* Play overlay */}
                        <div
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ background: "rgba(0,0,0,0.45)" }}
                        >
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center"
                            style={{
                              background: "rgba(255,0,0,0.85)",
                              boxShadow: "0 0 24px rgba(255,0,0,0.5)",
                            }}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="white"
                              role="img"
                              aria-label="Play"
                            >
                              <title>Play</title>
                              <path d="M6 4l12 6-12 6V4z" />
                            </svg>
                          </div>
                        </div>
                        {/* YT badge */}
                        <div className="absolute top-2 right-2">
                          <YouTubeLogo size={22} />
                        </div>
                      </div>
                      {/* Title */}
                      <div className="p-4">
                        <p className="text-white font-semibold text-sm leading-snug line-clamp-2 group-hover:text-[#00E676] transition-colors duration-200">
                          {video.title}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Dot indicators */}
            {maxIndex > 0 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                  <button
                    // biome-ignore lint/suspicious/noArrayIndexKey: index is stable here
                    key={i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => goTo(i)}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: current === i ? 24 : 8,
                      height: 8,
                      background:
                        current === i ? GREEN : "rgba(255,255,255,0.2)",
                      boxShadow: current === i ? `0 0 10px ${GREEN}80` : "none",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Pause indicator */}
            {isPaused && (
              <p className="text-center text-white/20 text-xs mt-4">Paused</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
