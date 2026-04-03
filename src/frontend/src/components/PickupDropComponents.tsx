/**
 * PickupDropComponents.tsx
 * All Pickup-Drop Task UI — completely separate from Daily Task system.
 */

import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  Package,
  Phone,
  Truck,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { PublicPickupDropTask } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// ── Constants ─────────────────────────────────────────────────────────────────
const GREEN = "#00E676";
const BLUE = "#3B82F6";
const AMBER = "#F59E0B";
const CARD_BG = "rgba(255,255,255,0.04)";
const CARD_BORDER_GREEN = "1px solid rgba(0,230,118,0.12)";
const CARD_BORDER_BLUE = "1px solid rgba(59,130,246,0.25)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any;

function loadRazorpay(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    document.body.appendChild(s);
  });
}

function calcNetEarning(taskerFee: bigint | number, boostFee: bigint | number) {
  const gross = Number(taskerFee) + Number(boostFee);
  return +(gross * 0.85).toFixed(2);
}

function calcPlatformFee(productWorth: number): number {
  if (productWorth < 100) return 4;
  if (productWorth < 300) return 7;
  return 10;
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  outline: "none",
  width: "100%",
  transition: "border-color 0.2s",
};

export function PDStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    open: { bg: "rgba(59,130,246,0.15)", color: BLUE, label: "Open" },
    accepted: { bg: "rgba(245,158,11,0.15)", color: AMBER, label: "Accepted" },
    in_progress: {
      bg: "rgba(245,158,11,0.15)",
      color: AMBER,
      label: "In Progress",
    },
    completed: {
      bg: "rgba(0,230,118,0.15)",
      color: GREEN,
      label: "Completed ✓",
    },
    failed: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "Failed" },
  };
  const c = cfg[status] ?? {
    bg: "rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.5)",
    label: status,
  };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}

// ── Field (top-level — must NOT be inside any other component) ────────────────
function Field({
  label,
  id,
  value,
  placeholder,
  onChange,
  type = "text",
  error,
  icon,
  onClearError,
}: {
  label: string;
  id: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  icon?: React.ReactNode;
  onClearError?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        {label} <span style={{ color: "#f87171" }}>*</span>
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onClearError?.(id);
          }}
          style={{ ...inputStyle, paddingLeft: icon ? 36 : 14 }}
          data-ocid="pickupdrop.post.input"
        />
      </div>
      {error && (
        <p
          className="text-xs"
          style={{ color: "#f87171" }}
          data-ocid="pickupdrop.post.error_state"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ── PickupDropPostForm ──────────────────────────────────────────────────────
export function PickupDropPostForm({ onBack }: { onBack: () => void }) {
  const { actor } = useActor();
  const [submitted, setSubmitted] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [taskerFee, setTaskerFee] = useState(15);
  const [taskerFeeCustom, setTaskerFeeCustom] = useState("");
  const [boostFee, setBoostFee] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fields, setFields] = useState({
    pickupOwnerName: "",
    pickupContact: "",
    pickupLocation: "",
    dropOwnerName: "",
    dropContact: "",
    dropLocation: "",
    productWorth: "",
  });

  const productWorthNum = Number(fields.productWorth) || 0;
  const platformFee = calcPlatformFee(productWorthNum);
  const payAmount = taskerFee + boostFee + platformFee;

  function validate() {
    const e: Record<string, string> = {};
    if (!fields.pickupOwnerName.trim()) e.pickupOwnerName = "Required";
    if (!fields.pickupContact.trim()) e.pickupContact = "Required";
    if (!fields.pickupLocation.trim()) e.pickupLocation = "Required";
    if (!fields.dropOwnerName.trim()) e.dropOwnerName = "Required";
    if (!fields.dropContact.trim()) e.dropContact = "Required";
    if (!fields.dropLocation.trim()) e.dropLocation = "Required";
    if (!fields.productWorth || Number(fields.productWorth) <= 0)
      e.productWorth = "Enter a valid product worth";
    if (taskerFee < 10) e.taskerFee = "Minimum ₹10 required";
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
      await loadRazorpay();
    } catch {
      setSubmitError("Failed to load payment SDK.");
      setIsLoading(false);
      return;
    }
    const options = {
      key: "rzp_live_SRNbTwyEmzQSvO",
      amount: payAmount * 100,
      currency: "INR",
      name: "Task Turtle",
      description: "Pickup-Drop Task",
      theme: { color: GREEN },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id?: string;
      }) => {
        setIsLoading(true);
        setSubmitError(null);
        try {
          const id = await actor.createPickupDropTask(
            fields.pickupOwnerName,
            fields.pickupContact,
            fields.pickupLocation,
            fields.dropOwnerName,
            fields.dropContact,
            fields.dropLocation,
            BigInt(Math.round(Number(fields.productWorth))),
            BigInt(taskerFee),
            BigInt(boostFee),
            response.razorpay_order_id ?? "",
            response.razorpay_payment_id,
          );
          setTaskId(id);
          setSubmitted(true);
        } catch (err) {
          setSubmitError(
            err instanceof Error ? err.message : "Task creation failed.",
          );
        } finally {
          setIsLoading(false);
        }
      },
      modal: { ondismiss: () => setIsLoading(false) },
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

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5 py-12 text-center"
        data-ocid="pickupdrop.post.success_state"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: `${GREEN}20`, border: `2px solid ${GREEN}40` }}
        >
          <CheckCircle2 size={32} style={{ color: GREEN }} />
        </div>
        <div>
          <p className="text-xl font-bold text-white">Task Posted!</p>
          <p
            className="text-sm mt-1"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Your Pickup-Drop task is now live
          </p>
          {taskId && (
            <p
              className="text-xs mt-2 font-mono"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              ID: {taskId.slice(0, 16)}…
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setTaskId(null);
            setFields({
              pickupOwnerName: "",
              pickupContact: "",
              pickupLocation: "",
              dropOwnerName: "",
              dropContact: "",
              dropLocation: "",
              productWorth: "",
            });
            setTaskerFee(15);
            setTaskerFeeCustom("");
            setBoostFee(0);
            setErrors({});
          }}
          className="px-6 py-2.5 rounded-xl text-sm font-bold"
          style={{
            background: `linear-gradient(135deg, ${GREEN}, #00ff90)`,
            color: "#000",
          }}
          data-ocid="pickupdrop.post.primary_button"
        >
          Post Another
        </button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6 max-w-2xl"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold w-fit -mb-2"
        style={{ color: "rgba(255,255,255,0.5)" }}
        data-ocid="pickupdrop.post.cancel_button"
      >
        ← Back
      </button>

      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${BLUE}20`, border: `1px solid ${BLUE}40` }}
        >
          <Truck size={18} style={{ color: BLUE }} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">
            Post Pickup-Drop Task
          </h2>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Secure deposit-based delivery system
          </p>
        </div>
      </div>

      {/* Pickup Details */}
      <section
        className="flex flex-col gap-4 p-4 rounded-xl"
        style={{ background: CARD_BG, border: CARD_BORDER_BLUE }}
      >
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: BLUE }}
        >
          📦 Pickup Details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Pickup Owner Name"
            id="pickupOwnerName"
            value={fields.pickupOwnerName}
            placeholder="e.g. Rajesh Kumar"
            onChange={(v) => setFields((p) => ({ ...p, pickupOwnerName: v }))}
            error={errors.pickupOwnerName}
            onClearError={(id) => setErrors((p) => ({ ...p, [id]: "" }))}
          />
          <Field
            label="Pickup Contact"
            id="pickupContact"
            value={fields.pickupContact}
            placeholder="e.g. 9876543210"
            type="tel"
            onChange={(v) => setFields((p) => ({ ...p, pickupContact: v }))}
            error={errors.pickupContact}
            icon={
              <Phone size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
            }
            onClearError={(id) => setErrors((p) => ({ ...p, [id]: "" }))}
          />
        </div>
        <Field
          label="Pickup Location"
          id="pickupLocation"
          value={fields.pickupLocation}
          placeholder="e.g. Shop 12, MG Road, Bangalore"
          onChange={(v) => setFields((p) => ({ ...p, pickupLocation: v }))}
          error={errors.pickupLocation}
          icon={<MapPin size={13} style={{ color: "rgba(255,255,255,0.3)" }} />}
          onClearError={(id) => setErrors((p) => ({ ...p, [id]: "" }))}
        />
      </section>

      {/* Drop Details */}
      <section
        className="flex flex-col gap-4 p-4 rounded-xl"
        style={{ background: CARD_BG, border: CARD_BORDER_GREEN }}
      >
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: GREEN }}
        >
          📍 Drop Details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Drop Owner Name"
            id="dropOwnerName"
            value={fields.dropOwnerName}
            placeholder="e.g. Priya Sharma"
            onChange={(v) => setFields((p) => ({ ...p, dropOwnerName: v }))}
            error={errors.dropOwnerName}
            onClearError={(id) => setErrors((p) => ({ ...p, [id]: "" }))}
          />
          <Field
            label="Drop Contact"
            id="dropContact"
            value={fields.dropContact}
            placeholder="e.g. 9876543211"
            type="tel"
            onChange={(v) => setFields((p) => ({ ...p, dropContact: v }))}
            error={errors.dropContact}
            icon={
              <Phone size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
            }
            onClearError={(id) => setErrors((p) => ({ ...p, [id]: "" }))}
          />
        </div>
        <Field
          label="Drop Location"
          id="dropLocation"
          value={fields.dropLocation}
          placeholder="e.g. Flat 3B, Koramangala, Bangalore"
          onChange={(v) => setFields((p) => ({ ...p, dropLocation: v }))}
          error={errors.dropLocation}
          icon={<MapPin size={13} style={{ color: "rgba(255,255,255,0.3)" }} />}
          onClearError={(id) => setErrors((p) => ({ ...p, [id]: "" }))}
        />
      </section>

      {/* Task Details */}
      <section
        className="flex flex-col gap-4 p-4 rounded-xl"
        style={{
          background: "rgba(245,158,11,0.04)",
          border: "1px solid rgba(245,158,11,0.25)",
        }}
      >
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: AMBER }}
        >
          💰 Task & Pricing Details
        </p>

        {/* Product Worth */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="productWorth"
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Product Worth (₹) <span style={{ color: "#f87171" }}>*</span>
          </label>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            Security deposit — tasker pays upfront, returned after delivery
          </p>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: AMBER }}
            >
              ₹
            </span>
            <input
              id="productWorth"
              type="number"
              min={1}
              placeholder="e.g. 500"
              value={fields.productWorth}
              onChange={(e) => {
                setFields((p) => ({ ...p, productWorth: e.target.value }));
                setErrors((p) => ({ ...p, productWorth: "" }));
              }}
              style={{
                ...inputStyle,
                paddingLeft: 36,
                border: "1px solid rgba(245,158,11,0.4)",
                color: AMBER,
                fontWeight: 700,
              }}
              data-ocid="pickupdrop.post.input"
            />
          </div>
          {errors.productWorth && (
            <p
              className="text-xs"
              style={{ color: "#f87171" }}
              data-ocid="pickupdrop.post.error_state"
            >
              {errors.productWorth}
            </p>
          )}
        </div>

        {/* Tasker Fee */}
        <div className="flex flex-col gap-2">
          <div>
            <p
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Tasker Fee <span style={{ color: "#f87171" }}>*</span>
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Higher fee = faster acceptance ⚡
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                { value: 10, label: "₹10", sub: "Economy 🐢" },
                { value: 15, label: "₹15", sub: "Standard 🚶", rec: true },
                { value: 25, label: "₹25", sub: "Fast ⚡" },
                { value: 40, label: "₹40", sub: "Priority 🔥" },
              ] as const
            ).map((opt) => {
              const sel = taskerFee === opt.value && taskerFeeCustom === "";
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTaskerFee(opt.value);
                    setTaskerFeeCustom("");
                    setErrors((p) => ({ ...p, taskerFee: "" }));
                  }}
                  className="relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-2.5 text-xs font-semibold transition-all"
                  style={{
                    background: sel
                      ? "rgba(0,230,118,0.18)"
                      : "rgba(255,255,255,0.04)",
                    border: sel
                      ? "1.5px solid rgba(0,230,118,0.6)"
                      : "1px solid rgba(255,255,255,0.1)",
                    color: sel ? GREEN : "rgba(255,255,255,0.6)",
                  }}
                  data-ocid="pickupdrop.post.toggle"
                >
                  {"rec" in opt && opt.rec && (
                    <span
                      className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
                      style={{ background: GREEN, color: "#000" }}
                    >
                      Rec.
                    </span>
                  )}
                  <span className="font-bold text-sm">{opt.label}</span>
                  <span className="text-[10px] opacity-70">{opt.sub}</span>
                </button>
              );
            })}
          </div>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
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
                if (!Number.isNaN(n) && n > 0) {
                  setTaskerFee(n);
                  setErrors((p) => ({ ...p, taskerFee: "" }));
                }
              }}
              style={{ ...inputStyle, paddingLeft: 28 }}
              data-ocid="pickupdrop.post.input"
            />
          </div>
          {errors.taskerFee && (
            <p
              className="text-xs"
              style={{ color: "#f87171" }}
              data-ocid="pickupdrop.post.error_state"
            >
              {errors.taskerFee}
            </p>
          )}
        </div>

        {/* Boost Fee */}
        <div className="flex flex-col gap-2">
          <p
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Boost Fee 🚀 (optional)
          </p>
          <div className="flex gap-2">
            {[0, 10, 20].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setBoostFee(v)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background:
                    boostFee === v
                      ? "rgba(0,230,118,0.18)"
                      : "rgba(255,255,255,0.04)",
                  border:
                    boostFee === v
                      ? "1.5px solid rgba(0,230,118,0.6)"
                      : "1px solid rgba(255,255,255,0.1)",
                  color: boostFee === v ? GREEN : "rgba(255,255,255,0.5)",
                }}
                data-ocid="pickupdrop.post.toggle"
              >
                {v === 0 ? "No boost" : `+₹${v}`}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Payment summary */}
      {payAmount > 0 && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{
            background: "rgba(0,230,118,0.06)",
            border: "1px solid rgba(0,230,118,0.2)",
          }}
        >
          <div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              Total Payable
            </p>
            <p className="text-xl font-bold" style={{ color: GREEN }}>
              ₹{payAmount}
            </p>
            <div className="flex flex-col gap-0.5 mt-1">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                Tasker Fee ₹{taskerFee}
                {boostFee > 0 ? ` + Boost ₹${boostFee}` : ""}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                Platform Fee ₹{platformFee}
              </p>
            </div>
          </div>
          <Package size={20} style={{ color: `${GREEN}50` }} />
        </div>
      )}

      {submitError && (
        <p
          className="text-sm text-center px-4 py-3 rounded-xl"
          style={{
            background: "rgba(239,68,68,0.08)",
            color: "#f87171",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
          data-ocid="pickupdrop.post.error_state"
        >
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || taskerFee < 10}
        className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
        style={{
          background:
            taskerFee >= 10
              ? `linear-gradient(135deg, ${GREEN} 0%, #00ff90 55%, ${GREEN} 100%)`
              : "rgba(255,255,255,0.05)",
          color: taskerFee >= 10 ? "#000" : "rgba(255,255,255,0.3)",
          boxShadow: taskerFee >= 10 ? `0 0 16px ${GREEN}30` : "none",
        }}
        data-ocid="pickupdrop.post.submit_button"
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin inline mr-1.5" />
        ) : null}
        {isLoading ? "Processing…" : `Pay ₹${payAmount} & Post Task`}
      </button>
    </form>
  );
}

// ── PickupDropAcceptModal ──────────────────────────────────────────────────
function PickupDropAcceptModal({
  task,
  onClose,
  onAccepted,
}: {
  task: PublicPickupDropTask;
  onClose: () => void;
  onAccepted: (id: string) => void;
}) {
  const { actor } = useActor();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handlePay() {
    if (!actor) return;
    setLoading(true);
    setError(null);
    try {
      await loadRazorpay();
    } catch {
      setError("Failed to load payment SDK.");
      setLoading(false);
      return;
    }
    const options = {
      key: "rzp_live_SRNbTwyEmzQSvO",
      amount: Number(task.productWorth) * 100,
      currency: "INR",
      name: "Task Turtle — Security Deposit",
      description: `Pickup-Drop deposit for task ${task.id.slice(0, 8)}`,
      theme: { color: GREEN },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id?: string;
      }) => {
        setLoading(true);
        try {
          const result = await actor.acceptPickupDropTask(
            task.id,
            response.razorpay_order_id ?? "",
            response.razorpay_payment_id,
          );
          if (result.__kind__ === "ok") {
            setSuccess(true);
            onAccepted(task.id);
          } else setError(result.err ?? "Failed to accept task.");
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Something went wrong.",
          );
        } finally {
          setLoading(false);
        }
      },
      modal: { ondismiss: () => setLoading(false) },
    };
    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to open payment modal.",
      );
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      data-ocid="pickupdrop.dialog"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: "#0a0a0a",
          border: "1px solid rgba(245,158,11,0.3)",
        }}
      >
        {success ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircle2 size={40} style={{ color: GREEN }} />
            <p className="text-lg font-bold text-white">Task Accepted!</p>
            <p
              className="text-xs text-center"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Check "My Pickup-Drop Tasks" for full details
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: GREEN, color: "#000" }}
              data-ocid="pickupdrop.dialog.close_button"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-bold">Pay Security Deposit</p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  To accept this task
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg"
                style={{ color: "rgba(255,255,255,0.4)" }}
                data-ocid="pickupdrop.dialog.close_button"
              >
                <X size={16} />
              </button>
            </div>

            <div
              className="flex flex-col gap-3 p-4 rounded-xl"
              style={{
                background: "rgba(245,158,11,0.07)",
                border: "1px solid rgba(245,158,11,0.25)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Product Worth
                </span>
                <span className="text-xl font-bold" style={{ color: AMBER }}>
                  ₹{Number(task.productWorth)}
                </span>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                This amount is returned to you after successful delivery
              </p>
            </div>

            <div
              className="flex items-center justify-between p-3 rounded-xl"
              style={{
                background: "rgba(0,230,118,0.07)",
                border: `1px solid ${GREEN}25`,
              }}
            >
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                You'll earn
              </span>
              <span className="text-sm font-bold" style={{ color: GREEN }}>
                ₹{calcNetEarning(task.taskerFee, task.boostFee)}
              </span>
            </div>

            <div
              className="text-xs px-3 py-2.5 rounded-xl"
              style={{
                background: "rgba(59,130,246,0.08)",
                color: "rgba(255,255,255,0.5)",
                border: `1px solid ${BLUE}25`,
              }}
            >
              📋 {task.pickupLocation} → {task.dropLocation}
            </div>

            {error && (
              <p
                className="text-xs text-center"
                style={{ color: "#f87171" }}
                data-ocid="pickupdrop.dialog.error_state"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handlePay}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${AMBER}, #f97316)`,
                color: "#000",
              }}
              data-ocid="pickupdrop.dialog.confirm_button"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin inline mr-1.5" />
              ) : null}
              {loading
                ? "Processing…"
                : `Pay ₹${Number(task.productWorth)} & Accept`}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── PickupDropFindTasks ────────────────────────────────────────────────────
export function PickupDropFindTasks() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const [tasks, setTasks] = useState<PublicPickupDropTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [modalTask, setModalTask] = useState<PublicPickupDropTask | null>(null);
  const myPrincipal = identity?.getPrincipal().toString();

  const fetchTasks = async () => {
    if (!actor) return;
    try {
      const all = await actor.getPickupDropTasks();
      const filtered = all.filter(
        (t) => t.status === "open" && t.poster.toString() !== myPrincipal,
      );
      setTasks(filtered);
    } catch {
      /* silently handle */
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!actor || isFetching) return;
    fetchTasks().finally(() => setLoading(false));
    const iv = setInterval(fetchTasks, 5000);
    return () => clearInterval(iv);
  }, [actor, isFetching]);

  if (loading)
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="pickupdrop.find.loading_state"
      >
        <Loader2 size={24} className="animate-spin" style={{ color: BLUE }} />
      </div>
    );

  if (tasks.length === 0)
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        data-ocid="pickupdrop.find.empty_state"
      >
        <Truck size={36} style={{ color: "rgba(255,255,255,0.15)" }} />
        <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          No Pickup-Drop tasks available
        </p>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
          Check back later — new tasks are posted frequently
        </p>
      </div>
    );

  return (
    <>
      <div className="flex flex-col gap-4" data-ocid="pickupdrop.find.list">
        {tasks.map((task, i) => {
          const netEarning = calcNetEarning(task.taskerFee, task.boostFee);
          const isAccepted = acceptedIds.has(task.id);
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              data-ocid={`pickupdrop.find.item.${i + 1}`}
            >
              <div
                className="rounded-xl p-5 flex flex-col gap-4"
                style={{
                  background: "rgba(59,130,246,0.04)",
                  border: "1px solid rgba(59,130,246,0.18)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: `${BLUE}20`,
                      color: BLUE,
                      border: `1px solid ${BLUE}40`,
                    }}
                  >
                    🔵 Pickup-Drop
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {new Date(
                      Number(task.createdAt) / 1_000_000,
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} style={{ color: BLUE }} />
                    <span className="text-xs font-medium text-white">
                      {task.pickupLocation.length > 30
                        ? `${task.pickupLocation.slice(0, 30)}…`
                        : task.pickupLocation}
                    </span>
                  </div>
                  <ArrowRight
                    size={12}
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  />
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} style={{ color: GREEN }} />
                    <span className="text-xs font-medium text-white">
                      {task.dropLocation.length > 30
                        ? `${task.dropLocation.slice(0, 30)}…`
                        : task.dropLocation}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="flex flex-col gap-1 p-3 rounded-xl"
                    style={{
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    <span
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      Product Worth
                    </span>
                    <span
                      className="text-lg font-bold"
                      style={{ color: AMBER }}
                    >
                      ₹{Number(task.productWorth)}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      Security deposit
                    </span>
                  </div>
                  <div
                    className="flex flex-col gap-1 p-3 rounded-xl"
                    style={{
                      background: "rgba(0,230,118,0.08)",
                      border: `1px solid ${GREEN}30`,
                    }}
                  >
                    <span
                      className="text-xs"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      You Earn
                    </span>
                    <span
                      className="text-lg font-bold"
                      style={{ color: GREEN }}
                    >
                      ₹{netEarning}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      after platform fee
                    </span>
                  </div>
                </div>

                {isAccepted ? (
                  <div
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                    style={{ color: GREEN }}
                  >
                    <CheckCircle2 size={15} /> Accepted! Check My Tasks
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalTask(task)}
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${BLUE} 0%, #60a5fa 100%)`,
                      color: "#fff",
                      boxShadow: `0 0 14px ${BLUE}30`,
                    }}
                    data-ocid={`pickupdrop.find.primary_button.${i + 1}`}
                  >
                    Accept Task
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {modalTask && (
          <PickupDropAcceptModal
            task={modalTask}
            onClose={() => setModalTask(null)}
            onAccepted={(id) => {
              setAcceptedIds((prev) => new Set([...prev, id]));
              setModalTask(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── MyPickupDropTasks ──────────────────────────────────────────────────────
export function MyPickupDropTasks() {
  const { actor, isFetching } = useActor();
  const [postedTasks, setPostedTasks] = useState<PublicPickupDropTask[]>([]);
  const [acceptedTasks, setAcceptedTasks] = useState<PublicPickupDropTask[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Record<string, string>>({});
  const [actionSuccess, setActionSuccess] = useState<Record<string, string>>(
    {},
  );

  const fetchAll = async () => {
    if (!actor) return;
    const [posted, accepted] = await Promise.all([
      actor.getMyPickupDropPostedTasks(),
      actor.getMyPickupDropAcceptedTasks(),
    ]);
    setPostedTasks(posted);
    setAcceptedTasks(accepted);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!actor || isFetching) return;
    fetchAll().finally(() => setLoading(false));
    const iv = setInterval(fetchAll, 5000);
    return () => clearInterval(iv);
  }, [actor, isFetching]);

  async function handleConfirmPickup(taskId: string) {
    if (!actor) return;
    setActionLoading(taskId);
    setActionError((p) => ({ ...p, [taskId]: "" }));
    try {
      const result = await actor.completePickupDropPickup(
        taskId,
        otpInputs[taskId] ?? "",
      );
      if (result.__kind__ === "ok") {
        setActionSuccess((p) => ({ ...p, [taskId]: "Pickup confirmed!" }));
        await fetchAll();
      } else
        setActionError((p) => ({ ...p, [taskId]: result.err ?? "Failed" }));
    } catch (err) {
      setActionError((p) => ({
        ...p,
        [taskId]: err instanceof Error ? err.message : "Failed",
      }));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConfirmDelivery(taskId: string) {
    if (!actor) return;
    setActionLoading(taskId);
    setActionError((p) => ({ ...p, [taskId]: "" }));
    try {
      const result = await actor.completePickupDropDelivery(
        taskId,
        otpInputs[taskId] ?? "",
      );
      if (result.__kind__ === "ok") {
        setActionSuccess((p) => ({
          ...p,
          [taskId]: "Delivery confirmed! Payout will be released.",
        }));
        await fetchAll();
      } else
        setActionError((p) => ({ ...p, [taskId]: result.err ?? "Failed" }));
    } catch (err) {
      setActionError((p) => ({
        ...p,
        [taskId]: err instanceof Error ? err.message : "Failed",
      }));
    } finally {
      setActionLoading(null);
    }
  }

  if (loading)
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="pickupdrop.mytasks.loading_state"
      >
        <Loader2 size={24} className="animate-spin" style={{ color: BLUE }} />
      </div>
    );

  if (postedTasks.length === 0 && acceptedTasks.length === 0)
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        data-ocid="pickupdrop.mytasks.empty_state"
      >
        <Truck size={36} style={{ color: "rgba(255,255,255,0.15)" }} />
        <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          No Pickup-Drop tasks yet
        </p>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
          Post a task or accept one to see it here
        </p>
      </div>
    );

  return (
    <div className="flex flex-col gap-6" data-ocid="pickupdrop.mytasks.list">
      {postedTasks.length > 0 && (
        <section>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: BLUE }}
          >
            🔵 My Posted Pickup-Drop Tasks
          </p>
          <div className="flex flex-col gap-3">
            {postedTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                data-ocid={`pickupdrop.mytasks.item.${i + 1}`}
              >
                <div
                  className="rounded-xl p-4 flex flex-col gap-3"
                  style={{
                    background: "rgba(59,130,246,0.04)",
                    border: "1px solid rgba(59,130,246,0.18)",
                  }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <PDStatusBadge status={task.status} />
                    <span
                      className="text-xs font-mono"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      {task.id.slice(0, 12)}…
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    <MapPin size={11} style={{ color: BLUE }} />
                    <span>{task.pickupLocation}</span>
                    <ArrowRight
                      size={10}
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    />
                    <MapPin size={11} style={{ color: GREEN }} />
                    <span>{task.dropLocation}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{
                        background: "rgba(245,158,11,0.1)",
                        color: AMBER,
                      }}
                    >
                      Worth ₹{Number(task.productWorth)}
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{
                        background: "rgba(0,230,118,0.1)",
                        color: GREEN,
                      }}
                    >
                      Fee ₹{Number(task.taskerFee)}
                      {Number(task.boostFee) > 0
                        ? ` + Boost ₹${Number(task.boostFee)}`
                        : ""}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {acceptedTasks.length > 0 && (
        <section>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: GREEN }}
          >
            🚚 My Active Pickup-Drop Deliveries
          </p>
          <div className="flex flex-col gap-4">
            {acceptedTasks.map((task, i) => {
              const netEarning = calcNetEarning(task.taskerFee, task.boostFee);
              const isActing = actionLoading === task.id;
              const succMsg = actionSuccess[task.id];
              const errMsg = actionError[task.id];
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  data-ocid={`pickupdrop.mytasks.active.item.${i + 1}`}
                >
                  <div
                    className="rounded-xl p-4 flex flex-col gap-4"
                    style={{ background: CARD_BG, border: CARD_BORDER_GREEN }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <PDStatusBadge status={task.status} />
                      <span
                        className="text-xs font-mono"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {task.id.slice(0, 12)}…
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        className="p-3 rounded-xl flex flex-col gap-2"
                        style={{
                          background: `${BLUE}10`,
                          border: `1px solid ${BLUE}25`,
                        }}
                      >
                        <p
                          className="text-xs font-bold uppercase tracking-wide"
                          style={{ color: BLUE }}
                        >
                          📦 Pickup
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {task.pickupOwnerName}
                        </p>
                        <a
                          href={`tel:${task.pickupContact}`}
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: BLUE }}
                        >
                          <Phone size={11} /> {task.pickupContact}
                        </a>
                        <p
                          className="text-xs"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          <MapPin
                            size={10}
                            className="inline mr-1"
                            style={{ color: BLUE }}
                          />
                          {task.pickupLocation}
                        </p>
                      </div>
                      <div
                        className="p-3 rounded-xl flex flex-col gap-2"
                        style={{
                          background: `${GREEN}10`,
                          border: `1px solid ${GREEN}25`,
                        }}
                      >
                        <p
                          className="text-xs font-bold uppercase tracking-wide"
                          style={{ color: GREEN }}
                        >
                          📍 Drop
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {task.dropOwnerName}
                        </p>
                        <a
                          href={`tel:${task.dropContact}`}
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: GREEN }}
                        >
                          <Phone size={11} /> {task.dropContact}
                        </a>
                        <p
                          className="text-xs"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          <MapPin
                            size={10}
                            className="inline mr-1"
                            style={{ color: GREEN }}
                          />
                          {task.dropLocation}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex flex-col gap-2 p-3 rounded-xl"
                      style={{
                        background: "rgba(0,230,118,0.05)",
                        border: `1px solid ${GREEN}20`,
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className="text-xs"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          🧾 Product Worth (deposit)
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: AMBER }}
                        >
                          ₹{Number(task.productWorth)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span
                          className="text-xs"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          💰 Gross Earning
                        </span>
                        <span className="text-xs font-bold text-white">
                          ₹{Number(task.taskerFee) + Number(task.boostFee)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span
                          className="text-xs"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                          Platform Fee (15%)
                        </span>
                        <span className="text-xs" style={{ color: "#f87171" }}>
                          -₹
                          {
                            +(
                              (Number(task.taskerFee) + Number(task.boostFee)) *
                              0.15
                            ).toFixed(2)
                          }
                        </span>
                      </div>
                      <div
                        className="flex justify-between items-center pt-2 border-t"
                        style={{ borderColor: `${GREEN}20` }}
                      >
                        <span
                          className="text-xs font-bold"
                          style={{ color: GREEN }}
                        >
                          🔥 You Earn (Final)
                        </span>
                        <span
                          className="text-sm font-black"
                          style={{ color: GREEN }}
                        >
                          ₹{netEarning}
                        </span>
                      </div>
                    </div>

                    {task.status !== "completed" &&
                      task.status !== "failed" && (
                        <div className="flex flex-col gap-3">
                          <input
                            type="text"
                            placeholder={`Enter OTP to ${task.status === "accepted" ? "confirm pickup" : "confirm delivery"}`}
                            value={otpInputs[task.id] ?? ""}
                            onChange={(e) =>
                              setOtpInputs((p) => ({
                                ...p,
                                [task.id]: e.target.value,
                              }))
                            }
                            style={inputStyle}
                            data-ocid={`pickupdrop.mytasks.active.input.${i + 1}`}
                          />
                          {errMsg && (
                            <p
                              className="text-xs"
                              style={{ color: "#f87171" }}
                              data-ocid={`pickupdrop.mytasks.active.error_state.${i + 1}`}
                            >
                              {errMsg}
                            </p>
                          )}
                          {succMsg && (
                            <p
                              className="text-xs font-semibold"
                              style={{ color: GREEN }}
                              data-ocid={`pickupdrop.mytasks.active.success_state.${i + 1}`}
                            >
                              {succMsg}
                            </p>
                          )}

                          {task.status === "accepted" && (
                            <button
                              type="button"
                              onClick={() => handleConfirmPickup(task.id)}
                              disabled={isActing || !otpInputs[task.id]}
                              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                              style={{
                                background: `linear-gradient(135deg, ${BLUE} 0%, #60a5fa 100%)`,
                                color: "#fff",
                              }}
                              data-ocid={`pickupdrop.mytasks.active.primary_button.${i + 1}`}
                            >
                              {isActing ? (
                                <Loader2
                                  size={13}
                                  className="animate-spin inline mr-1.5"
                                />
                              ) : null}
                              Confirm Pickup
                            </button>
                          )}
                          {task.status === "in_progress" && (
                            <button
                              type="button"
                              onClick={() => handleConfirmDelivery(task.id)}
                              disabled={isActing || !otpInputs[task.id]}
                              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                              style={{
                                background: `linear-gradient(135deg, ${GREEN} 0%, #00ff90 100%)`,
                                color: "#000",
                              }}
                              data-ocid={`pickupdrop.mytasks.active.primary_button.${i + 1}`}
                            >
                              {isActing ? (
                                <Loader2
                                  size={13}
                                  className="animate-spin inline mr-1.5"
                                />
                              ) : null}
                              Confirm Delivery
                            </button>
                          )}
                        </div>
                      )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// ── PickupDropAdminTab ────────────────────────────────────────────────────
export function PickupDropAdminTab() {
  const { actor, isFetching } = useActor();
  const [tasks, setTasks] = useState<PublicPickupDropTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [failingId, setFailingId] = useState<string | null>(null);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchTasks = async () => {
    if (!actor) return;
    try {
      const all = await actor.getAllPickupDropTasksAdmin();
      setTasks(all);
    } catch {
      /* silently handle */
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!actor || isFetching) return;
    fetchTasks().finally(() => setLoading(false));
  }, [actor, isFetching]);

  async function handleFail(taskId: string) {
    if (!actor) return;
    setFailingId(taskId);
    try {
      await actor.failPickupDropTask(taskId);
      setFailedIds((prev) => new Set([...prev, taskId]));
      await fetchTasks();
    } catch {
      /* silently handle */
    } finally {
      setFailingId(null);
    }
  }

  const filtered = tasks.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.pickupLocation.toLowerCase().includes(q) ||
      t.dropLocation.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: tasks.length,
    open: tasks.filter((t) => t.status === "open").length,
    inProgress: tasks.filter(
      (t) => t.status === "accepted" || t.status === "in_progress",
    ).length,
    completed: tasks.filter((t) => t.status === "completed").length,
    failed: tasks.filter((t) => t.status === "failed").length,
    revenue: tasks.reduce(
      (acc, t) =>
        acc + +((Number(t.taskerFee) + Number(t.boostFee)) * 0.15).toFixed(2),
      0,
    ),
  };

  if (loading)
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="pickupdrop.admin.loading_state"
      >
        <Loader2 size={28} className="animate-spin" style={{ color: BLUE }} />
      </div>
    );

  return (
    <div className="flex flex-col gap-6" data-ocid="pickupdrop.admin.panel">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(
          [
            { label: "Total", value: stats.total, color: "#fff" },
            { label: "Open", value: stats.open, color: BLUE },
            { label: "In Progress", value: stats.inProgress, color: AMBER },
            { label: "Completed", value: stats.completed, color: GREEN },
            { label: "Failed", value: stats.failed, color: "#f87171" },
            {
              label: "Platform Revenue",
              value: `₹${stats.revenue.toFixed(0)}`,
              color: GREEN,
            },
          ] as { label: string; value: string | number; color: string }[]
        ).map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-1 p-3 rounded-xl"
            style={{ background: CARD_BG, border: CARD_BORDER_GREEN }}
          >
            <span
              className="text-xs"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {s.label}
            </span>
            <span className="text-xl font-black" style={{ color: s.color }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative" style={{ maxWidth: 560 }}>
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
          style={{ color: "rgba(255,255,255,0.3)", pointerEvents: "none" }}
        >
          🔍
        </span>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search by ID, location, or status…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 36 }}
          data-ocid="pickupdrop.admin.search_input"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="pickupdrop.admin.empty_state"
        >
          <Truck size={32} style={{ color: "rgba(255,255,255,0.15)" }} />
          <p
            className="mt-3 text-sm"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            No Pickup-Drop tasks found
          </p>
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-xl"
          style={{ border: CARD_BORDER_GREEN }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderBottom: CARD_BORDER_GREEN,
                }}
              >
                {[
                  "Task ID",
                  "Route",
                  "Worth",
                  "Tasker Fee",
                  "Net Earn",
                  "Status",
                  "Posted",
                  "Poster",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-3 text-left font-semibold"
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((task, i) => {
                const netEarning = calcNetEarning(
                  task.taskerFee,
                  task.boostFee,
                );
                const canFail =
                  task.status !== "completed" && task.status !== "failed";
                const isFailing = failingId === task.id;
                return (
                  <tr
                    key={task.id}
                    style={{
                      background:
                        i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                    data-ocid={`pickupdrop.admin.row.${i + 1}`}
                  >
                    <td
                      className="px-3 py-3"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {task.id.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 text-white">
                        <span>
                          {task.pickupLocation.slice(0, 15)}
                          {task.pickupLocation.length > 15 ? "…" : ""}
                        </span>
                        <ArrowRight
                          size={10}
                          style={{ color: "rgba(255,255,255,0.3)" }}
                        />
                        <span>
                          {task.dropLocation.slice(0, 15)}
                          {task.dropLocation.length > 15 ? "…" : ""}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-3 py-3"
                      style={{ color: AMBER, fontWeight: 700 }}
                    >
                      ₹{Number(task.productWorth)}
                    </td>
                    <td className="px-3 py-3 text-white">
                      ₹{Number(task.taskerFee)}
                      {Number(task.boostFee) > 0 ? (
                        <span style={{ color: GREEN }}>
                          {" "}
                          +₹{Number(task.boostFee)}
                        </span>
                      ) : null}
                    </td>
                    <td
                      className="px-3 py-3"
                      style={{ color: GREEN, fontWeight: 700 }}
                    >
                      ₹{netEarning}
                    </td>
                    <td className="px-3 py-3">
                      <PDStatusBadge
                        status={failedIds.has(task.id) ? "failed" : task.status}
                      />
                    </td>
                    <td
                      className="px-3 py-3"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {new Date(
                        Number(task.createdAt) / 1_000_000,
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td
                      className="px-3 py-3"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {task.poster.toString().slice(0, 10)}…
                    </td>
                    <td className="px-3 py-3">
                      {canFail && !failedIds.has(task.id) ? (
                        <button
                          type="button"
                          onClick={() => handleFail(task.id)}
                          disabled={isFailing}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                          style={{
                            background: "rgba(239,68,68,0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(239,68,68,0.3)",
                          }}
                          data-ocid={`pickupdrop.admin.delete_button.${i + 1}`}
                        >
                          {isFailing ? (
                            <Loader2
                              size={11}
                              className="animate-spin inline mr-1"
                            />
                          ) : null}
                          Fail Task
                        </button>
                      ) : (
                        <span style={{ color: "rgba(255,255,255,0.2)" }}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
