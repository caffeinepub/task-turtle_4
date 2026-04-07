import {
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  IndianRupee,
  Loader2,
  MapPin,
  Phone,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";
import { getSurgePrice, isSurgeActive } from "../utils/surgePricing";

type Category = "" | "Grocery" | "Pharmacy" | "Errands";
type Tip = 20 | 50 | 100 | null;

interface FormFields {
  category: Category;
  storeLocation: string;
  amount: string;
  tip: Tip;
  contactNumber: string;
}

interface FormErrors {
  category?: string;
  storeLocation?: string;
  amount?: string;
  contactNumber?: string;
}

const TIP_OPTIONS: { label: string; value: 20 | 50 | 100 }[] = [
  { label: "\u20b920", value: 20 },
  { label: "\u20b950", value: 50 },
  { label: "\u20b9100", value: 100 },
];

const inputBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
};

const inputError: React.CSSProperties = {
  ...inputBase,
  border: "1px solid rgba(239,68,68,0.6)",
};

function handleFocus(
  e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
) {
  e.currentTarget.style.borderColor = "rgba(0,230,118,0.5)";
  e.currentTarget.style.boxShadow =
    "0 0 0 3px rgba(0,230,118,0.1), inset 0 1px 2px rgba(0,0,0,0.3)";
}

function makeBlur(hasError: boolean) {
  return (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = hasError
      ? "rgba(239,68,68,0.6)"
      : "rgba(255,255,255,0.1)";
    e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.3)";
  };
}

export default function PostTaskForm() {
  const { actor, isFetching: actorLoading } = useActor();
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  const [fields, setFields] = useState<FormFields>({
    category: "",
    storeLocation: "",
    amount: "",
    tip: null,
    contactNumber: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [surgeActive, setSurgeActive] = useState(() => isSurgeActive());

  useEffect(() => {
    const interval = setInterval(() => {
      setSurgeActive(isSurgeActive());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const baseAmount = Number(fields.amount);
  const surgePrice =
    surgeActive && baseAmount > 0 ? getSurgePrice(baseAmount) : null;

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!fields.category) errs.category = "Please select a category.";
    if (!fields.storeLocation.trim())
      errs.storeLocation = "Store location is required.";
    if (!fields.amount || Number(fields.amount) <= 0)
      errs.amount = "Enter a valid amount greater than 0.";
    if (!fields.contactNumber.trim()) {
      errs.contactNumber = "Contact number is required.";
    } else if (!/^\d{10}$/.test(fields.contactNumber.trim())) {
      errs.contactNumber = "Enter a valid 10-digit phone number.";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const currentActor = actorRef.current;
    if (!currentActor) {
      setSubmitError(
        "Backend not connected. Please wait a moment and try again.",
      );
      return;
    }

    setIsLoading(true);
    setSubmitError(null);

    try {
      const finalAmount = surgePrice ?? baseAmount;
      const title = `${fields.category} at ${fields.storeLocation}`;
      const description = `Contact: ${fields.contactNumber}`;

      const id = await currentActor.createTask(
        title,
        description,
        fields.category,
        fields.storeLocation,
        BigInt(Math.round(finalAmount)),
        0n,
        0n,
      );

      if (id === null) {
        setSubmitError("Failed to create task. Please try again.");
      } else {
        setTaskId(id);
        setSubmitted(true);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setFields({
      category: "",
      storeLocation: "",
      amount: "",
      tip: null,
      contactNumber: "",
    });
    setErrors({});
    setSubmitted(false);
    setTaskId(null);
    setSubmitError(null);
  }

  const labelClass = "text-xs font-medium tracking-wide uppercase";
  const labelStyle: React.CSSProperties = { color: "rgba(255,255,255,0.5)" };
  const inputClass =
    "w-full rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all duration-200";

  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "#000000" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-lg rounded-2xl p-8 flex flex-col items-center gap-5 text-center"
          style={{
            background: "rgba(12,16,14,0.75)",
            border: "1px solid rgba(0,230,118,0.25)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 8px 40px rgba(0,230,118,0.12), 0 2px 8px rgba(0,0,0,0.6)",
          }}
          data-ocid="posttask.success_state"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(0,230,118,0.12)",
              border: "1.5px solid rgba(0,230,118,0.4)",
            }}
          >
            <CheckCircle2 size={32} style={{ color: "#00E676" }} />
          </div>
          <h2 className="text-2xl font-bold text-white">Task Posted!</h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            Your task has been submitted successfully. A tasker will reach out
            to you shortly.
          </p>
          {taskId && (
            <div
              className="px-4 py-2 rounded-xl text-xs font-mono"
              style={{
                background: "rgba(0,230,118,0.08)",
                border: "1px solid rgba(0,230,118,0.2)",
                color: "rgba(0,230,118,0.8)",
              }}
            >
              Task ID: {taskId}
            </div>
          )}
          {fields.tip && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(0,230,118,0.15)",
                color: "#00E676",
                border: "1px solid rgba(0,230,118,0.35)",
              }}
            >
              <Zap size={11} fill="#00E676" />
              Fast-Track Active
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="mt-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
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
      </div>
    );
  }

  const isConnecting = actorLoading && !actor;
  const submitDisabled = isLoading || isConnecting;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#000000" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        {/* Glass Card */}
        <div
          className="rounded-2xl p-7 sm:p-8"
          style={{
            background: "rgba(10,14,12,0.78)",
            border: "1px solid rgba(0,230,118,0.12)",
            backdropFilter: "blur(24px)",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.55), 0 0 60px rgba(0,230,118,0.06)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-7">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(0,230,118,0.12)",
                border: "1px solid rgba(0,230,118,0.25)",
              }}
            >
              <ClipboardList size={18} style={{ color: "#00E676" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Post a Task
                </h1>
                <AnimatePresence>
                  {surgeActive && (
                    <motion.span
                      key="surge-badge"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: "rgba(255,160,0,0.15)",
                        color: "#FFA000",
                        border: "1px solid rgba(255,160,0,0.4)",
                      }}
                      data-ocid="posttask.toggle"
                    >
                      <Zap size={10} fill="#FFA000" />
                      Surge Active
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <p
                className="text-xs mt-0.5"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Fill in the details below
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-5"
          >
            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="field-category"
                className={labelClass}
                style={labelStyle}
              >
                Category
              </label>
              <div className="relative">
                <select
                  id="field-category"
                  data-ocid="posttask.select"
                  value={fields.category}
                  onChange={(e) => {
                    setFields((prev) => ({
                      ...prev,
                      category: e.target.value as Category,
                    }));
                    if (errors.category)
                      setErrors((prev) => ({ ...prev, category: undefined }));
                  }}
                  className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-sm font-medium outline-none transition-all duration-200"
                  style={{
                    ...(errors.category ? inputError : inputBase),
                    color: fields.category ? "#fff" : "rgba(255,255,255,0.35)",
                  }}
                  onFocus={handleFocus}
                  onBlur={makeBlur(!!errors.category)}
                >
                  <option
                    value=""
                    disabled
                    style={{
                      background: "#000000",
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    Select a category
                  </option>
                  <option
                    value="Grocery"
                    style={{ background: "#000000", color: "#fff" }}
                  >
                    \uD83D\uDED2 Grocery
                  </option>
                  <option
                    value="Pharmacy"
                    style={{ background: "#000000", color: "#fff" }}
                  >
                    \uD83D\uDC8A Pharmacy
                  </option>
                  <option
                    value="Errands"
                    style={{ background: "#000000", color: "#fff" }}
                  >
                    \uD83D\uDCE6 Errands
                  </option>
                </select>
                <ChevronDown
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                />
              </div>
              <AnimatePresence>
                {errors.category && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs"
                    style={{ color: "#f87171" }}
                    data-ocid="posttask.error_state"
                  >
                    {errors.category}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Store Location */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="field-store"
                className={labelClass}
                style={labelStyle}
              >
                Store Location
              </label>
              <div className="relative">
                <MapPin
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
                <input
                  id="field-store"
                  data-ocid="posttask.input"
                  type="text"
                  placeholder="e.g. D-Mart, Koramangala"
                  value={fields.storeLocation}
                  onChange={(e) => {
                    setFields((prev) => ({
                      ...prev,
                      storeLocation: e.target.value,
                    }));
                    if (errors.storeLocation)
                      setErrors((prev) => ({
                        ...prev,
                        storeLocation: undefined,
                      }));
                  }}
                  className={inputClass}
                  style={errors.storeLocation ? inputError : inputBase}
                  onFocus={handleFocus}
                  onBlur={makeBlur(!!errors.storeLocation)}
                />
              </div>
              <AnimatePresence>
                {errors.storeLocation && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs"
                    style={{ color: "#f87171" }}
                    data-ocid="posttask.error_state"
                  >
                    {errors.storeLocation}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="field-amount"
                className={labelClass}
                style={labelStyle}
              >
                Amount
              </label>
              <div className="relative">
                <IndianRupee
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
                <input
                  id="field-amount"
                  data-ocid="posttask.input"
                  type="number"
                  min="1"
                  placeholder="0"
                  value={fields.amount}
                  onChange={(e) => {
                    setFields((prev) => ({ ...prev, amount: e.target.value }));
                    if (errors.amount)
                      setErrors((prev) => ({ ...prev, amount: undefined }));
                  }}
                  className={inputClass}
                  style={errors.amount ? inputError : inputBase}
                  onFocus={handleFocus}
                  onBlur={makeBlur(!!errors.amount)}
                />
              </div>
              <AnimatePresence>
                {errors.amount && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs"
                    style={{ color: "#f87171" }}
                    data-ocid="posttask.error_state"
                  >
                    {errors.amount}
                  </motion.p>
                )}
              </AnimatePresence>
              {/* Surge price preview */}
              <AnimatePresence>
                {surgePrice !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: "#FFA000" }}
                  >
                    <IndianRupee size={11} />
                    Surge price: \u20b9{surgePrice}
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>
                      (+20%)
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tip */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className={labelClass} style={labelStyle}>
                  Tip
                </span>
                <AnimatePresence>
                  {fields.tip !== null && (
                    <motion.span
                      key="fasttrack"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: "rgba(0,230,118,0.15)",
                        color: "#00E676",
                        border: "1px solid rgba(0,230,118,0.35)",
                      }}
                    >
                      <Zap size={10} fill="#00E676" />
                      Fast-Track
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex gap-2">
                {TIP_OPTIONS.map(({ label, value }) => {
                  const selected = fields.tip === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      data-ocid="posttask.toggle"
                      onClick={() =>
                        setFields((prev) => ({
                          ...prev,
                          tip: prev.tip === value ? null : value,
                        }))
                      }
                      className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95"
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
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                Optional \u2014 adds a tip for the tasker
              </p>
            </div>

            {/* Contact Number */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="field-contact"
                className={labelClass}
                style={labelStyle}
              >
                Contact Number <span style={{ color: "#f87171" }}>*</span>
              </label>
              <div className="relative">
                <Phone
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
                <input
                  id="field-contact"
                  data-ocid="posttask.input"
                  type="tel"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={fields.contactNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFields((prev) => ({ ...prev, contactNumber: val }));
                    if (errors.contactNumber)
                      setErrors((prev) => ({
                        ...prev,
                        contactNumber: undefined,
                      }));
                  }}
                  className={inputClass}
                  style={errors.contactNumber ? inputError : inputBase}
                  onFocus={handleFocus}
                  onBlur={makeBlur(!!errors.contactNumber)}
                />
              </div>
              <AnimatePresence>
                {errors.contactNumber && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs"
                    style={{ color: "#f87171" }}
                    data-ocid="posttask.error_state"
                  >
                    {errors.contactNumber}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit error */}
            <AnimatePresence>
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#f87171",
                  }}
                  data-ocid="posttask.error_state"
                >
                  {submitError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              data-ocid="posttask.submit_button"
              disabled={submitDisabled}
              whileHover={submitDisabled ? {} : { scale: 1.015 }}
              whileTap={submitDisabled ? {} : { scale: 0.97 }}
              className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 mt-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
                color: "#000000",
                boxShadow: submitDisabled
                  ? "none"
                  : "0 4px 20px rgba(0,230,118,0.3)",
              }}
            >
              {(isLoading || isConnecting) && (
                <Loader2 size={16} className="animate-spin" />
              )}
              {isConnecting
                ? "Connecting..."
                : isLoading
                  ? "Posting..."
                  : "Post Task"}
            </motion.button>
          </form>
        </div>
        {/* Task Turtle branding */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              overflow: "hidden",
              border: "1px solid rgba(0,230,118,0.25)",
            }}
          >
            <img
              src="/icon-192x192.png"
              alt="Task Turtle"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <span
            className="text-xs font-semibold"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            <span style={{ color: "rgba(0,230,118,0.7)" }}>Task</span> Turtle
          </span>
        </div>
      </motion.div>
    </div>
  );
}
