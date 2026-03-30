import { CheckCircle2, Loader2, MapPin, Tag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { type PublicTask, TaskStatus } from "../backend";
import { useActor } from "../hooks/useActor";
import { getTaskerEarning } from "../utils/platformFee";

const GREEN = "#00E676";

type WorkStage = 1 | 2 | 3 | 4 | 5;

function getStoredStage(taskId: string): WorkStage {
  const val = localStorage.getItem(`turtle_stage_${taskId}`);
  if (val) return Number(val) as WorkStage;
  return 1;
}

function setStoredStage(taskId: string, stage: WorkStage) {
  localStorage.setItem(`turtle_stage_${taskId}`, String(stage));
}

const STAGE_LABELS: Record<WorkStage, string> = {
  1: "Accepted",
  2: "On the Way",
  3: "Arrived",
  4: "Enter OTP",
  5: "Verified ✓",
};

function TaskStageCard({
  task,
  onComplete,
}: { task: PublicTask; onComplete: () => void }) {
  const initialStage: WorkStage =
    task.status === TaskStatus.completed ? 5 : getStoredStage(task.id);
  const [stage, setStage] = useState<WorkStage>(initialStage);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const { actor } = useActor();

  function advance(next: WorkStage) {
    setStage(next);
    setStoredStage(task.id, next);
  }

  async function handleVerifyOtp() {
    if (!actor || otp.length !== 6) return;
    setVerifying(true);
    setOtpError("");
    try {
      const result = await actor.completeTask(task.id, otp);
      if (result) {
        advance(5);
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(0,230,118,0.12)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Task info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">
            {task.title}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {task.category && (
              <span
                className="flex items-center gap-1 text-xs"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                <Tag size={10} />
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
        </div>
        <div className="text-right shrink-0">
          <div className="text-white font-bold text-sm">
            ₹{Number(task.amount)}
          </div>
          <div className="text-xs font-semibold" style={{ color: GREEN }}>
            You earn ₹{earning}
          </div>
        </div>
      </div>

      {/* Stage progress */}
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

      {/* Stage label */}
      <div
        className="text-xs font-semibold"
        style={{ color: stage === 5 ? GREEN : "rgba(255,255,255,0.6)" }}
      >
        Current: {STAGE_LABELS[stage]}
      </div>

      {/* Action buttons */}
      <AnimatePresence mode="wait">
        {stage === 1 && (
          <motion.button
            key="to-way"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            type="button"
            onClick={() => advance(2)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: `${GREEN}20`,
              color: GREEN,
              border: `1px solid ${GREEN}35`,
            }}
            data-ocid="taskerwork.on_the_way.button"
          >
            🚴 Mark On the Way
          </motion.button>
        )}
        {stage === 2 && (
          <motion.button
            key="to-arrived"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            type="button"
            onClick={() => advance(3)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: `${GREEN}20`,
              color: GREEN,
              border: `1px solid ${GREEN}35`,
            }}
            data-ocid="taskerwork.arrived.button"
          >
            📍 Mark Arrived
          </motion.button>
        )}
        {stage === 3 && (
          <motion.button
            key="to-otp"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            type="button"
            onClick={() => advance(4)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background:
                "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
              color: "#000000",
              boxShadow: `0 0 14px ${GREEN}40`,
            }}
            data-ocid="taskerwork.enter_otp.button"
          >
            🔐 Enter Delivery OTP
          </motion.button>
        )}
        {stage === 4 && (
          <motion.div
            key="otp-entry"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            <div>
              <p
                className="text-xs mb-1.5"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
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
                className="w-full px-4 py-3 rounded-xl text-white font-mono text-center text-lg tracking-widest outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${otp.length === 6 ? GREEN : "rgba(255,255,255,0.12)"}`,
                  caretColor: GREEN,
                }}
                data-ocid="taskerwork.otp.input"
              />
              {otpError && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "#ff4d4f" }}
                  data-ocid="taskerwork.otp.error_state"
                >
                  {otpError}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || verifying}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{
                background:
                  "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
                color: "#000000",
                boxShadow: otp.length === 6 ? `0 0 14px ${GREEN}40` : "none",
              }}
              data-ocid="taskerwork.verify_otp.submit_button"
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
            key="completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: GREEN }}
          >
            <CheckCircle2 size={16} />
            Task completed! Earnings: ₹{earning}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function TaskerWorkTab() {
  const { actor, isFetching } = useActor();
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .getMyAcceptedTasks()
      .then((t) => {
        setTasks(t);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor, isFetching]);

  function refresh() {
    if (!actor) return;
    actor
      .getMyAcceptedTasks()
      .then(setTasks)
      .catch(() => null);
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="taskerwork.loading_state"
      >
        <Loader2 size={24} className="animate-spin" style={{ color: GREEN }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "rgba(0,230,118,0.05)",
          border: `1px solid ${GREEN}18`,
        }}
      >
        <p className="text-white font-semibold text-sm">
          Your Active Deliveries 🐢
        </p>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Track and complete your accepted tasks. Verify delivery with the
          customer's OTP.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="taskerwork.empty_state"
        >
          <span className="text-5xl mb-4">🐢</span>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            No tasks in progress
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Accept a task from "Find Tasks" to get started!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4" data-ocid="taskerwork.list">
          {tasks.map((task, i) => (
            <div key={task.id} data-ocid={`taskerwork.item.${i + 1}`}>
              <TaskStageCard task={task} onComplete={refresh} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
