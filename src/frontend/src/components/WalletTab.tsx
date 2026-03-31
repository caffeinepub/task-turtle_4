import { IndianRupee, Loader2, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { type PublicTask, TaskStatus } from "../backend";
import { useActor } from "../hooks/useActor";
import { calculatePlatformFee, getTaskerEarning } from "../utils/platformFee";

const GREEN = "#00E676";

function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  const date = new Date(ms);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function WalletTab() {
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

  const completedTasks = tasks.filter((t) => t.status === TaskStatus.completed);
  const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.accepted);

  const totalEarned = completedTasks.reduce(
    (sum, t) => sum + getTaskerEarning(Number(t.amount)),
    0,
  );
  const pendingEarnings = inProgressTasks.reduce(
    (sum, t) => sum + getTaskerEarning(Number(t.amount)),
    0,
  );

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-16"
        data-ocid="wallet.loading_state"
      >
        <Loader2 size={24} className="animate-spin" style={{ color: GREEN }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Earned */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="rounded-xl p-6 flex flex-col gap-2"
          style={{
            background: "rgba(0,230,118,0.07)",
            border: `1px solid ${GREEN}30`,
            boxShadow: `0 0 24px ${GREEN}15`,
          }}
          data-ocid="wallet.total_earned.card"
        >
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee size={14} style={{ color: GREEN }} />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: GREEN }}
            >
              Total Earned
            </span>
          </div>
          <div className="text-4xl font-bold text-white">₹{totalEarned}</div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            From {completedTasks.length} completed task
            {completedTasks.length !== 1 ? "s" : ""}
          </div>
        </motion.div>

        {/* Pending Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-xl p-6 flex flex-col gap-2"
          style={{
            background: "rgba(245,158,11,0.07)",
            border: "1px solid rgba(245,158,11,0.3)",
          }}
          data-ocid="wallet.pending_earnings.card"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} style={{ color: "#F59E0B" }} />
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#F59E0B" }}
            >
              Pending
            </span>
          </div>
          <div className="text-4xl font-bold text-white">
            ₹{pendingEarnings}
          </div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            From {inProgressTasks.length} in-progress task
            {inProgressTasks.length !== 1 ? "s" : ""}
          </div>
        </motion.div>
      </div>

      {/* Platform fee note */}
      <div
        className="rounded-xl px-4 py-3 text-xs"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(0,230,118,0.1)",
          color: "rgba(255,255,255,0.4)",
        }}
      >
        💡 Task Turtle charges a tiered platform fee (₹4–₹10) plus{" "}
        <strong style={{ color: "rgba(255,255,255,0.65)" }}>
          15% commission
        </strong>{" "}
        on tasker fee &amp; boost. Your payout includes the full product amount
        + tasker fee &amp; boost after commission.
      </div>

      {/* Earnings history */}
      <div>
        <p className="text-sm font-semibold text-white mb-3">
          Earnings History
        </p>
        {completedTasks.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-center rounded-xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(0,230,118,0.08)",
            }}
            data-ocid="wallet.earnings.empty_state"
          >
            <IndianRupee
              size={28}
              style={{ color: "rgba(255,255,255,0.12)" }}
            />
            <p
              className="mt-3 text-sm"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              No earnings yet. Accept a task to start earning!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3" data-ocid="wallet.earnings.list">
            {completedTasks.map((task, i) => {
              const gross = Number(task.amount);
              const fee = calculatePlatformFee(gross);
              const net = getTaskerEarning(gross);
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(0,230,118,0.1)",
                  }}
                  data-ocid={`wallet.earnings.item.${i + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {task.title}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {formatDate(task.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        Gross
                      </div>
                      <div className="text-white font-medium">₹{gross}</div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        Platform Fee
                      </div>
                      <div style={{ color: "#ff6b6b" }}>−₹{fee}</div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        Net Payout
                      </div>
                      <div className="font-bold" style={{ color: GREEN }}>
                        ₹{net}
                      </div>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: `${GREEN}15`,
                        color: GREEN,
                        border: `1px solid ${GREEN}30`,
                      }}
                    >
                      Paid Out
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* In-progress tasks */}
      {inProgressTasks.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white mb-3">Pending Tasks</p>
          <div className="flex flex-col gap-3">
            {inProgressTasks.map((task, i) => (
              <div
                key={task.id}
                className="rounded-xl p-4 flex items-center justify-between gap-3"
                style={{
                  background: "rgba(245,158,11,0.05)",
                  border: "1px solid rgba(245,158,11,0.15)",
                }}
                data-ocid={`wallet.pending.item.${i + 1}`}
              >
                <p className="text-white text-sm truncate">{task.title}</p>
                <span
                  className="text-sm font-bold"
                  style={{ color: "#F59E0B" }}
                >
                  ₹{getTaskerEarning(Number(task.amount))} pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
