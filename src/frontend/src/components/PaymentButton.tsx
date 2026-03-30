import { AlertCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { PaymentStatus } from "./PaymentStatus";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const GREEN = "#00E676";
const CONFETTI_COLORS = [
  GREEN,
  "#FBB824",
  GREEN,
  "#FBB824",
  GREEN,
  "#FBB824",
  GREEN,
  "#FBB824",
];

const RAZORPAY_KEY_ID = "rzp_live_SRNbTwyEmzQSvO";
const RAZORPAY_KEY_SECRET = "0K3E0q0RIJhh44NQL4bfgInf";

interface PaymentButtonProps {
  taskId: string;
  amount: number;
  userId: string;
  taskerUpiId: string;
  taskTitle: string;
  onPaymentComplete?: (paymentId: string) => void;
}

type FlowState =
  | "idle"
  | "creating_order"
  | "checkout_open"
  | "verifying"
  | "success"
  | "failed";

async function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const message = `${orderId}|${paymentId}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  const hex = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === signature;
}

export function PaymentButton({
  taskId,
  amount,
  userId,
  taskerUpiId,
  taskTitle,
  onPaymentComplete,
}: PaymentButtonProps) {
  const { actor } = useActor();
  const [state, setState] = useState<FlowState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleStartPayment() {
    if (!actor) return;
    setState("creating_order");

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setErrorMsg("Failed to load payment gateway. Please try again.");
      setState("failed");
      return;
    }

    let orderId = `order_${taskId}_${Date.now()}`;

    try {
      const result = await actor.createRazorpayOrder(
        BigInt(amount),
        taskId,
        userId,
        taskerUpiId,
      );
      if (result.__kind__ !== "err" && result.ok) {
        orderId = result.ok;
      }
    } catch {
      // fallback to local order_id, backend will be updated separately
    }

    setState("checkout_open");

    const razorpay = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      amount: amount * 100,
      currency: "INR",
      name: "Task Turtle",
      description: taskTitle,
      order_id: orderId,
      theme: { color: GREEN },
      modal: {
        ondismiss: () => setState("idle"),
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        setState("verifying");
        try {
          const isValid = await verifyRazorpaySignature(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            RAZORPAY_KEY_SECRET,
          );

          if (!isValid) {
            setErrorMsg(
              "Signature verification failed. Please contact support.",
            );
            setState("failed");
            return;
          }

          const verifyResult = await actor.verifyPayment(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature,
            taskId,
            BigInt(amount),
            userId,
            taskerUpiId,
          );

          if (verifyResult.__kind__ === "err") {
            setErrorMsg(verifyResult.err);
            setState("failed");
            return;
          }

          setState("success");
          onPaymentComplete?.(response.razorpay_payment_id);
        } catch {
          setErrorMsg("Payment verification failed.");
          setState("failed");
        }
      },
    });

    razorpay.open();
  }

  if (state === "idle") {
    return (
      <button
        type="button"
        className="w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
        style={{
          background:
            "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
          color: "#000",
          boxShadow:
            "0 0 24px rgba(0,230,118,0.55), 0 0 48px rgba(0,230,118,0.2)",
        }}
        onClick={handleStartPayment}
        data-ocid="payment.primary_button"
      >
        Pay ₹{amount}
      </button>
    );
  }

  if (
    state === "creating_order" ||
    state === "verifying" ||
    state === "checkout_open"
  ) {
    return (
      <div className="flex items-center justify-center gap-3 h-12">
        <Loader2 size={18} className="animate-spin" style={{ color: GREEN }} />
        <span className="text-sm text-white/70">
          {state === "creating_order"
            ? "Creating order..."
            : state === "checkout_open"
              ? "Opening payment..."
              : "Verifying payment..."}
        </span>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div
        className="flex flex-col items-center gap-4"
        data-ocid="payment.success_state"
      >
        <div className="flex gap-2 flex-wrap justify-center">
          {CONFETTI_COLORS.map((color, i) => (
            <motion.div
              // biome-ignore lint/suspicious/noArrayIndexKey: confetti dots are static positional
              key={i}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], y: -20 }}
              transition={{ delay: i * 0.07, duration: 0.8 }}
              className="w-2 h-2 rounded-full"
              style={{ background: color }}
            />
          ))}
        </div>
        <PaymentStatus status="PAYMENT_SUCCESSFUL" />
        <p className="text-white/40 text-xs text-center">
          Funds held in escrow until task completion
        </p>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div
        className="flex flex-col items-center gap-3"
        data-ocid="payment.error_state"
      >
        <PaymentStatus status="FAILED" />
        {errorMsg && (
          <p className="text-red-400/70 text-xs flex items-center gap-1">
            <AlertCircle size={12} /> {errorMsg}
          </p>
        )}
        <button
          type="button"
          className="text-xs underline text-white/40 hover:text-white/70 transition-colors"
          onClick={() => {
            setState("idle");
            setErrorMsg("");
          }}
          data-ocid="payment.secondary_button"
        >
          Try again
        </button>
      </div>
    );
  }

  return null;
}
