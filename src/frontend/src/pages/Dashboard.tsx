import {
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  IndianRupee,
  Loader2,
  MapPin,
  Phone,
  Tag,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { type PublicTask, type Task, TaskStatus } from "../backend";
import { AppNavbar } from "../components/AppNavbar";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { getTaskerEarning } from "../utils/platformFee";
import { getSurgePrice, isSurgeActive } from "../utils/surgePricing";

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

function TaskCard({
  task,
  action,
  footer,
}: { task: PublicTask; action?: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
      }}
    >
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

      {/* Static progress timeline */}
      {task.status !== TaskStatus.completed && (
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
                  border: `1px solid ${step.done ? `${GREEN}50` : "rgba(255,255,255,0.1)"}`,
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
      )}

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

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .getMyPostedTasks()
      .then(async (t) => {
        setTasks(t);
        setLoading(false);
        // fetch OTPs for accepted tasks
        const accepted = t.filter(
          (task) => task.status === TaskStatus.accepted,
        );
        const results = await Promise.all(
          accepted.map((task) =>
            actor.getTaskWithOtp(task.id).catch(() => null as Task | null),
          ),
        );
        const map: Record<string, string> = {};
        for (const full of results) {
          if (full?.otp) map[full.id] = full.otp;
        }

        setOtpMap(map);
      })
      .catch(() => setLoading(false));
  }, [actor, isFetching]);

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
                      {cancelling === task.id ? "Cancelling…" : "Cancel Task"}
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
type Tip = 20 | 50 | 100 | null;

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "Grocery", label: "🛒 Grocery" },
  { value: "Pharmacy", label: "💊 Pharmacy" },
  { value: "Errands", label: "📦 Errands" },
  { value: "Courier", label: "🚴 Courier" },
  { value: "Cleaning", label: "🧹 Cleaning" },
  { value: "Other", label: "✨ Other" },
];

const TIP_OPTIONS: { label: string; value: 20 | 50 | 100 }[] = [
  { label: "₹20", value: 20 },
  { label: "₹50", value: 50 },
  { label: "₹100", value: 100 },
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
  const [fields, setFields] = useState({
    title: "",
    description: "",
    pickupLocation: "",
    deliveryLocation: "",
    contactNumber: "",
    amount: "",
    tip: null as Tip,
    category: "" as Category,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const baseAmount = Number(fields.amount);
  const tipAmount = fields.tip ?? 0;
  const surgePrice =
    surgeActive && baseAmount > 0 ? getSurgePrice(baseAmount) : null;
  const finalAmount = (surgePrice ?? baseAmount) + tipAmount;

  function validate() {
    const e: Record<string, string> = {};
    if (!fields.title.trim()) e.title = "Task title is required.";
    if (!fields.category) e.category = "Please select a category.";
    if (!fields.pickupLocation.trim())
      e.pickupLocation = "Pickup location is required.";
    if (!fields.amount || Number(fields.amount) <= 0)
      e.amount = "Enter a valid amount.";
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
      amount: finalAmount * 100,
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
            BigInt(Math.round(finalAmount)),
            "",
            "",
          );
          const id = await actor.createTask(
            fields.title,
            description,
            fields.category,
            location,
            BigInt(Math.round(finalAmount)),
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
      tip: null,
      category: "",
    });
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
          style={{ background: GREEN, color: "#050505" }}
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
          placeholder="Describe what you need done…"
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
              min="1"
              placeholder="0"
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
          {surgePrice !== null && (
            <p className="text-xs" style={{ color: AMBER }}>
              Surge price: ₹{surgePrice} (+20%)
            </p>
          )}
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

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "rgba(255,255,255,0.5)" }}
          htmlFor="pt-category"
        >
          Category <span style={{ color: "#f87171" }}>*</span>
        </label>
        <div className="relative">
          <select
            id="pt-category"
            value={fields.category}
            onChange={(e) => {
              setFields((p) => ({
                ...p,
                category: e.target.value as Category,
              }));
              setErrors((p) => ({ ...p, category: "" }));
            }}
            className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-sm outline-none transition-all"
            style={{
              ...inputBase,
              color: fields.category ? "#fff" : "rgba(255,255,255,0.35)",
            }}
            data-ocid="posttask.select"
          >
            <option
              value=""
              disabled
              style={{ background: "#0a0e0c", color: "rgba(255,255,255,0.35)" }}
            >
              Select a category
            </option>
            {CATEGORIES.map((c) => (
              <option
                key={c.value}
                value={c.value}
                style={{ background: "#0a0e0c", color: "#fff" }}
              >
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "rgba(255,255,255,0.35)" }}
          />
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

      {/* Tip */}
      <div className="flex flex-col gap-2">
        <span
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          Tip (optional)
        </span>
        <div className="flex gap-2">
          {TIP_OPTIONS.map(({ label, value }) => {
            const sel = fields.tip === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setFields((p) => ({
                    ...p,
                    tip: p.tip === value ? null : value,
                  }))
                }
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
                style={{
                  background: sel
                    ? "rgba(0,230,118,0.18)"
                    : "rgba(255,255,255,0.04)",
                  border: sel
                    ? `1.5px solid ${GREEN}60`
                    : "1px solid rgba(255,255,255,0.1)",
                  color: sel ? GREEN : "rgba(255,255,255,0.55)",
                }}
                data-ocid="posttask.toggle"
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Escrow note */}
      <div
        className="flex items-start gap-2 px-4 py-3 rounded-xl"
        style={{
          background: "rgba(0,230,118,0.05)",
          border: `1px solid ${GREEN}18`,
        }}
      >
        <IndianRupee
          size={14}
          style={{ color: `${GREEN}90`, flexShrink: 0, marginTop: 1 }}
        />
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
          Payment is collected via Razorpay and held in escrow. Released only
          after task completion.
        </p>
      </div>

      {submitError && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
          }}
          data-ocid="posttask.error_state"
        >
          {submitError}
        </div>
      )}

      <motion.button
        type="submit"
        data-ocid="posttask.submit_button"
        disabled={isLoading}
        whileHover={isLoading ? {} : { scale: 1.01 }}
        whileTap={isLoading ? {} : { scale: 0.98 }}
        className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-70"
        style={{
          background: GREEN,
          color: "#050505",
          boxShadow: isLoading ? "none" : "0 4px 24px rgba(0,230,118,0.35)",
        }}
      >
        {isLoading && <Loader2 size={16} className="animate-spin" />}
        {isLoading
          ? "Processing…"
          : finalAmount > 0
            ? `Pay ₹${finalAmount} & Post Task`
            : "Pay & Post Task"}
      </motion.button>
    </form>
  );
}

// ── Find Tasks Tab ───────────────────────────────────────────────────────────
function FindTasksTab() {
  const { actor, isFetching } = useActor();
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .getAllTasks()
      .then((t) => {
        setTasks(t.filter((task) => task.status === TaskStatus.open));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor, isFetching]);

  async function handleAccept(taskId: string) {
    if (!actor) return;
    setAccepting(taskId);
    try {
      await actor.acceptTask(taskId);
      setAcceptedIds((prev) => new Set([...prev, taskId]));
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (_) {
      // silently handle
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
          Earn money by completing tasks near you
        </p>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Accept tasks posted by others. Manage accepted tasks in Tasker Hub.
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-white mb-3">
          Available Tasks Near You
        </p>
        {tasks.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            data-ocid="findtasks.empty_state"
          >
            <MapPin size={32} style={{ color: "rgba(255,255,255,0.15)" }} />
            <p
              className="mt-3 text-sm"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              No open tasks available right now
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              Check back soon!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4" data-ocid="findtasks.list">
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                data-ocid={`findtasks.item.${i + 1}`}
              >
                <TaskCard
                  task={task}
                  action={
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#00E676" }}
                      >
                        You earn ₹{getTaskerEarning(Number(task.amount))}
                      </span>
                      <div className="flex items-center gap-2">
                        {task.description?.includes("Contact:") && (
                          <a
                            href={`tel:${task.description.replace("Contact: ", "")}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                            style={{
                              background: `${GREEN}15`,
                              color: GREEN,
                              border: `1px solid ${GREEN}35`,
                            }}
                          >
                            <Phone size={11} />
                            Call Customer
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAccept(task.id)}
                          disabled={
                            accepting === task.id || acceptedIds.has(task.id)
                          }
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-60"
                          style={{
                            background: GREEN,
                            color: "#050505",
                            boxShadow: `0 0 12px ${GREEN}35`,
                          }}
                          data-ocid={`findtasks.primary_button.${i + 1}`}
                        >
                          {accepting === task.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : null}
                          {acceptedIds.has(task.id)
                            ? "Accepted!"
                            : "Accept & Earn"}
                        </button>
                      </div>
                    </div>
                  }
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export function Dashboard() {
  useInternetIdentity();
  const { actor } = useActor();
  const [tab, setTab] = useState<Tab>("my-tasks");
  const [myTasksCount, setMyTasksCount] = useState(0);
  const [openTasksCount, setOpenTasksCount] = useState(0);

  useEffect(() => {
    if (!actor) return;
    Promise.all([
      actor.getMyPostedTasks().catch(() => [] as PublicTask[]),
      actor.getAllTasks().catch(() => [] as PublicTask[]),
      actor.getCallerUserProfile().catch(() => null),
    ]).then(([mine, all, _profile]) => {
      setMyTasksCount(mine.length);
      setOpenTasksCount(all.filter((t) => t.status === TaskStatus.open).length);
    });
  }, [actor]);

  const TABS = [
    { id: "my-tasks" as Tab, label: "My Tasks", count: myTasksCount },
    { id: "post-task" as Tab, label: "Post Task", count: null },
    { id: "find-tasks" as Tab, label: "Find Tasks", count: openTasksCount },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#050505" }}>
      {/* Ambient glows */}
      <div
        className="fixed top-0 left-0 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(0,230,118,0.07) 0%, transparent 60%)",
          zIndex: 0,
        }}
      />
      <div
        className="fixed bottom-0 right-0 w-[400px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 100% 100%, rgba(0,230,118,0.05) 0%, transparent 60%)",
          zIndex: 0,
        }}
      />

      <AppNavbar currentPage="dashboard" />

      {/* Main */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="text-white">Customer </span>
            <span style={{ color: GREEN }}>Dashboard</span>
          </h1>
          <p
            className="text-sm mt-1.5"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Manage your tasks, post new ones, and find work nearby.
          </p>
        </div>

        {/* Tab pill switcher */}
        <div
          className="flex items-center gap-1 p-1 rounded-2xl mb-8 w-fit"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {TABS.map(({ id, label, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab === id ? GREEN : "transparent",
                color: tab === id ? "#050505" : "rgba(255,255,255,0.5)",
                boxShadow: tab === id ? `0 0 16px ${GREEN}40` : "none",
              }}
              data-ocid={`dashboard.${id}.tab`}
            >
              {label}
              {count !== null && count > 0 && (
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                  style={{
                    background: tab === id ? "rgba(0,0,0,0.2)" : `${GREEN}25`,
                    color: tab === id ? "#050505" : GREEN,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "my-tasks" && <MyTasksTab />}
            {tab === "post-task" && <PostTaskTab />}
            {tab === "find-tasks" && <FindTasksTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 border-t py-6 px-4 text-center mt-8"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgba(0,230,118,0.5)" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
