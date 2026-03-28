import { IndianRupee, Loader2, TrendingUp, Wallet } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { type PublicTask, TaskStatus } from "../backend";
import { AppNavbar } from "../components/AppNavbar";
import { useActor } from "../hooks/useActor";
import { getTaskerEarning } from "../utils/platformFee";

const GREEN = "#00E676";

function formatDate(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function WalletPage() {
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
  const currentBalance = totalEarned;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#050505" }}>
      <AppNavbar currentPage="wallet" />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Your <span style={{ color: GREEN }}>Wallet</span>
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Earnings and payment history
          </p>
        </div>

        {loading ? (
          <div
            className="flex items-center justify-center py-20"
            data-ocid="wallet.loading_state"
          >
            <Loader2
              size={32}
              className="animate-spin"
              style={{ color: GREEN }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Main balance card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                backdropFilter: "blur(16px)",
              }}
              data-ocid="wallet.balance.card"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${GREEN}18`,
                    border: `1px solid ${GREEN}35`,
                  }}
                >
                  <Wallet size={18} style={{ color: GREEN }} />
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  Current Balance
                </span>
              </div>

              <div className="text-5xl font-bold mb-6" style={{ color: GREEN }}>
                ₹{currentBalance}
              </div>

              <div
                className="h-px w-full mb-5"
                style={{ background: "rgba(255,255,255,0.07)" }}
              />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p
                    className="text-xs mb-1"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Total Earned (all time)
                  </p>
                  <p className="text-xl font-bold text-white">₹{totalEarned}</p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    From {completedTasks.length} completed task
                    {completedTasks.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: GREEN,
                    color: "#050505",
                    boxShadow: `0 0 16px ${GREEN}40`,
                  }}
                  data-ocid="wallet.add_funds.button"
                >
                  Add Funds →
                </button>
              </div>

              {pendingEarnings > 0 && (
                <div
                  className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: "rgba(245,158,11,0.07)",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  <TrendingUp size={14} style={{ color: "#F59E0B" }} />
                  <p
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    <span style={{ color: "#F59E0B", fontWeight: 700 }}>
                      ₹{pendingEarnings}
                    </span>{" "}
                    pending from {inProgressTasks.length} active task
                    {inProgressTasks.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Info banner */}
            <div
              className="rounded-xl px-4 py-3 text-xs"
              style={{
                background: "rgba(0,230,118,0.05)",
                border: `1px solid ${GREEN}20`,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              💡 Task Turtle keeps{" "}
              <strong style={{ color: "rgba(255,255,255,0.75)" }}>5%</strong> as
              platform fee. You receive the remaining{" "}
              <strong style={{ color: GREEN }}>95%</strong> of the task amount +
              tip directly in your wallet after OTP verification.
            </div>

            {/* Earnings History */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} style={{ color: GREEN }} />
                <h2 className="text-base font-bold text-white">
                  Earnings History
                </h2>
              </div>

              {completedTasks.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-14 rounded-xl text-center"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  data-ocid="wallet.earnings.empty_state"
                >
                  <IndianRupee
                    size={28}
                    style={{ color: "rgba(255,255,255,0.1)" }}
                  />
                  <p
                    className="mt-3 text-sm"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    No earnings yet
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    Accept and complete tasks to start earning
                  </p>
                </div>
              ) : (
                <div
                  className="flex flex-col gap-3"
                  data-ocid="wallet.earnings.list"
                >
                  {completedTasks.map((task, i) => {
                    const gross = Number(task.amount);
                    const net = getTaskerEarning(gross);
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-xl p-4 flex items-center justify-between gap-4"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.07)",
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
                        <div className="flex items-center gap-3">
                          <span
                            className="text-lg font-bold"
                            style={{ color: GREEN }}
                          >
                            +₹{net}
                          </span>
                          <span
                            className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{
                              background: `${GREEN}15`,
                              color: GREEN,
                              border: `1px solid ${GREEN}30`,
                            }}
                          >
                            Completed
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
