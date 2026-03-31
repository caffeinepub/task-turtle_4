import {
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  Loader2,
  MapPin,
  Phone,
  Tag,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import {
  type PublicTask,
  type Task,
  type TaskParticipantProfiles,
  TaskStatus,
} from "../backend";
import { AppNavbar } from "../components/AppNavbar";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { calculateTotalPayable, getTaskerEarning } from "../utils/platformFee";
import { getSurgePrice, isSurgeActive } from "../utils/surgePricing";
import { DEFAULT_TASK_IMAGE, getTaskImage } from "../utils/taskImage";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: Window & {
  Razorpay: new (opts: object) => { open(): void };
} & any;

const GREEN = "#00E676";
const AMBER = "#F59E0B";

type Tab = "my-tasks" | "post-task" | "find-tasks";

function formatTime(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  const date = new Date(ms);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

function StatusBadge({ status }: { status: TaskStatus }) {
  if (status === TaskStatus.accepted) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
        style={{
          background: "rgba(245,158,11,0.15)",
          color: AMBER,
          border: `1px solid ${AMBER}40`,
        }}
      >
        In Progress
      </span>
    );
  }
  if (status === TaskStatus.completed) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
        style={{
          background: "rgba(0,230,118,0.15)",
          color: GREEN,
          border: `1px solid ${GREEN}40`,
        }}
      >
        Completed
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: "rgba(255,255,255,0.07)",
        color: "rgba(255,255,255,0.6)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      Open
    </span>
  );
}

// ── 6-Step Live Tracking Timeline ──────────────────────────────────────────

const TRACKING_STEPS = [
  { key: "posted", label: "Task Posted" },
  { key: "accepted", label: "Accepted" },
  { key: "on_the_way", label: "On the Way" },
  { key: "arrived", label: "Arrived" },
  { key: "verified", label: "Verified" },
  { key: "delivered", label: "Delivered" },
] as const;

const STAGE_ORDER: Record<string, number> = {
  posted: 0,
  accepted: 1,
  on_the_way: 2,
  arrived: 3,
  verified: 4,
  delivered: 5,
};

function getStepStatus(
  stepIndex: number,
  currentStage: string,
): "done" | "current" | "pending" {
  const currentIndex = STAGE_ORDER[currentStage] ?? 0;
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "current";
  return "pending";
}

function LiveTrackingTimeline({
  stage,
  taskerInfo,
}: {
  stage: string;
  taskerInfo?: { name: string; phone: string } | null;
}) {
  return (
    <div
      className="flex flex-col gap-0 pt-3 border-t"
      style={{ borderColor: "rgba(0,230,118,0.12)" }}
    >
      <p
        className="text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: GREEN }}
      >
        Live Tracking
      </p>

      <div className="relative flex flex-col">
        {TRACKING_STEPS.map((step, i) => {
          const status = getStepStatus(i, stage);
          const isLast = i === TRACKING_STEPS.length - 1;

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 relative"
            >
              {/* Vertical connector line */}
              {!isLast && (
                <div
                  className="absolute left-[9px] top-[20px] w-0.5"
                  style={{
                    height: "calc(100% - 4px)",
                    background:
                      status === "done"
                        ? `linear-gradient(to bottom, ${GREEN}, ${GREEN}80)`
                        : "rgba(255,255,255,0.08)",
                    transition: "background 0.5s",
                  }}
                />
              )}

              {/* Circle indicator */}
              <div className="relative z-10 shrink-0 mt-0.5">
                {status === "done" ? (
                  <div
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center"
                    style={{
                      background: GREEN,
                      boxShadow: `0 0 8px ${GREEN}80`,
                    }}
                  >
                    <CheckCircle2 size={10} color="#000" strokeWidth={3} />
                  </div>
                ) : status === "current" ? (
                  <div
                    className="w-[18px] h-[18px] rounded-full relative"
                    style={{
                      background: `${GREEN}30`,
                      border: `2px solid ${GREEN}`,
                      boxShadow: `0 0 12px ${GREEN}60`,
                      animation: "pulse 1.5s infinite",
                    }}
                  >
                    <div
                      className="absolute inset-[3px] rounded-full"
                      style={{ background: GREEN }}
                    />
                  </div>
                ) : (
                  <div
                    className="w-[18px] h-[18px] rounded-full"
                    style={{
                      border: "2px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  />
                )}
              </div>

              {/* Step label + badge */}
              <div className="flex items-center justify-between flex-1 pb-4">
                <span
                  className="text-xs font-semibold"
                  style={{
                    color:
                      status === "pending"
                        ? "rgba(255,255,255,0.35)"
                        : status === "current"
                          ? "#fff"
                          : "rgba(255,255,255,0.75)",
                  }}
                >
                  {step.label}
                </span>
                {status === "done" && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(0,230,118,0.15)",
                      color: GREEN,
                      border: `1px solid ${GREEN}40`,
                    }}
                  >
                    Done ✓
                  </span>
                )}
                {status === "current" && (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(245,158,11,0.15)",
                      color: AMBER,
                      border: `1px solid ${AMBER}50`,
                      animation: "pulse 1.5s infinite",
                    }}
                  >
                    In Progress
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tasker info */}
      {taskerInfo && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mt-1 px-3 py-2.5 rounded-xl"
          style={{
            background: "rgba(0,230,118,0.07)",
            border: `1px solid ${GREEN}25`,
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${GREEN}20`, border: `1px solid ${GREEN}40` }}
          >
            <Phone size={12} style={{ color: GREEN }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              Tasker: {taskerInfo.name}
            </p>
            <p className="text-xs" style={{ color: GREEN }}>
              📞 {taskerInfo.phone}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  action,
  footer,
  trackingStage,
  taskerInfo,
}: {
  task: PublicTask;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  trackingStage?: string;
  taskerInfo?: { name: string; phone: string } | null;
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(0,230,118,0.1)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Task image */}
      <img
        src={getTaskImage(task.title, task.category, task.description ?? "")}
        alt={task.title}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = DEFAULT_TASK_IMAGE;
        }}
        style={{
          width: "100%",
          height: "180px",
          objectFit: "cover",
          borderRadius: "12px",
        }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-sm">{task.title}</h3>
            <StatusBadge status={task.status} />
          </div>
          {task.description && (
            <p
              className="text-xs mt-1"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              {task.description}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold" style={{ color: GREEN }}>
            ₹{task.amount.toString()}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {task.category && (
          <div className="flex items-center gap-1.5">
            <Tag size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
            <span
              className="text-xs"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {task.category}
            </span>
          </div>
        )}
        {task.location && (
          <div className="flex items-center gap-1.5">
            <MapPin size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
            <span
              className="text-xs"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {task.location}
            </span>
          </div>
        )}
      </div>

      {/* Live 6-step tracking timeline or static progress */}
      {task.status !== TaskStatus.completed && trackingStage ? (
        <LiveTrackingTimeline stage={trackingStage} taskerInfo={taskerInfo} />
      ) : task.status !== TaskStatus.completed ? (
        <div
          className="flex flex-col gap-1.5 pt-2 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <p
            className="text-xs font-medium"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Progress
          </p>
          {[
            { label: "Task posted", done: true },
            {
              label: "Tasker found",
              done:
                (task.status as string) === TaskStatus.accepted ||
                (task.status as string) === TaskStatus.completed,
            },
            {
              label: "Tasker is on the way",
              done: (task.status as string) === TaskStatus.completed,
            },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: step.done
                    ? `${GREEN}25`
                    : "rgba(255,255,255,0.05)",
                  border: `1px solid ${
                    step.done ? `${GREEN}50` : "rgba(255,255,255,0.1)"
                  }`,
                }}
              >
                {step.done && (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: GREEN }}
                  />
                )}
              </div>
              <span
                className="text-xs"
                style={{
                  color: step.done
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(255,255,255,0.3)",
                }}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          {formatTime(task.createdAt)}
        </span>
        {action}
      </div>

      {footer}
    </div>
  );
}

// ── My Tasks Tab ────────────────────────────────────────────────────────────
function MyTasksTab() {
  const { actor, isFetching } = useActor();
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [otpMap, setOtpMap] = useState<Record<string, string>>({});
  const [stageMap, setStageMap] = useState<Record<string, string>>({});
  const [profileMap, setProfileMap] = useState<
    Record<string, TaskParticipantProfiles>
  >({});
  const fetchAll = useCallback(async () => {
    if (!actor) return;
    const t = await actor.getMyPostedTasks();
    setTasks(t);

    const accepted = t.filter((task) => task.status === TaskStatus.accepted);
    const nonCompleted = t.filter(
      (task) =>
        task.status === TaskStatus.accepted || task.status === TaskStatus.open,
    );

    const [otpResults, stageResults, profileResults] = await Promise.all([
      Promise.allSettled(accepted.map((task) => actor.getTaskWithOtp(task.id))),
      Promise.allSettled(
        nonCompleted.map((task) => actor.getTaskStage(task.id)),
      ),
      Promise.allSettled(
        accepted.map((task) => actor.getTaskParticipantProfiles(task.id)),
      ),
    ]);

    const newOtpMap: Record<string, string> = {};
    for (const r of otpResults) {
      if (r.status === "fulfilled" && r.value?.otp) {
        newOtpMap[r.value.id] = r.value.otp;
      }
    }
    setOtpMap((prev) => ({ ...prev, ...newOtpMap }));

    const newStageMap: Record<string, string> = {};
    for (const [i, r] of stageResults.entries()) {
      if (r.status === "fulfilled" && r.value) {
        newStageMap[nonCompleted[i].id] = r.value.stage;
      }
    }
    setStageMap((prev) => ({ ...prev, ...newStageMap }));

    const newProfileMap: Record<string, TaskParticipantProfiles> = {};
    for (const [i, r] of profileResults.entries()) {
      if (r.status === "fulfilled" && r.value) {
        newProfileMap[accepted[i].id] = r.value;
      }
    }
    setProfileMap((prev) => ({ ...prev, ...newProfileMap }));
  }, [actor]);

  // Initial fetch on mount
  useEffect(() => {
    if (!actor || isFetching) return;
    fetchAll().finally(() => setLoading(false));
  }, [actor, isFetching, fetchAll]);

  // Poll every 4s for live task + OTP updates
  useEffect(() => {
    if (!actor || isFetching) return;
    const interval = setInterval(fetchAll, 4000);
    return () => clearInterval(interval);
  }, [actor, isFetching, fetchAll]);

  async function handleCancel(taskId: string) {
    if (!actor) return;
    setCancelling(taskId);
    try {
      const result = await (actor as any).cancelTask(taskId);
      if (result.__kind__ === "ok") {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (_) {
      // silently handle
    } finally {
      setCancelling(null);
    }
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="mytasks.loading_state"
      >
        <Loader2 size={24} className="animate-spin" style={{ color: GREEN }} />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        data-ocid="mytasks.empty_state"
      >
        <ClipboardList size={36} style={{ color: "rgba(255,255,255,0.15)" }} />
        <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          No tasks posted yet
        </p>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
          Post your first task to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-ocid="mytasks.list">
      {tasks.map((task, i) => {
        const otp = otpMap[task.id];
        const isOpen = task.status === TaskStatus.open;
        const isAccepted = task.status === TaskStatus.accepted;
        const isCompleted = task.status === TaskStatus.completed;
        const stage = stageMap[task.id];
        const profiles = profileMap[task.id];
        const taskerInfo = profiles?.taskerProfile
          ? {
              name: profiles.taskerProfile.name,
              phone: profiles.taskerProfile.phone,
            }
          : null;

        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            data-ocid={`mytasks.item.${i + 1}`}
          >
            <TaskCard
              task={task}
              trackingStage={
                stage ||
                (isAccepted ? "accepted" : isOpen ? "posted" : undefined)
              }
              taskerInfo={taskerInfo}
              action={
                isCompleted ? (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{
                      background: "rgba(0,230,118,0.15)",
                      color: GREEN,
                      border: `1px solid ${GREEN}40`,
                    }}
                  >
                    <CheckCircle2 size={13} />
                    Task Delivered
                  </div>
                ) : undefined
              }
              footer={
                <div className="flex flex-col gap-2 mt-1">
                  {/* OTP box for accepted tasks */}
                  {isAccepted && (
                    <div
                      className="flex flex-col gap-1.5 px-4 py-3 rounded-xl"
                      style={{
                        background: "rgba(0,230,118,0.07)",
                        border: `1px solid ${GREEN}30`,
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        🔐 Your Delivery OTP — Share with the tasker when they
                        arrive
                      </p>
                      {otp ? (
                        <p
                          className="text-2xl font-mono font-bold tracking-[0.35em] mt-0.5"
                          style={{ color: GREEN }}
                          data-ocid={`mytasks.otp.${i + 1}`}
                        >
                          {otp}
                        </p>
                      ) : (
                        <Loader2
                          size={14}
                          className="animate-spin"
                          style={{ color: GREEN }}
                        />
                      )}
                      <p
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        Task cannot be cancelled — tasker has been assigned
                      </p>
                    </div>
                  )}

                  {/* Cancel button for open tasks only */}
                  {isOpen && (
                    <button
                      type="button"
                      onClick={() => handleCancel(task.id)}
                      disabled={cancelling === task.id}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60"
                      style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#f87171",
                      }}
                      data-ocid={`mytasks.delete_button.${i + 1}`}
                    >
                      {cancelling === task.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : null}
                      {cancelling === task.id
                        ? "Cancelling\u2026"
                        : "Cancel Task"}
                    </button>
                  )}
                </div>
              }
            />
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Post Task Tab ────────────────────────────────────────────────────────────
type Category =
  | ""
  | "Grocery"
  | "Pharmacy"
  | "Errands"
  | "Courier"
  | "Cleaning"
  | "Other";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "Grocery", label: "🛒 Grocery" },
  { value: "Pharmacy", label: "💊 Pharmacy" },
  { value: "Errands", label: "📦 Errands" },
  { value: "Courier", label: "🚴 Courier" },
  { value: "Cleaning", label: "🧹 Cleaning" },
  { value: "Other", label: "✨ Other" },
];

const inputBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
};

function PostTaskTab() {
  const { actor } = useActor();
  const [surgeActive] = useState(() => isSurgeActive());
  const [submitted, setSubmitted] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [taskerFee, setTaskerFee] = useState<number>(15);
  const [taskerFeeCustom, setTaskerFeeCustom] = useState<string>("");
  const [boost, setBoost] = useState<number>(0);
  const [fields, setFields] = useState({
    title: "",
    description: "",
    pickupLocation: "",
    deliveryLocation: "",
    contactNumber: "",
    amount: "",
    category: "" as Category,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const baseAmount = Number(fields.amount);
  const surgePrice =
    surgeActive && baseAmount > 0 ? getSurgePrice(baseAmount) : null;
  const effectiveBase = surgePrice ?? baseAmount;
  const totalPayable =
    effectiveBase > 0
      ? calculateTotalPayable(effectiveBase, taskerFee, boost)
      : 0;
  const taskerFeeValid = taskerFee >= 10;

  function validate() {
    const e: Record<string, string> = {};
    if (!fields.title.trim()) e.title = "Task title is required.";
    if (!fields.category) e.category = "Please select a category.";
    if (!fields.pickupLocation.trim())
      e.pickupLocation = "Pickup location is required.";
    if (!fields.amount || Number(fields.amount) <= 0)
      e.amount = "Enter a valid amount.";
    if (taskerFee < 10) e.taskerFee = "Increase tasker fee to continue.";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!actor) {
      setSubmitError("Not connected. Please refresh.");
      return;
    }
    setIsLoading(true);
    setSubmitError(null);

    try {
      await loadRazorpayScript();
    } catch {
      setSubmitError("Failed to load payment SDK. Check your connection.");
      setIsLoading(false);
      return;
    }

    const location = fields.deliveryLocation
      ? `${fields.pickupLocation} → ${fields.deliveryLocation}`
      : fields.pickupLocation;
    const description =
      fields.description ||
      (fields.contactNumber ? `Contact: ${fields.contactNumber}` : "");

    const options = {
      key: "rzp_live_SRNbTwyEmzQSvO",
      amount: totalPayable * 100,
      currency: "INR",
      name: "Task Turtle",
      description: fields.title || "Task Payment",
      theme: { color: "#00E676" },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
      }) => {
        setIsLoading(true);
        setSubmitError(null);
        try {
          const pendingTaskId = `pending_${Date.now()}`;
          await actor.verifyPayment(
            response.razorpay_payment_id,
            response.razorpay_order_id || "",
            "",
            pendingTaskId,
            BigInt(Math.round(totalPayable)),
            "",
            "",
          );
          const id = await actor.createTask(
            fields.title,
            description,
            fields.category,
            location,
            BigInt(Math.round(totalPayable)),
          );
          if (id === null) {
            setSubmitError(
              "Payment received but task creation failed. Please contact support.",
            );
          } else {
            setTaskId(id);
            setSubmitted(true);
          }
        } catch (err) {
          setSubmitError(
            err instanceof Error
              ? err.message
              : "Something went wrong after payment.",
          );
        } finally {
          setIsLoading(false);
        }
      },
      modal: {
        ondismiss: () => {
          setIsLoading(false);
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to open payment modal.",
      );
      setIsLoading(false);
    }
  }

  function reset() {
    setFields({
      title: "",
      description: "",
      pickupLocation: "",
      deliveryLocation: "",
      contactNumber: "",
      amount: "",
      category: "",
    });
    setTaskerFee(15);
    setTaskerFeeCustom("");
    setBoost(0);
    setErrors({});
    setSubmitted(false);
    setTaskId(null);
    setSubmitError(null);
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-12 text-center"
        data-ocid="posttask.success_state"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(0,230,118,0.12)",
            border: `1.5px solid ${GREEN}50`,
          }}
        >
          <CheckCircle2 size={32} style={{ color: GREEN }} />
        </div>
        <h3 className="text-xl font-bold text-white">Task Posted!</h3>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          Payment received. A tasker will reach out to you shortly.
        </p>
        {taskId && (
          <div
            className="px-4 py-2 rounded-xl text-xs font-mono"
            style={{
              background: "rgba(0,230,118,0.08)",
              border: `1px solid ${GREEN}20`,
              color: `${GREEN}CC`,
            }}
          >
            Task ID: {taskId}
          </div>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-2 px-6 py-2.5 rounded-xl font-semibold text-sm"
          style={{
            background:
              "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
            color: "#000000",
          }}
          data-ocid="posttask.primary_button"
        >
          Post Another Task
        </button>
      </motion.div>
    );
  }

  const inp =
    "w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5 max-w-2xl"
    >
      {surgeActive && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{
            background: "rgba(255,160,0,0.08)",
            border: "1px solid rgba(255,160,0,0.25)",
          }}
        >
          <Zap size={14} fill={AMBER} style={{ color: AMBER }} />
          <span className="text-xs font-semibold" style={{ color: AMBER }}>
            Surge pricing active — final amount will be +20%
          </span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="pt-title"
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Task Title <span style={{ color: "#f87171" }}>*</span>
        </label>
        <input
          id="pt-title"
          type="text"
          placeholder="e.g. Grocery pickup from D-Mart Koramangala"
          value={fields.title}
          onChange={(e) => {
            setFields((p) => ({ ...p, title: e.target.value }));
            setErrors((p) => ({ ...p, title: "" }));
          }}
          className={inp}
          style={inputBase}
          data-ocid="posttask.input"
        />
        {errors.title && (
          <p
            className="text-xs"
            style={{ color: "#f87171" }}
            data-ocid="posttask.error_state"
          >
            {errors.title}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="pt-desc"
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Description
        </label>
        <textarea
          id="pt-desc"
          rows={3}
          placeholder="Describe what you need done\u2026"
          value={fields.description}
          onChange={(e) =>
            setFields((p) => ({ ...p, description: e.target.value }))
          }
          className={`${inp} resize-none`}
          style={inputBase}
          data-ocid="posttask.textarea"
        />
      </div>

      {/* Locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "rgba(255,255,255,0.5)" }}
            htmlFor="pt-pickup"
          >
            Store / Pickup Location <span style={{ color: "#f87171" }}>*</span>
          </label>
          <div className="relative">
            <MapPin
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: "rgba(255,255,255,0.3)" }}
            />
            <input
              id="pt-pickup"
              type="text"
              placeholder="e.g. D-Mart, Koramangala"
              value={fields.pickupLocation}
              onChange={(e) => {
                setFields((p) => ({ ...p, pickupLocation: e.target.value }));
                setErrors((p) => ({ ...p, pickupLocation: "" }));
              }}
              className={`${inp} pl-9`}
              style={inputBase}
              data-ocid="posttask.input"
            />
          </div>
          {errors.pickupLocation && (
            <p
              className="text-xs"
              style={{ color: "#f87171" }}
              data-ocid="posttask.error_state"
            >
              {errors.pickupLocation}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "rgba(255,255,255,0.5)" }}
            htmlFor="pt-delivery"
          >
            Your Delivery Location
          </label>
          <div className="relative">
            <MapPin
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: "rgba(255,255,255,0.3)" }}
            />
            <input
              id="pt-delivery"
              type="text"
              placeholder="e.g. Flat 4B, HSR Layout"
              value={fields.deliveryLocation}
              onChange={(e) =>
                setFields((p) => ({ ...p, deliveryLocation: e.target.value }))
              }
              className={`${inp} pl-9`}
              style={inputBase}
              data-ocid="posttask.input"
            />
          </div>
        </div>
      </div>

      {/* Contact + Amount + Tip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "rgba(255,255,255,0.5)" }}
            htmlFor="pt-contact"
          >
            Contact Number (optional)
          </label>
          <div className="relative">
            <Phone
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: "rgba(255,255,255,0.3)" }}
            />
            <input
              id="pt-contact"
              type="tel"
              placeholder="10-digit number"
              maxLength={10}
              value={fields.contactNumber}
              onChange={(e) =>
                setFields((p) => ({
                  ...p,
                  contactNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
              className={`${inp} pl-9`}
              style={inputBase}
              data-ocid="posttask.input"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "rgba(255,255,255,0.5)" }}
            htmlFor="pt-amount"
          >
            Amount (₹) <span style={{ color: "#f87171" }}>*</span>
          </label>
          <div className="relative">
            <IndianRupee
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: "rgba(255,255,255,0.3)" }}
            />
            <input
              id="pt-amount"
              type="number"
              min={0}
              placeholder="e.g. 150"
              value={fields.amount}
              onChange={(e) => {
                setFields((p) => ({ ...p, amount: e.target.value }));
                setErrors((p) => ({ ...p, amount: "" }));
              }}
              className={`${inp} pl-9`}
              style={inputBase}
              data-ocid="posttask.input"
            />
          </div>
          {errors.amount && (
            <p
              className="text-xs"
              style={{ color: "#f87171" }}
              data-ocid="posttask.error_state"
            >
              {errors.amount}
            </p>
          )}
        </div>
      </div>

      {/* Tasker Fee */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-0.5">
          <p
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Tasker Fee <span style={{ color: "#f87171" }}>*</span>
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            Higher fee helps your task get accepted faster ⚡
          </p>
        </div>
        {/* Preset buttons */}
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { value: 10, label: "₹10", sub: "Economy 🐢" },
              {
                value: 15,
                label: "₹15",
                sub: "Standard 🚶",
                recommended: true,
              },
              { value: 25, label: "₹25", sub: "Fast ⚡" },
              { value: 40, label: "₹40", sub: "Priority 🔥" },
            ] as const
          ).map((opt) => {
            const selected = taskerFee === opt.value && taskerFeeCustom === "";
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTaskerFee(opt.value);
                  setTaskerFeeCustom("");
                }}
                className="relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-95"
                style={{
                  background: selected
                    ? "rgba(0,230,118,0.18)"
                    : "rgba(255,255,255,0.04)",
                  border: selected
                    ? "1.5px solid rgba(0,230,118,0.6)"
                    : "1px solid rgba(255,255,255,0.1)",
                  color: selected ? "#00E676" : "rgba(255,255,255,0.6)",
                  boxShadow: selected
                    ? "0 0 12px rgba(0,230,118,0.18)"
                    : "none",
                }}
                data-ocid="posttask.toggle"
              >
                {"recommended" in opt && opt.recommended && (
                  <span
                    className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
                    style={{ background: "#00E676", color: "#000" }}
                  >
                    Recommended
                  </span>
                )}
                <span className="font-bold text-sm">{opt.label}</span>
                <span className="text-[10px] opacity-70">{opt.sub}</span>
              </button>
            );
          })}
        </div>
        {/* Custom input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
            ₹
          </span>
          <input
            type="number"
            min={10}
            placeholder="Custom amount (min ₹10)"
            value={taskerFeeCustom}
            onChange={(e) => {
              const v = e.target.value;
              setTaskerFeeCustom(v);
              const n = Number(v);
              if (!Number.isNaN(n) && n > 0) setTaskerFee(n);
            }}
            className="w-full rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            data-ocid="posttask.input"
          />
        </div>
        {/* Dynamic feedback */}
        {taskerFee > 0 && (
          <p
            className="text-xs font-medium"
            style={{
              color:
                taskerFee >= 25
                  ? "#00E676"
                  : taskerFee >= 15
                    ? "rgba(0,230,118,0.7)"
                    : "rgba(245,158,11,0.9)",
            }}
          >
            {taskerFee < 10
              ? "⚠️ Increase tasker fee to continue"
              : taskerFee <= 10
                ? "🐢 Fewer taskers may accept at this fee"
                : taskerFee === 15
                  ? "✅ Good chance of quick acceptance"
                  : "⚡ High priority – faster acceptance expected ⚡"}
          </p>
        )}
        {errors.taskerFee && (
          <p
            className="text-xs"
            style={{ color: "#f87171" }}
            data-ocid="posttask.error_state"
          >
            {errors.taskerFee}
          </p>
        )}
      </div>

      {/* Boost */}
      <div className="flex flex-col gap-2">
        <p
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Boost your task 🚀{" "}
          <span
            className="normal-case font-normal"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            (optional)
          </span>
        </p>
        <div className="flex gap-2">
          {([10, 20] as const).map((amt) => {
            const selected = boost === amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => setBoost(boost === amt ? 0 : amt)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95"
                style={{
                  background: selected
                    ? "rgba(0,230,118,0.18)"
                    : "rgba(255,255,255,0.04)",
                  border: selected
                    ? "1.5px solid rgba(0,230,118,0.6)"
                    : "1px solid rgba(255,255,255,0.1)",
                  color: selected ? "#00E676" : "rgba(255,255,255,0.55)",
                  boxShadow: selected
                    ? "0 0 12px rgba(0,230,118,0.15)"
                    : "none",
                }}
                data-ocid="posttask.toggle"
              >
                +₹{amt}
              </button>
            );
          })}
        </div>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Boosted tasks get more visibility and faster responses
        </p>
      </div>

      {/* Category */}
      <div className="flex flex-col gap-2">
        <p
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Category <span style={{ color: "#f87171" }}>*</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                setFields((p) => ({ ...p, category: cat.value }));
                setErrors((p) => ({ ...p, category: "" }));
              }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background:
                  fields.category === cat.value
                    ? `${GREEN}20`
                    : "rgba(255,255,255,0.05)",
                border: `1px solid ${
                  fields.category === cat.value
                    ? `${GREEN}50`
                    : "rgba(255,255,255,0.1)"
                }`,
                color:
                  fields.category === cat.value
                    ? GREEN
                    : "rgba(255,255,255,0.5)",
              }}
              data-ocid="posttask.toggle"
            >
              {cat.label}
            </button>
          ))}
        </div>
        {errors.category && (
          <p
            className="text-xs"
            style={{ color: "#f87171" }}
            data-ocid="posttask.error_state"
          >
            {errors.category}
          </p>
        )}
      </div>

      {/* Price summary */}
      {totalPayable > 0 && (
        <div
          className="flex items-center justify-between px-4 py-3.5 rounded-xl"
          style={{
            background: "rgba(0,230,118,0.06)",
            border: "1px solid rgba(0,230,118,0.2)",
          }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-bold" style={{ color: "#00E676" }}>
              Total Payable: ₹{totalPayable}
            </span>
            <span
              className="text-xs"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              (includes all charges)
            </span>
          </div>
          {surgeActive && (
            <Zap size={18} fill={AMBER} style={{ color: AMBER }} />
          )}
        </div>
      )}

      {submitError && (
        <p
          className="text-xs px-3 py-2 rounded-lg"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171",
          }}
          data-ocid="posttask.error_state"
        >
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || !taskerFeeValid}
        className="py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
        style={{
          background:
            "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
          color: "#000000",
          boxShadow: `0 0 20px ${GREEN}30`,
        }}
        data-ocid="posttask.submit_button"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Processing\u2026
          </span>
        ) : (
          `Pay ₹${totalPayable > 0 ? totalPayable : "—"} & Post Task`
        )}
      </button>
    </form>
  );
}

// ── Find Tasks Tab ────────────────────────────────────────────────────────────
function FindTasksTab() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const myPrincipal = identity?.getPrincipal().toString();

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .getAllTasks()
      .then((t) => {
        setTasks(
          t.filter(
            (task) =>
              task.status === TaskStatus.open &&
              task.poster.toString() !== myPrincipal,
          ),
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor, isFetching, myPrincipal]);

  async function handleAccept(taskId: string) {
    if (!actor) return;
    setAccepting(taskId);
    try {
      await actor.acceptTask(taskId);
      setAcceptedIds((prev) => new Set([...prev, taskId]));
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (_) {
      // ignore
    } finally {
      setAccepting(null);
    }
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="findtasks.loading_state"
      >
        <Loader2 size={24} className="animate-spin" style={{ color: GREEN }} />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        data-ocid="findtasks.empty_state"
      >
        <ClipboardList size={36} style={{ color: "rgba(255,255,255,0.15)" }} />
        <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          No tasks available right now
        </p>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
          Check back later — new tasks are posted frequently
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-ocid="findtasks.list">
      {tasks.map((task, i) => {
        const earning = getTaskerEarning(Number(task.amount));
        const isAccepting = accepting === task.id;
        const isAccepted = acceptedIds.has(task.id);
        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            data-ocid={`findtasks.item.${i + 1}`}
          >
            <div
              className="rounded-xl p-5 flex flex-col gap-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(0,230,118,0.1)",
                backdropFilter: "blur(12px)",
              }}
            >
              <img
                src={getTaskImage(
                  task.title,
                  task.category,
                  task.description ?? "",
                )}
                alt={task.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    DEFAULT_TASK_IMAGE;
                }}
                style={{
                  width: "100%",
                  height: "160px",
                  objectFit: "cover",
                  borderRadius: "10px",
                }}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm">
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
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold" style={{ color: GREEN }}>
                    ₹{task.amount.toString()}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "rgba(0,230,118,0.7)" }}
                  >
                    You earn ₹{earning}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {task.category && (
                  <div className="flex items-center gap-1.5">
                    <Tag size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                    <span
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {task.category}
                    </span>
                  </div>
                )}
                {task.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin
                      size={12}
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {task.location}
                    </span>
                  </div>
                )}
              </div>
              {isAccepted ? (
                <div
                  className="flex items-center gap-2 py-2.5 rounded-xl justify-center text-sm font-bold"
                  style={{ color: GREEN }}
                >
                  <CheckCircle2 size={15} /> Accepted! Check Tasker Dashboard
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAccept(task.id)}
                  disabled={isAccepting}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
                    color: "#000000",
                    boxShadow: `0 0 14px ${GREEN}30`,
                  }}
                  data-ocid={`findtasks.primary_button.${i + 1}`}
                >
                  {isAccepting ? (
                    <Loader2 size={14} className="animate-spin inline mr-1.5" />
                  ) : null}
                  {isAccepting ? "Accepting\u2026" : "Accept Task"}
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { identity } = useInternetIdentity();
  const [tab, setTab] = useState<Tab>("my-tasks");

  const tabs: { id: Tab; label: string }[] = [
    { id: "my-tasks", label: "My Tasks" },
    { id: "post-task", label: "Post Task" },
    { id: "find-tasks", label: "Find Tasks" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000000" }}>
      <AppNavbar currentPage="dashboard" />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            Welcome back{" "}
            <span style={{ color: GREEN }}>
              {identity?.getPrincipal().toString().slice(0, 8)}\u2026
            </span>
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Manage your tasks and earnings
          </p>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-6"
          style={{ background: "rgba(255,255,255,0.05)" }}
          data-ocid="dashboard.tab"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: tab === t.id ? GREEN : "transparent",
                color: tab === t.id ? "#000" : "rgba(255,255,255,0.5)",
                boxShadow: tab === t.id ? `0 0 12px ${GREEN}40` : "none",
              }}
              data-ocid={`dashboard.${t.id}.tab`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "my-tasks" && <MyTasksTab />}
            {tab === "post-task" && <PostTaskTab />}
            {tab === "find-tasks" && <FindTasksTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export { DashboardPage as Dashboard };
