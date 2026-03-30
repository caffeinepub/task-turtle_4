import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { CheckCircle, ShieldCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { generateOTP, storeOTP, verifyOTP } from "../utils/otpUtils";

const GREEN = "#00E676";
const BORDER_NORMAL = "1px solid rgba(255,255,255,0.14)";
const BORDER_ERROR = "1px solid rgba(239,68,68,0.7)";

interface OTPVerificationProps {
  taskId: string;
  taskTitle: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function OTPVerification({
  taskId,
  taskTitle,
  onVerified,
  onCancel,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [shakeKey, setShakeKey] = useState(0);
  const verifiedRef = useRef(false);

  useEffect(() => {
    const generated = generateOTP();
    storeOTP(taskId, generated);
    setOtp(generated);
    setValue("");
    setStatus("idle");
    verifiedRef.current = false;
  }, [taskId]);

  function handleVerify() {
    if (value.length < 6) return;
    const valid = verifyOTP(taskId, value);
    if (valid) {
      setStatus("success");
      verifiedRef.current = true;
      setTimeout(() => {
        onVerified();
      }, 1800);
    } else {
      setStatus("error");
      setShakeKey((k) => k + 1);
      setTimeout(() => setStatus("idle"), 1200);
    }
  }

  const slotBorder = status === "error" ? BORDER_ERROR : BORDER_NORMAL;

  return (
    <div
      className="w-full max-w-md mx-auto rounded-2xl p-8"
      style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(0,230,118,0.15)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
      }}
      data-ocid="otp.modal"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${GREEN}22`, border: `1px solid ${GREEN}40` }}
          >
            <ShieldCheck size={20} style={{ color: GREEN }} />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">
              OTP Verification
            </h2>
            <p className="text-white/40 text-sm mt-0.5 truncate max-w-[200px]">
              {taskTitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-white/30 hover:text-white/70 transition-colors mt-1"
          aria-label="Close"
          data-ocid="otp.close_button"
        >
          <X size={20} />
        </button>
      </div>

      {/* OTP Display Box */}
      <div
        className="rounded-xl p-4 mb-7 text-center"
        style={{
          background: `${GREEN}0d`,
          border: `1px solid ${GREEN}40`,
          boxShadow: "0 0 20px rgba(0,230,118,0.15)",
        }}
      >
        <p className="text-white/50 text-xs uppercase tracking-widest mb-2">
          Share this OTP with your Turtle
        </p>
        <p
          className="text-4xl font-mono font-bold tracking-[0.35em] select-all"
          style={{ color: GREEN, textShadow: `0 0 16px ${GREEN}80` }}
          data-ocid="otp.panel"
        >
          {otp || "------"}
        </p>
        <p className="text-white/25 text-xs mt-2">
          The runner will enter this code to confirm delivery
        </p>
      </div>

      {/* Input section */}
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-6"
            data-ocid="otp.success_state"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: `${GREEN}22`,
                border: `2px solid ${GREEN}`,
                boxShadow: `0 0 32px ${GREEN}60, 0 0 64px ${GREEN}30`,
              }}
            >
              <CheckCircle size={32} style={{ color: GREEN }} />
            </motion.div>
            <p className="text-white font-bold text-lg">Task Verified!</p>
            <p className="text-white/40 text-sm">
              Delivery confirmed successfully
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-white/60 text-sm text-center mb-4">
              Enter the OTP to verify task completion
            </p>

            {/* OTP Input */}
            <motion.div
              key={shakeKey}
              animate={
                status === "error"
                  ? { x: [0, -8, 8, -6, 6, -4, 4, 0] }
                  : { x: 0 }
              }
              transition={{ duration: 0.45 }}
              className="flex justify-center mb-2"
            >
              <InputOTP
                maxLength={6}
                value={value}
                onChange={setValue}
                containerClassName="gap-3"
                data-ocid="otp.input"
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="w-11 h-12 text-base font-mono font-semibold text-white rounded-lg"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: slotBorder,
                        borderRight: slotBorder,
                      }}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </motion.div>

            {status === "error" && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm text-center mb-4"
                data-ocid="otp.error_state"
              >
                Incorrect OTP. Try again.
              </motion.p>
            )}

            {status !== "error" && <div className="mb-4" />}

            <Button
              className="w-full h-12 font-semibold text-sm rounded-xl transition-all duration-200"
              style={{
                background:
                  value.length === 6 ? GREEN : "rgba(255,255,255,0.06)",
                color: value.length === 6 ? "#000" : "rgba(255,255,255,0.3)",
                border:
                  value.length === 6
                    ? "none"
                    : "1px solid rgba(0,230,118,0.15)",
                boxShadow:
                  value.length === 6
                    ? "0 0 24px rgba(0,230,118,0.55), 0 0 48px rgba(0,230,118,0.2)"
                    : "none",
                cursor: value.length === 6 ? "pointer" : "not-allowed",
              }}
              onClick={handleVerify}
              disabled={value.length < 6}
              data-ocid="otp.submit_button"
            >
              Verify Task
            </Button>

            <button
              type="button"
              className="w-full mt-3 text-white/30 text-sm hover:text-white/60 transition-colors"
              onClick={onCancel}
              data-ocid="otp.cancel_button"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
