import {
  Box,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Tag,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { type PublicTask, TaskStatus, type UserProfile } from "../backend";
import { AppNavbar } from "../components/AppNavbar";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { getTaskerEarning } from "../utils/platformFee";

const GREEN = "#00E676";

type WorkStage = 1 | 2 | 3 | 4 | 5;

const STAGE_LABELS: Record<WorkStage, string> = {
  1: "Accepted",
  2: "On the Way",
  3: "Arrived",
  4: "Enter OTP",
  5: "Verified ✓",
};

/** Map backend stage string to numeric WorkStage */
function backendStageToWork(stage: string | null): WorkStage {
  if (!stage) return 1;
  switch (stage) {
    case "on_the_way":
      return 2;
    case "arrived":
      return 3;
    case "verified":
    case "delivered":
      return 5;
    default:
      return 1; // "posted" | "accepted"
  }
}

function ActiveTaskCard({
  task,
  onComplete,
}: { task: PublicTask; onComplete: () => void }) {
  const [stage, setStage] = useState<WorkStage>(1);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [posterProfile, setPosterProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const { actor } = useActor();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch initial stage + profile, then poll stage every 3s
  useEffect(() => {
    if (!actor) return;

    const fetchStage = async () => {
      try {
        const res = await actor.getTaskStage(task.id);
        if (res) setStage(backendStageToWork(res.stage));
      } catch (_) {
        // keep last known stage
      }
    };

    const fetchProfile = async () => {
      try {
        const profiles = await actor.getTaskParticipantProfiles(task.id);
        if (profiles?.posterProfile) {
          setPosterProfile(profiles.posterProfile);
        }
      } catch (_) {
        // profile unavailable
      } finally {
        setProfileLoading(false);
      }
    };

    // Initial fetch
    Promise.all([fetchStage(), fetchProfile()]);

    // Poll stage every 3s
    intervalRef.current = setInterval(fetchStage, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [actor, task.id]);

  async function advanceStage(newStage: WorkStage, backendStage: string) {
    if (!actor || advancing) return;
    setAdvancing(true);
    // Optimistic update
    setStage(newStage);
    try {
      await actor.advanceTaskStage(task.id, backendStage);
    } catch (_) {
      // keep optimistic
    } finally {
      setAdvancing(false);
    }
  }

  async function handleVerifyOtp() {
    if (!actor || otp.length !== 6) return;
    setVerifying(true);
    setOtpError("");
    try {
      const result = await actor.completeTask(task.id, otp);
      if (result) {
        setStage(5);
        onComplete();
      } else {
        setOtpError("Invalid OTP. Please check with the customer.");
      }
    } catch (_) {
      setOtpError("Verification failed. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  const earning = getTaskerEarning(Number(task.amount));

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{
        background: "rgba(0,230,118,0.04)",
        border: `1px solid ${GREEN}25`,
      }}
    >
      {/* Customer Details Card */}
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${GREEN}20`,
        }}
        data-ocid="taskerpage.customer.card"
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: `${GREEN}20`, border: `1px solid ${GREEN}35` }}
          >
            <User size={13} style={{ color: GREEN }} />
          </div>
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: GREEN }}
          >
            Customer Details
          </p>
        </div>

        {profileLoading ? (
          <div className="flex items-center gap-2 py-1">
            <Loader2
              size={13}
              className="animate-spin"
              style={{ color: GREEN }}
            />
            <span
              className="text-xs"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Loading customer info\u2026
            </span>
          </div>
        ) : posterProfile ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Name
                </p>
                <p className="text-sm font-semibold text-white">
                  {posterProfile.name}
                </p>
              </div>
              <div>
                <p
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Phone
                </p>
                <p className="text-sm font-semibold" style={{ color: GREEN }}>
                  {posterProfile.phone}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Address
              </p>
              <p className="text-sm font-semibold text-white">
                {posterProfile.location}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Task
              </p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                &ldquo;{task.title}
                {task.description ? ` — ${task.description}` : ""}&rdquo;
              </p>
            </div>
            {/* Call Customer button */}
            <a
              href={`tel:${posterProfile.phone}`}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background:
                  "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
                color: "#000000",
                boxShadow: `0 0 14px ${GREEN}30`,
                textDecoration: "none",
              }}
              data-ocid="taskerpage.call_customer.button"
            >
              <Phone size={14} />📞 Call Customer
            </a>
          </div>
        ) : (
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            Customer details not available
          </p>
        )}
      </div>

      {/* Task info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm truncate">
            {task.title}
          </h3>
          {task.description && (
            <p
              className="text-xs mt-1"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {task.category && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: GREEN }}
              >
                <Tag size={10} />
                {task.category}
              </span>
            )}
            {task.location && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                <MapPin size={10} />
                {task.location}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-white font-bold">₹{Number(task.amount)}</div>
          <div className="text-xs font-semibold" style={{ color: GREEN }}>
            You earn ₹{earning}
          </div>
        </div>
      </div>

      {/* Stage progress bar */}
      <div className="flex items-center gap-0">
        {([1, 2, 3, 4, 5] as WorkStage[]).map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: stage >= s ? GREEN : "rgba(255,255,255,0.08)",
                color: stage >= s ? "#000000" : "rgba(255,255,255,0.3)",
                boxShadow: stage === s ? `0 0 10px ${GREEN}60` : "none",
                transition: "all 0.3s",
              }}
            >
              {stage > s ? <CheckCircle2 size={12} /> : s}
            </div>
            {i < 4 && (
              <div
                className="flex-1 h-0.5 mx-1"
                style={{
                  background: stage > s ? GREEN : "rgba(255,255,255,0.08)",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        ))}
      </div>
      <div
        className="text-xs font-semibold"
        style={{ color: stage === 5 ? GREEN : "rgba(255,255,255,0.6)" }}
      >
        {STAGE_LABELS[stage]}
      </div>

      {/* Action */}
      <AnimatePresence mode="wait">
        {stage === 1 && (
          <motion.button
            key="s1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            onClick={() => advanceStage(2, "on_the_way")}
            disabled={advancing}
            className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{
              background: `${GREEN}20`,
              color: GREEN,
              border: `1px solid ${GREEN}35`,
            }}
            data-ocid="taskerpage.on_the_way.button"
          >
            {advancing ? (
              <Loader2 size={13} className="animate-spin inline mr-1.5" />
            ) : null}
            🚴 Mark On the Way
          </motion.button>
        )}
        {stage === 2 && (
          <motion.button
            key="s2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            onClick={() => advanceStage(3, "arrived")}
            disabled={advancing}
            className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{
              background:
                "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
              color: "#000000",
              boxShadow: `0 0 14px ${GREEN}40`,
            }}
            data-ocid="taskerpage.arrived.button"
          >
            {advancing ? (
              <Loader2 size={13} className="animate-spin inline mr-1.5" />
            ) : null}
            📍 Mark Arrived
          </motion.button>
        )}
        {stage === 3 && (
          <motion.button
            key="s3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            type="button"
            onClick={() => setStage(4)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background:
                "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
              color: "#000000",
              boxShadow: `0 0 14px ${GREEN}40`,
            }}
            data-ocid="taskerpage.enter_otp.button"
          >
            🔐 Enter Delivery OTP
          </motion.button>
        )}
        {stage === 4 && (
          <motion.div
            key="s4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              Ask the customer for their 6-digit delivery OTP
            </p>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ""));
                setOtpError("");
              }}
              placeholder="Enter 6-digit OTP"
              className="w-full px-4 py-3 rounded-xl text-white font-mono text-center text-lg tracking-widest outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${otp.length === 6 ? GREEN : "rgba(255,255,255,0.12)"}`,
              }}
              data-ocid="taskerpage.otp.input"
            />
            {otpError && (
              <p
                className="text-xs"
                style={{ color: "#ff4d4f" }}
                data-ocid="taskerpage.otp.error_state"
              >
                {otpError}
              </p>
            )}
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || verifying}
              className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{
                background:
                  "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
                color: "#000000",
              }}
              data-ocid="taskerpage.verify_otp.submit_button"
            >
              {verifying ? (
                <Loader2 size={14} className="animate-spin inline mr-2" />
              ) : null}
              {verifying ? "Verifying..." : "Verify & Complete"}
            </button>
          </motion.div>
        )}
        {stage === 5 && (
          <motion.div
            key="s5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-sm font-bold"
            style={{ color: GREEN }}
          >
            <CheckCircle2 size={16} /> Task completed! Earnings: ₹{earning}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AvailableTaskCard({
  task,
  onAccept,
  accepting,
}: {
  task: PublicTask;
  onAccept: (id: string) => void;
  accepting: string | null;
}) {
  const earning = getTaskerEarning(Number(task.amount));
  const isAccepting = accepting === task.id;
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(0,230,118,0.12)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm">{task.title}</h3>
          {task.description && (
            <p
              className="text-xs mt-1"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {task.description}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold" style={{ color: GREEN }}>
            ₹{Number(task.amount)}
          </div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            You earn ₹{earning}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {task.category && (
          <span
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{
              background: `${GREEN}15`,
              color: GREEN,
              border: `1px solid ${GREEN}25`,
            }}
          >
            <Tag size={9} />
            {task.category}
          </span>
        )}
        {task.location && (
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <MapPin size={10} />
            {task.location}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <span
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{
            background: `${GREEN}15`,
            color: GREEN,
            border: `1px solid ${GREEN}30`,
          }}
        >
          <Phone size={10} /> Contact Customer
        </span>
        <button
          type="button"
          onClick={() => onAccept(task.id)}
          disabled={isAccepting}
          className="flex-1 max-w-[180px] py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{
            background:
              "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
            color: "#000000",
            boxShadow: `0 0 12px ${GREEN}30`,
          }}
          data-ocid="taskerpage.accept_task.button"
        >
          {isAccepting ? (
            <Loader2 size={14} className="animate-spin inline mr-1" />
          ) : null}
          {isAccepting ? "Accepting..." : "Accept Task"}
        </button>
      </div>
    </div>
  );
}

export function TaskerPage() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const [availableTasks, setAvailableTasks] = useState<PublicTask[]>([]);
  const [myTasks, setMyTasks] = useState<PublicTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const myPrincipal = identity?.getPrincipal().toString();

  useEffect(() => {
    if (!actor || isFetching) return;
    Promise.all([actor.getAllTasks(), actor.getMyAcceptedTasks()])
      .then(([all, mine]) => {
        setAvailableTasks(
          all.filter(
            (t) =>
              t.status === TaskStatus.open &&
              t.poster.toString() !== myPrincipal,
          ),
        );
        setMyTasks(mine);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor, isFetching, myPrincipal]);

  function refresh() {
    if (!actor) return;
    Promise.all([actor.getAllTasks(), actor.getMyAcceptedTasks()])
      .then(([all, mine]) => {
        setAvailableTasks(
          all.filter(
            (t) =>
              t.status === TaskStatus.open &&
              t.poster.toString() !== myPrincipal,
          ),
        );
        setMyTasks(mine);
      })
      .catch(() => null);
  }

  async function handleAccept(taskId: string) {
    if (!actor) return;
    setAccepting(taskId);
    try {
      await actor.acceptTask(taskId);
      refresh();
    } catch (_) {
      // ignore
    } finally {
      setAccepting(null);
    }
  }

  const activeTasks = myTasks.filter((t) => t.status === TaskStatus.accepted);
  const completedTasks = myTasks.filter(
    (t) => t.status === TaskStatus.completed,
  );
  const totalEarned = completedTasks.reduce(
    (sum, t) => sum + getTaskerEarning(Number(t.amount)),
    0,
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000000" }}>
      <AppNavbar currentPage="tasker" />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Tasker <span style={{ color: GREEN }}>Dashboard</span>
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Accept tasks and earn money
          </p>
        </div>

        {loading ? (
          <div
            className="flex items-center justify-center py-20"
            data-ocid="taskerpage.loading_state"
          >
            <Loader2
              size={32}
              className="animate-spin"
              style={{ color: GREEN }}
            />
          </div>
        ) : (
          <>
            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* LEFT column */}
              <div className="flex flex-col gap-6">
                {/* Online toggle */}
                <div
                  className="rounded-xl p-5 flex items-center justify-between"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(0,230,118,0.12)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: isOnline
                          ? `${GREEN}20`
                          : "rgba(255,255,255,0.05)",
                        border: `1px solid ${
                          isOnline ? `${GREEN}40` : "rgba(255,255,255,0.1)"
                        }`,
                      }}
                    >
                      <Zap
                        size={16}
                        style={{
                          color: isOnline ? GREEN : "rgba(255,255,255,0.4)",
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {isOnline ? "You're Online" : "You're Offline"}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        {isOnline
                          ? "Receiving task requests"
                          : "Not visible to customers"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOnline((p) => !p)}
                    className="relative w-12 h-6 rounded-full transition-all"
                    style={{
                      background: isOnline ? GREEN : "rgba(255,255,255,0.12)",
                      boxShadow: isOnline ? `0 0 12px ${GREEN}40` : "none",
                    }}
                    data-ocid="taskerpage.online.toggle"
                  >
                    <span
                      className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: isOnline ? "1.625rem" : "0.25rem" }}
                    />
                  </button>
                </div>

                {/* Available Tasks */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-base font-bold text-white">
                      Available Tasks
                    </h2>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: `${GREEN}20`, color: GREEN }}
                    >
                      {availableTasks.length}
                    </span>
                  </div>

                  {availableTasks.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center py-12 text-center rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(0,230,118,0.08)",
                      }}
                      data-ocid="taskerpage.available.empty_state"
                    >
                      <Box
                        size={28}
                        style={{ color: "rgba(255,255,255,0.1)" }}
                      />
                      <p
                        className="mt-3 text-sm"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        No tasks available right now
                      </p>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col gap-4"
                      data-ocid="taskerpage.available.list"
                    >
                      {availableTasks.map((task, i) => (
                        <div
                          key={task.id}
                          data-ocid={`taskerpage.available.item.${i + 1}`}
                        >
                          <AvailableTaskCard
                            task={task}
                            onAccept={handleAccept}
                            accepting={accepting}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT column */}
              <div className="flex flex-col gap-6">
                {/* Earnings wallet */}
                <div
                  className="rounded-xl p-5"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(0,230,118,0.12)",
                  }}
                  data-ocid="taskerpage.earnings.card"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet size={16} style={{ color: GREEN }} />
                    <span
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      Earnings Wallet
                    </span>
                  </div>
                  <div className="text-3xl font-bold" style={{ color: GREEN }}>
                    ₹{totalEarned}
                  </div>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    Payments released after OTP verification
                  </p>
                </div>

                {/* Active Tasks */}
                <div>
                  <h2 className="text-base font-bold text-white mb-4">
                    My Active Tasks
                  </h2>

                  {activeTasks.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center py-12 text-center rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(0,230,118,0.08)",
                      }}
                      data-ocid="taskerpage.active.empty_state"
                    >
                      <Box
                        size={28}
                        style={{ color: "rgba(255,255,255,0.1)" }}
                      />
                      <p
                        className="mt-3 text-sm"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        No active tasks
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                      >
                        Accept a task from the left to start earning
                      </p>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col gap-4"
                      data-ocid="taskerpage.active.list"
                    >
                      {activeTasks.map((task, i) => (
                        <div
                          key={task.id}
                          data-ocid={`taskerpage.active.item.${i + 1}`}
                        >
                          <ActiveTaskCard task={task} onComplete={refresh} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-base font-bold text-white">
                    Completed Tasks
                  </h2>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: `${GREEN}20`, color: GREEN }}
                  >
                    {completedTasks.length}
                  </span>
                </div>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  data-ocid="taskerpage.completed.list"
                >
                  {completedTasks.map((task, i) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="rounded-xl p-4 flex items-center justify-between gap-3"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(0,230,118,0.1)",
                      }}
                      data-ocid={`taskerpage.completed.item.${i + 1}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <CheckCircle2 size={11} style={{ color: GREEN }} />
                          <p
                            className="text-xs"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                          >
                            Completed
                          </p>
                        </div>
                        <div className="flex mt-2 gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span
                              key={s}
                              className="text-xs"
                              style={{ color: GREEN }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className="text-sm font-bold"
                          style={{ color: GREEN }}
                        >
                          +₹{getTaskerEarning(Number(task.amount))}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
