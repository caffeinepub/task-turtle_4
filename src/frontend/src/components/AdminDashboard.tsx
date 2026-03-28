import { Copy, Loader2, Lock, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { EscrowPayment } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { PaymentStatus } from "./PaymentStatus";

const GREEN = "#00E676";

export function AdminDashboard() {
  const { actor } = useActor();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [payments, setPayments] = useState<EscrowPayment[]>([]);
  const [loadingPayout, setLoadingPayout] = useState<Record<string, boolean>>(
    {},
  );
  const [isFetchingPayments, setIsFetchingPayments] = useState(false);

  useEffect(() => {
    if (!actor) return;
    actor.isCallerAdmin().then((admin) => {
      setIsAdmin(admin);
      if (admin) fetchPayments();
    });
  }, [actor]);

  async function fetchPayments() {
    if (!actor) return;
    setIsFetchingPayments(true);
    try {
      const list = await actor.getPayments();
      setPayments(list);
    } finally {
      setIsFetchingPayments(false);
    }
  }

  async function handleMarkPaid(paymentId: string) {
    if (!actor) return;
    setLoadingPayout((prev) => ({ ...prev, [paymentId]: true }));
    try {
      await actor.markPayoutComplete(paymentId);
      await fetchPayments();
    } finally {
      setLoadingPayout((prev) => ({ ...prev, [paymentId]: false }));
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  if (isAdmin === null) {
    return (
      <div
        className="flex items-center justify-center h-32"
        data-ocid="admin.loading_state"
      >
        <Loader2 size={20} className="animate-spin" style={{ color: GREEN }} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 py-16 text-center"
        data-ocid="admin.error_state"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <Lock size={24} className="text-red-400" />
        </div>
        <h3 className="text-white font-bold text-lg">Access Denied</h3>
        <p className="text-white/40 text-sm max-w-xs">
          You don't have admin privileges to view this dashboard.
        </p>
      </motion.div>
    );
  }

  const paidPayments = payments.filter((p) => p.status === "PAID");
  const completedPayments = payments.filter((p) => p.status === "COMPLETED");
  const totalPending = paidPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );

  return (
    <div className="w-full" data-ocid="admin.panel">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-white font-bold text-2xl mb-1">
            Admin Payout Dashboard
          </h2>
          <p className="text-white/40 text-sm">Manual UPI Payout System</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          onClick={fetchPayments}
          disabled={isFetchingPayments}
          data-ocid="admin.secondary_button"
        >
          <RefreshCw
            size={13}
            className={isFetchingPayments ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Total Pending", value: `₹${totalPending}`, accent: GREEN },
          {
            label: "Awaiting Payout",
            value: paidPayments.length,
            accent: "#FBB824",
          },
          {
            label: "Completed",
            value: completedPayments.length,
            accent: "#818CF8",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4 text-center"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p
              className="text-2xl font-bold mb-1"
              style={{ color: stat.accent }}
            >
              {stat.value}
            </p>
            <p className="text-white/40 text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Payments list */}
      {payments.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px dashed rgba(255,255,255,0.08)",
          }}
          data-ocid="admin.empty_state"
        >
          <p className="text-white/30 text-sm">
            No payments yet. Payments will appear here once users complete
            checkout.
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-ocid="admin.list">
          <AnimatePresence>
            {payments.map((payment, idx) => (
              <motion.div
                key={payment.paymentId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(16px)",
                }}
                data-ocid={`admin.item.${idx + 1}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span
                        className="text-xs font-mono px-2 py-1 rounded-md"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.6)",
                        }}
                      >
                        {payment.taskId}
                      </span>
                      <PaymentStatus
                        status={
                          payment.status === "COMPLETED"
                            ? "COMPLETED"
                            : payment.status === "FAILED"
                              ? "FAILED"
                              : "PAYMENT_SUCCESSFUL"
                        }
                      />
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-white/30 text-xs">Amount</span>
                        <p className="font-semibold" style={{ color: GREEN }}>
                          ₹{Number(payment.amount)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-white/30 text-xs">
                          Tasker UPI
                        </span>
                        <div className="flex items-center gap-1.5">
                          <p className="text-white/80 font-medium text-sm truncate">
                            {payment.taskerUpiId}
                          </p>
                          <button
                            type="button"
                            className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
                            onClick={() => copyToClipboard(payment.taskerUpiId)}
                            data-ocid="admin.secondary_button"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0">
                    {payment.status === "PAID" ? (
                      <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95 min-w-[140px] justify-center"
                        style={{
                          background: GREEN,
                          color: "#000",
                          boxShadow: "0 0 16px rgba(0,230,118,0.3)",
                        }}
                        onClick={() => handleMarkPaid(payment.paymentId)}
                        disabled={loadingPayout[payment.paymentId]}
                        data-ocid="admin.primary_button"
                      >
                        {loadingPayout[payment.paymentId] ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />{" "}
                            Updating...
                          </>
                        ) : (
                          "Mark as Paid"
                        )}
                      </button>
                    ) : payment.status === "COMPLETED" ? (
                      <span className="text-white/30 text-sm font-semibold">
                        Paid ✓
                      </span>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
