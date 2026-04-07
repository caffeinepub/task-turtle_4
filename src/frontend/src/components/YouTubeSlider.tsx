import { useCallback, useEffect, useRef, useState } from "react";

const YT_API_KEY = "AIzaSyAZIDVP-08VUxVzNIYALm7JKzAHuW_M0SU";
const CHANNEL_HANDLE = "taskturtle";
const SLIDE_INTERVAL = 3000;
const GAP = 16;

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
      height={Math.round((size * 20) / 28)}
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

/**
 * Step 1: Resolve channel ID AND uploads playlist ID in a single API call.
 * Uses the channels endpoint with forHandle (1 quota unit, no 403 issues).
 */
async function resolveChannelAndPlaylist(
  handle: string,
): Promise<{ channelId: string; uploadsPlaylistId: string } | null> {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=id,contentDetails&forHandle=${handle}&key=${YT_API_KEY}`;
  console.log("[YouTubeSlider] Step 1 — resolveChannelAndPlaylist URL:", url);
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    console.log("[YouTubeSlider] Step 1 response:", JSON.stringify(data));
    if (data.error) {
      console.error(
        `[YouTubeSlider] Step 1 API error ${data.error.code}: ${data.error.message}`,
        data.error,
      );
      return null;
    }
    const item = data?.items?.[0];
    if (!item) {
      console.warn(
        "[YouTubeSlider] Step 1: no channel found for handle:",
        handle,
      );
      return null;
    }
    const channelId: string = item.id;
    const uploadsPlaylistId: string =
      item.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) {
      console.warn("[YouTubeSlider] Step 1: uploads playlist ID not found");
      return null;
    }
    console.log("[YouTubeSlider] Step 1 resolved:", {
      channelId,
      uploadsPlaylistId,
    });
    return { channelId, uploadsPlaylistId };
  } catch (err) {
    console.error("[YouTubeSlider] Step 1 fetch error:", err);
    return null;
  }
}

/**
 * Step 2: Fetch latest videos from the uploads playlist.
 * Uses playlistItems endpoint (1 quota unit vs 100 for search — no 403 issues).
 */
async function fetchVideosFromPlaylist(
  uploadsPlaylistId: string,
): Promise<YTVideo[]> {
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=9&key=${YT_API_KEY}`;
  console.log("[YouTubeSlider] Step 2 — fetchVideosFromPlaylist URL:", url);
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  console.log("[YouTubeSlider] Step 2 response:", JSON.stringify(data));
  if (data.error) {
    console.error(
      `[YouTubeSlider] Step 2 API error ${data.error.code}: ${data.error.message}`,
      data.error,
    );
    throw new Error(
      `YouTube API error ${data.error.code}: ${data.error.message}`,
    );
  }
  if (!data.items || data.items.length === 0) {
    console.warn("[YouTubeSlider] Step 2: no items in playlistItems response");
    return [];
  }

  const videos: YTVideo[] = data.items
    .filter(
      (item: {
        snippet: {
          title: string;
          publishedAt: string;
          resourceId: { videoId: string };
          thumbnails: Record<string, { url: string }>;
        };
      }) => {
        // Skip deleted or private videos
        const t = item.snippet?.title;
        return t !== "Deleted video" && t !== "Private video";
      },
    )
    .map(
      (item: {
        snippet: {
          title: string;
          publishedAt: string;
          resourceId: { videoId: string };
          thumbnails: {
            maxres?: { url: string };
            standard?: { url: string };
            high?: { url: string };
            medium?: { url: string };
            default?: { url: string };
          };
        };
      }) => {
        const videoId = item.snippet.resourceId.videoId;
        const thumbs = item.snippet.thumbnails;
        const thumbnail =
          thumbs?.maxres?.url ||
          thumbs?.standard?.url ||
          thumbs?.high?.url ||
          thumbs?.medium?.url ||
          thumbs?.default?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        return {
          videoId,
          title: item.snippet.title,
          thumbnail,
          publishedAt: item.snippet.publishedAt,
        };
      },
    );

  console.log(`[YouTubeSlider] Step 2 loaded ${videos.length} videos`);
  return videos;
}

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

export function YouTubeSlider() {
  const [videos, setVideos] = useState<YTVideo[]>([]);
  const [uploadsPlaylistId, setUploadsPlaylistId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // current index into loopedVideos
  const [current, setCurrent] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Container ref for measuring card width
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetPendingRef = useRef(false);

  // Step 1: Resolve channel + uploads playlist ID
  useEffect(() => {
    resolveChannelAndPlaylist(CHANNEL_HANDLE).then((result) => {
      if (result) {
        setUploadsPlaylistId(result.uploadsPlaylistId);
      } else {
        setLoading(false);
        setError(
          "Could not resolve YouTube channel. Check console for API response details.",
        );
      }
    });
  }, []);

  // Step 2: Load videos from playlist
  const loadVideos = useCallback(async (playlistId: string) => {
    try {
      setError(null);
      const vids = await fetchVideosFromPlaylist(playlistId);
      if (vids.length === 0) {
        setError(
          "No videos found on the TaskTurtle YouTube channel yet. Check console for API response details.",
        );
      } else {
        setVideos(vids);
      }
    } catch (err) {
      console.error("[YouTubeSlider] fetchVideosFromPlaylist error:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load videos. Please try again later.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!uploadsPlaylistId) return;
    loadVideos(uploadsPlaylistId);
    refreshRef.current = setInterval(
      () => loadVideos(uploadsPlaylistId),
      5 * 60 * 1000,
    );
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [uploadsPlaylistId, loadVideos]);

  // Measure container and compute card width
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      const cols =
        window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3;
      setCardWidth((w - GAP * (cols - 1)) / cols);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Re-measure after videos load so containerRef is in DOM
  useEffect(() => {
    if (videos.length === 0) return;
    if (!containerRef.current) return;
    const w = containerRef.current.offsetWidth;
    const cols = window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3;
    setCardWidth((w - GAP * (cols - 1)) / cols);
  }, [videos.length]);

  // Infinite loop: triplicate videos, start in middle copy
  const loopedVideos =
    videos.length > 0 ? [...videos, ...videos, ...videos] : [];
  const startIndex = videos.length; // middle copy start

  // Initialize current to middle copy when videos load
  useEffect(() => {
    if (videos.length > 0) {
      setCurrent(videos.length);
    }
  }, [videos.length]);

  // Handle infinite loop reset after transition ends
  const handleTransitionEnd = useCallback(() => {
    if (!resetPendingRef.current) return;
    resetPendingRef.current = false;
    setNoTransition(true);
    setCurrent((prev) => {
      // if we've gone past the 3rd copy start, reset to middle copy
      if (prev >= videos.length * 2) {
        return prev - videos.length;
      }
      // if we've gone before the middle copy, reset to 3rd copy equivalent
      if (prev < videos.length) {
        return prev + videos.length;
      }
      return prev;
    });
    // Re-enable transition after a microtask
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setNoTransition(false);
      });
    });
  }, [videos.length]);

  const goNextRef = useRef(() => {});
  goNextRef.current = () => {
    setCurrent((prev) => {
      const next = prev + 1;
      if (next >= videos.length * 2) {
        resetPendingRef.current = true;
      }
      return next;
    });
  };

  function goNext() {
    goNextRef.current();
  }

  function goPrev() {
    setCurrent((prev) => {
      const next = prev - 1;
      if (next < videos.length) {
        resetPendingRef.current = true;
      }
      return next;
    });
  }

  function goToDot(dotIndex: number) {
    setCurrent(startIndex + dotIndex);
  }

  // Auto-slide — uses a ref for goNext to avoid stale closure issues
  useEffect(() => {
    if (isPaused || videos.length === 0 || cardWidth === 0) return;
    intervalRef.current = setInterval(
      () => goNextRef.current(),
      SLIDE_INTERVAL,
    );
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, videos.length, cardWidth]);

  // Touch swipe
  const touchStartX = useRef(0);
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  }

  const translateX = current * (cardWidth + GAP);
  const activeDot =
    videos.length > 0
      ? (((current - startIndex) % videos.length) + videos.length) %
        videos.length
      : 0;

  return (
    <section
      id="youtube-videos"
      className="py-16 md:py-24 relative overflow-hidden"
      style={{ background: "#000" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,230,118,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-8 relative">
        {/* Section heading */}
        <div className="flex flex-col items-center text-center mb-10 md:mb-14">
          <div className="flex items-center gap-3 mb-3">
            <YouTubeLogo size={34} />
            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
              Know More About Task Turtle
            </h2>
          </div>
          <p className="text-white/40 text-sm max-w-md">
            Watch our latest videos and learn how Task Turtle works for you.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{
                borderColor: "rgba(0,230,118,0.2)",
                borderTopColor: "#00E676",
              }}
            />
          </div>
        )}

        {/* Error */}
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
            {uploadsPlaylistId && (
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  loadVideos(uploadsPlaylistId);
                }}
                className="mt-4 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:opacity-80"
                style={{
                  background: "rgba(0,230,118,0.15)",
                  border: "1px solid rgba(0,230,118,0.4)",
                  color: "#00E676",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Slider */}
        {!loading && !error && videos.length > 0 && (
          <>
            <div className="relative">
              {/* Prev button */}
              <button
                type="button"
                aria-label="Previous video"
                onClick={goPrev}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 rounded-full items-center justify-center transition-all duration-200 hover:scale-110"
                style={{
                  background: "rgba(0,0,0,0.7)",
                  border: "1.5px solid rgba(0,230,118,0.35)",
                  boxShadow: "0 0 12px rgba(0,230,118,0.15)",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  role="img"
                  aria-label="Previous"
                >
                  <title>Previous</title>
                  <path
                    d="M10 3L5 8L10 13"
                    stroke="#00E676"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Next button */}
              <button
                type="button"
                aria-label="Next video"
                onClick={goNext}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-10 h-10 rounded-full items-center justify-center transition-all duration-200 hover:scale-110"
                style={{
                  background: "rgba(0,0,0,0.7)",
                  border: "1.5px solid rgba(0,230,118,0.35)",
                  boxShadow: "0 0 12px rgba(0,230,118,0.15)",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  role="img"
                  aria-label="Next"
                >
                  <title>Next</title>
                  <path
                    d="M6 3L11 8L6 13"
                    stroke="#00E676"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Overflow container (measured) */}
              <div
                ref={containerRef}
                className="overflow-hidden"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                {/* Track */}
                <div
                  className="flex"
                  style={{
                    gap: GAP,
                    transform: `translateX(-${translateX}px)`,
                    transition: noTransition
                      ? "none"
                      : "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
                    willChange: "transform",
                  }}
                  onTransitionEnd={handleTransitionEnd}
                >
                  {loopedVideos.map((video, idx) => (
                    <a
                      // biome-ignore lint/suspicious/noArrayIndexKey: looped array, index is stable
                      key={idx}
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 group block"
                      style={{
                        width: cardWidth > 0 ? cardWidth : undefined,
                        minWidth: cardWidth > 0 ? cardWidth : undefined,
                      }}
                    >
                      <div
                        className="rounded-2xl overflow-hidden border h-full transition-all duration-300"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderColor: "rgba(0,230,118,0.12)",
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.boxShadow = "0 0 32px rgba(0,230,118,0.2)";
                          el.style.borderColor = "rgba(0,230,118,0.35)";
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.boxShadow = "none";
                          el.style.borderColor = "rgba(0,230,118,0.12)";
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          className="relative overflow-hidden"
                          style={{ aspectRatio: "16/9" }}
                        >
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
                              className="w-12 h-12 rounded-full flex items-center justify-center"
                              style={{
                                background: "rgba(255,0,0,0.9)",
                                boxShadow: "0 0 24px rgba(255,0,0,0.5)",
                              }}
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="white"
                                role="img"
                                aria-label="Play"
                              >
                                <title>Play</title>
                                <path d="M5 3.5L15 9L5 14.5V3.5Z" />
                              </svg>
                            </div>
                          </div>
                          {/* YT badge */}
                          <div className="absolute top-2 right-2">
                            <YouTubeLogo size={20} />
                          </div>
                        </div>

                        {/* Title */}
                        <div className="p-3">
                          <p
                            className="text-white text-sm font-semibold leading-snug group-hover:text-[#00E676] transition-colors duration-200"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              minHeight: "2.6em",
                            }}
                          >
                            {video.title}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-2 mt-8">
              {videos.map((_, i) => (
                <button
                  // biome-ignore lint/suspicious/noArrayIndexKey: index is stable dot position
                  key={i}
                  type="button"
                  aria-label={`Go to video ${i + 1}`}
                  onClick={() => goToDot(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: activeDot === i ? 24 : 8,
                    height: 8,
                    background:
                      activeDot === i ? "#00E676" : "rgba(255,255,255,0.2)",
                    boxShadow:
                      activeDot === i ? "0 0 10px rgba(0,230,118,0.6)" : "none",
                    cursor: "pointer",
                    border: "none",
                    padding: 0,
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
