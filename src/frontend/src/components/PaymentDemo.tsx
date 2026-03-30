import { ArrowDown } from "lucide-react";
import { motion } from "motion/react";
import { PaymentButton } from "./PaymentButton";
import { PaymentStatus } from "./PaymentStatus";

const GREEN = "#00E676";

const FLOW_STAGES: Array<{
  status:
    | "PAYMENT_SUCCESSFUL"
    | "AWAITING_COMPLETION"
    | "PAYOUT_PENDING"
    | "COMPLETED";
  note: string;
}> = [
  { status: "PAYMENT_SUCCESSFUL", note: "Funds locked in escrow" },
  { status: "AWAITING_COMPLETION", note: "Turtle completes the task" },
  { status: "PAYOUT_PENDING", note: "Admin sends UPI manually" },
  { status: "COMPLETED", note: "Task fully resolved" },
];

export function PaymentDemo() {
  return (
    <section className="py-20 px-4" data-ocid="payment.section">
      <div className="max-w-6xl mx-auto">
        {/* Section label */}
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: GREEN }}
          >
            Payments & Escrow
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Secure payment, instant escrow
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="text-white/50 text-base max-w-md mx-auto"
          >
            Funds are held safely until task completion. Admin releases payout
            manually via UPI.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left: PaymentButton demo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-8"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(0,230,118,0.12)",
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-white/30 text-xs uppercase tracking-widest mb-5">
              Try the payment flow
            </p>
            <div className="mb-5">
              <p className="text-white font-semibold text-base mb-1">
                Grocery Pickup – Bandra
              </p>
              <p className="text-white/40 text-sm">Task ID: task-demo-001</p>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold" style={{ color: GREEN }}>
                ₹299
              </span>
              <span className="text-white/30 text-sm">INR</span>
            </div>
            <PaymentButton
              taskId="task-demo-001"
              amount={299}
              userId="user-demo"
              taskerUpiId="turtle@upi"
              taskTitle="Grocery Pickup – Bandra"
            />
          </motion.div>

          {/* Right: Flow diagram */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl p-8"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(0,230,118,0.12)",
              backdropFilter: "blur(16px)",
            }}
          >
            <p className="text-white/30 text-xs uppercase tracking-widest mb-6">
              Payment lifecycle
            </p>
            <div className="space-y-1">
              {FLOW_STAGES.map((stage, idx) => (
                <div key={stage.status}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <PaymentStatus status={stage.status} />
                      <p className="text-white/30 text-xs mt-1 ml-1">
                        {stage.note}
                      </p>
                    </div>
                  </div>
                  {idx < FLOW_STAGES.length - 1 && (
                    <div className="flex items-center ml-3 my-1">
                      <div
                        className="w-0.5 h-6 rounded-full"
                        style={{ background: "rgba(255,255,255,0.08)" }}
                      />
                      <ArrowDown size={12} className="text-white/20 -ml-1.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
