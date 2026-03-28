import {
  CheckCircle,
  ClipboardCopy,
  DollarSign,
  ListChecks,
  Loader2,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { EscrowPayment, PublicTask } from "../backend.d";
import { PaymentStatus, TaskStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";

const G = "#00E676";
const CARD = "rgba(255,255,255,0.04)";
const BORDER = "1px solid rgba(255,255,255,0.08)";

type Tab = "overview" | "tasks" | "users" | "taskers" | "payments" | "payouts";

function truncate(s: string, n = 10) {
  if (!s) return "—";
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
      title="Copy"
    >
      {copied ? (
        <CheckCircle size={12} style={{ color: G }} />
      ) : (
        <ClipboardCopy size={12} className="text-white" />
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    open: { bg: "rgba(59,130,246,0.15)", color: "#60A5FA", label: "Posted" },
    accepted: {
      bg: "rgba(251,191,36,0.15)",
      color: "#FBBF24",
      label: "Accepted",
    },
    completed: { bg: `${G}18`, color: G, label: "Completed" },
    PAID: { bg: "rgba(251,191,36,0.15)", color: "#FBBF24", label: "Paid" },
    COMPLETED: { bg: `${G}18`, color: G, label: "Success" },
    FAILED: { bg: "rgba(239,68,68,0.15)", color: "#F87171", label: "Failed" },
  };
  const s = map[status] ?? {
    bg: "rgba(255,255,255,0.05)",
    color: "#aaa",
    label: status,
  };
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function formatDate(ts: bigint) {
  try {
    return new Date(Number(ts / 1_000_000n)).toLocaleDateString();
  } catch {
    return "—";
  }
}

function formatINR(amount: bigint) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

// ─────────────────── Overview ───────────────────
function OverviewTab({
  tasks,
  payments,
}: { tasks: PublicTask[]; payments: EscrowPayment[] }) {
  const completed = tasks.filter((t) => t.status === TaskStatus.completed);
  const accepted = tasks.filter((t) => t.status === TaskStatus.accepted);
  const uniquePosters = new Set(tasks.map((t) => t.poster.toString())).size;
  const uniqueAcceptors = new Set(
    tasks.filter((t) => t.acceptor).map((t) => t.acceptor!.toString()),
  ).size;
  const platformFees = payments
    .filter((p) => p.status === PaymentStatus.COMPLETED)
    .reduce((acc, p) => acc + Number(p.amount) * 0.05, 0);

  const stats = [
    {
      label: "Total Tasks",
      value: tasks.length,
      icon: ListChecks,
      color: "#60A5FA",
    },
    {
      label: "Completed",
      value: completed.length,
      icon: CheckCircle,
      color: G,
    },
    {
      label: "Total Users",
      value: uniquePosters,
      icon: Users,
      color: "#A78BFA",
    },
    {
      label: "Platform Fees",
      value: `₹${Math.round(platformFees).toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "#FBBF24",
    },
  ];

  const recent = [...tasks]
    .sort((a, b) => Number(b.createdAt - a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4"
            style={{ background: CARD, border: BORDER }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${s.color}22` }}
              >
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <span className="text-white/50 text-xs">{s.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-4"
          style={{ background: CARD, border: BORDER }}
        >
          <p className="text-white/40 text-xs mb-1">Active Tasks Now</p>
          <p className="text-xl font-bold" style={{ color: "#FBBF24" }}>
            {accepted.length}
          </p>
        </div>
        <div
          className="rounded-2xl p-4"
          style={{ background: CARD, border: BORDER }}
        >
          <p className="text-white/40 text-xs mb-1">Registered Taskers</p>
          <p className="text-xl font-bold" style={{ color: "#A78BFA" }}>
            {uniqueAcceptors}
          </p>
        </div>
      </div>

      {/* Status breakdown */}
      <div
        className="rounded-2xl p-5"
        style={{ background: CARD, border: BORDER }}
      >
        <p className="text-white/60 text-sm font-semibold mb-4">
          Task Status Breakdown
        </p>
        <div className="flex gap-3 flex-wrap">
          {[
            {
              label: "Posted",
              count: tasks.filter((t) => t.status === TaskStatus.open).length,
              color: "#60A5FA",
            },
            { label: "Accepted", count: accepted.length, color: "#FBBF24" },
            { label: "Completed", count: completed.length, color: G },
          ].map((item) => (
            <div
              key={item.label}
              className="flex-1 min-w-[80px] rounded-xl p-3 text-center"
              style={{
                background: `${item.color}15`,
                border: `1px solid ${item.color}30`,
              }}
            >
              <p className="text-2xl font-bold" style={{ color: item.color }}>
                {item.count}
              </p>
              <p className="text-xs mt-1" style={{ color: `${item.color}99` }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="rounded-2xl p-5"
        style={{ background: CARD, border: BORDER }}
      >
        <p className="text-white/60 text-sm font-semibold mb-4">
          Recent Activity
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/30 text-xs">
                <th className="text-left pb-3 font-normal">Task</th>
                <th className="text-left pb-3 font-normal">Posted By</th>
                <th className="text-left pb-3 font-normal">Amount</th>
                <th className="text-left pb-3 font-normal">Status</th>
                <th className="text-left pb-3 font-normal">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recent.map((t, i) => (
                <tr key={t.id} data-ocid={`overview.item.${i + 1}`}>
                  <td className="py-2.5">
                    <p className="text-white font-medium">
                      {truncate(t.title, 22)}
                    </p>
                    <p className="text-white/30 text-xs">{t.id.slice(-6)}</p>
                  </td>
                  <td className="py-2.5">
                    <span className="text-white/50 font-mono text-xs">
                      {truncate(t.poster.toString(), 12)}
                    </span>
                    <CopyBtn text={t.poster.toString()} />
                  </td>
                  <td className="py-2.5 text-white">{formatINR(t.amount)}</td>
                  <td className="py-2.5">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="py-2.5 text-white/30 text-xs">
                    {formatDate(t.createdAt)}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-white/20 text-sm"
                    data-ocid="overview.empty_state"
                  >
                    No tasks yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────── All Tasks ───────────────────
function AllTasksTab({ tasks }: { tasks: PublicTask[] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: CARD, border: BORDER }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-white/30 text-xs border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              {[
                "ID",
                "Title",
                "Category",
                "Location",
                "Amount",
                "Status",
                "Posted By",
                "Accepted By",
                "Date",
              ].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tasks.map((t, i) => (
              <tr
                key={t.id}
                className="hover:bg-white/[0.02] transition-colors"
                data-ocid={`tasks.item.${i + 1}`}
              >
                <td className="px-4 py-3 font-mono text-white/50 text-xs">
                  {t.id.slice(-6)}
                </td>
                <td className="px-4 py-3">
                  <p className="text-white font-medium">
                    {truncate(t.title, 24)}
                  </p>
                  <p className="text-white/30 text-xs">
                    {truncate(t.description, 30)}
                  </p>
                </td>
                <td className="px-4 py-3 text-white/60">{t.category}</td>
                <td className="px-4 py-3 text-white/60">
                  {truncate(t.location, 16)}
                </td>
                <td className="px-4 py-3 text-white">{formatINR(t.amount)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-white/40 text-xs">
                    {truncate(t.poster.toString(), 12)}
                  </span>
                  <CopyBtn text={t.poster.toString()} />
                </td>
                <td className="px-4 py-3">
                  {t.acceptor ? (
                    <>
                      <span className="font-mono text-white/40 text-xs">
                        {truncate(t.acceptor.toString(), 12)}
                      </span>
                      <CopyBtn text={t.acceptor.toString()} />
                    </>
                  ) : (
                    <span className="text-white/20">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-white/30 text-xs">
                  {formatDate(t.createdAt)}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="py-12 text-center text-white/20"
                  data-ocid="tasks.empty_state"
                >
                  No tasks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────── Users ───────────────────
function UsersTab({ tasks }: { tasks: PublicTask[] }) {
  const users = Array.from(
    tasks.reduce((map, t) => {
      const key = t.poster.toString();
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  );

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: CARD, border: BORDER }}
    >
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <p className="text-white font-semibold">{users.length} Users</p>
        <p className="text-white/30 text-xs mt-0.5">
          Profile details visible after user logs in
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-white/30 text-xs border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <th className="text-left px-4 py-3 font-normal">#</th>
              <th className="text-left px-4 py-3 font-normal">Principal ID</th>
              <th className="text-left px-4 py-3 font-normal">Tasks Posted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(([principal, count], i) => (
              <tr
                key={principal}
                className="hover:bg-white/[0.02]"
                data-ocid={`users.item.${i + 1}`}
              >
                <td className="px-4 py-3 text-white/20 text-xs">{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-white/60 text-xs">
                    {truncate(principal, 20)}
                  </span>
                  <CopyBtn text={principal} />
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold" style={{ color: G }}>
                    {count}
                  </span>
                  <span className="text-white/30 text-xs ml-1">tasks</span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="py-12 text-center text-white/20"
                  data-ocid="users.empty_state"
                >
                  No users yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────── Taskers ───────────────────
function TaskersTab({
  tasks,
  payments,
}: { tasks: PublicTask[]; payments: EscrowPayment[] }) {
  const taskerMap = new Map<
    string,
    { count: number; earned: number; upiId: string }
  >();

  for (const t of tasks.filter((t) => t.acceptor)) {
    const key = t.acceptor!.toString();
    const prev = taskerMap.get(key) ?? { count: 0, earned: 0, upiId: "—" };
    let earned = prev.earned;
    let upiId = prev.upiId;
    if (t.status === TaskStatus.completed) {
      earned += Number(t.amount) * 0.95;
      const pmt = payments.find((p) => p.taskId === t.id);
      if (pmt?.taskerUpiId) upiId = pmt.taskerUpiId;
    }
    taskerMap.set(key, { count: prev.count + 1, earned, upiId });
  }

  const taskers = Array.from(taskerMap.entries());

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: CARD, border: BORDER }}
    >
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <p className="text-white font-semibold">{taskers.length} Taskers</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-white/30 text-xs border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <th className="text-left px-4 py-3 font-normal">#</th>
              <th className="text-left px-4 py-3 font-normal">Principal ID</th>
              <th className="text-left px-4 py-3 font-normal">
                Tasks Completed
              </th>
              <th className="text-left px-4 py-3 font-normal">Total Earned</th>
              <th className="text-left px-4 py-3 font-normal">UPI ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {taskers.map(([principal, info], i) => (
              <tr
                key={principal}
                className="hover:bg-white/[0.02]"
                data-ocid={`taskers.item.${i + 1}`}
              >
                <td className="px-4 py-3 text-white/20 text-xs">{i + 1}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-white/60 text-xs">
                    {truncate(principal, 20)}
                  </span>
                  <CopyBtn text={principal} />
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold" style={{ color: G }}>
                    {info.count}
                  </span>
                </td>
                <td className="px-4 py-3 text-white">
                  ₹{Math.round(info.earned).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3">
                  <span className="text-white/60 text-xs">{info.upiId}</span>
                  {info.upiId !== "—" && <CopyBtn text={info.upiId} />}
                </td>
              </tr>
            ))}
            {taskers.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-white/20"
                  data-ocid="taskers.empty_state"
                >
                  No taskers yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────── Payments ───────────────────
type PayFilter = "all" | "success" | "pending" | "failed";

function PaymentsTab({
  payments,
  onMarkPaid,
}: {
  payments: EscrowPayment[];
  onMarkPaid: (paymentId: string) => Promise<void>;
}) {
  const [filter, setFilter] = useState<PayFilter>("all");
  const [marking, setMarking] = useState<string | null>(null);

  const filters: { key: PayFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "success", label: "✓ Success" },
    { key: "pending", label: "⏳ Pending" },
    { key: "failed", label: "✗ Failed" },
  ];

  const filtered = payments.filter((p) => {
    if (filter === "all") return true;
    if (filter === "success") return p.status === PaymentStatus.COMPLETED;
    if (filter === "pending") return p.status === PaymentStatus.PAID;
    if (filter === "failed") return p.status === PaymentStatus.FAILED;
    return true;
  });

  async function handleMark(paymentId: string) {
    setMarking(paymentId);
    await onMarkPaid(paymentId);
    setMarking(null);
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap" data-ocid="payments.tab">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: filter === f.key ? G : "rgba(255,255,255,0.05)",
              color: filter === f.key ? "#000" : "rgba(255,255,255,0.5)",
              border:
                filter === f.key
                  ? `1px solid ${G}`
                  : "1px solid rgba(255,255,255,0.08)",
            }}
            data-ocid={`payments.${f.key}.toggle`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: CARD, border: BORDER }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-white/30 text-xs border-b"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                {[
                  "Payment ID",
                  "Task ID",
                  "Amount",
                  "Tasker UPI",
                  "Status",
                  "Payout",
                ].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((p, i) => (
                <tr
                  key={p.paymentId}
                  className="hover:bg-white/[0.02]"
                  data-ocid={`payments.item.${i + 1}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-white/50 text-xs">
                      {truncate(p.paymentId, 14)}
                    </span>
                    <CopyBtn text={p.paymentId} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-white/50 text-xs">
                      {truncate(p.taskId, 10)}
                    </span>
                    <CopyBtn text={p.taskId} />
                  </td>
                  <td className="px-4 py-3 text-white">
                    {formatINR(p.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white/60 text-xs">
                      {p.taskerUpiId || "—"}
                    </span>
                    {p.taskerUpiId && <CopyBtn text={p.taskerUpiId} />}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    {p.status === PaymentStatus.COMPLETED ? (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: `${G}20`,
                          border: `1px solid ${G}50`,
                        }}
                        title="Payout done"
                        data-ocid={`payments.success_state.${i + 1}`}
                      >
                        <CheckCircle size={16} style={{ color: G }} />
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={marking === p.paymentId}
                        onClick={() => handleMark(p.paymentId)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                        style={{
                          background: "rgba(239,68,68,0.15)",
                          border: "1px solid rgba(239,68,68,0.4)",
                        }}
                        title="Mark as paid"
                        data-ocid={`payments.delete_button.${i + 1}`}
                      >
                        {marking === p.paymentId ? (
                          <Loader2
                            size={14}
                            className="text-red-400 animate-spin"
                          />
                        ) : (
                          <XCircle size={14} className="text-red-400" />
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-white/20"
                    data-ocid="payments.empty_state"
                  >
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────── Payouts ───────────────────
function PayoutsTab({
  payments,
  onMarkPaid,
}: {
  payments: EscrowPayment[];
  onMarkPaid: (paymentId: string) => Promise<void>;
}) {
  const [marking, setMarking] = useState<string | null>(null);

  const pending = payments.filter((p) => p.status === PaymentStatus.PAID);
  const completed = payments.filter(
    (p) => p.status === PaymentStatus.COMPLETED,
  );
  const pendingAmt = pending.reduce((a, p) => a + Number(p.amount), 0);
  const completedAmt = completed.reduce((a, p) => a + Number(p.amount), 0);
  const platformRevenue = payments
    .filter((p) => p.status === PaymentStatus.COMPLETED)
    .reduce((a, p) => a + Number(p.amount) * 0.05, 0);

  async function handleMark(paymentId: string) {
    setMarking(paymentId);
    await onMarkPaid(paymentId);
    setMarking(null);
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Pending Payouts",
            value: pending.length,
            sub: `₹${Math.round(pendingAmt).toLocaleString("en-IN")}`,
            color: "#FBBF24",
          },
          {
            label: "Completed Payouts",
            value: completed.length,
            sub: `₹${Math.round(completedAmt).toLocaleString("en-IN")}`,
            color: G,
          },
          {
            label: "Platform Revenue",
            value: `₹${Math.round(platformRevenue).toLocaleString("en-IN")}`,
            sub: "5% of completed",
            color: "#A78BFA",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4"
            style={{ background: CARD, border: BORDER }}
          >
            <p className="text-white/40 text-xs mb-1">{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-white/30 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Payout cards */}
      <div className="space-y-3">
        {payments.map((p, i) => (
          <motion.div
            key={p.paymentId}
            layout
            className="rounded-2xl p-4"
            style={{ background: CARD, border: BORDER }}
            data-ocid={`payouts.item.${i + 1}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="font-mono text-white/50 text-xs">
                    {truncate(p.taskId, 14)}
                  </span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="text-white font-semibold">
                    {formatINR(p.amount)}
                  </span>
                  <span className="text-white/50">
                    Tasker gets:{" "}
                    <span style={{ color: G }}>
                      ₹
                      {Math.round(Number(p.amount) * 0.95).toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </span>
                  <span className="text-white/40 flex items-center gap-1">
                    UPI: {p.taskerUpiId || "—"}
                    {p.taskerUpiId && <CopyBtn text={p.taskerUpiId} />}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                {p.status === PaymentStatus.COMPLETED ? (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{
                      background: `${G}18`,
                      color: G,
                      border: `1px solid ${G}30`,
                    }}
                    data-ocid={`payouts.success_state.${i + 1}`}
                  >
                    <CheckCircle size={13} /> Paid ✓
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={marking === p.paymentId}
                    onClick={() => handleMark(p.paymentId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                    style={{
                      background: G,
                      color: "#000",
                      boxShadow: `0 0 12px ${G}40`,
                    }}
                    data-ocid={`payouts.primary_button.${i + 1}`}
                  >
                    {marking === p.paymentId ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <CheckCircle size={13} />
                    )}
                    Mark Paid
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {payments.length === 0 && (
          <div
            className="py-12 text-center text-white/20"
            data-ocid="payouts.empty_state"
          >
            No payments recorded
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────── Main ───────────────────
export function AdminDashboard() {
  const { actor, isFetching } = useActor();
  const [tab, setTab] = useState<Tab>("overview");
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [payments, setPayments] = useState<EscrowPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [adminCheck, allTasks, allPayments] = await Promise.all([
        actor.isCallerAdmin(),
        actor.getAllTasks(),
        actor.getPayments(),
      ]);
      if (!cancelled) {
        setIsAdmin(adminCheck);
        setTasks(allTasks);
        setPayments(allPayments);
        setLoading(false);
      }
    })().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching]);

  async function handleMarkPaid(paymentId: string) {
    if (!actor) return;
    await actor.markPayoutComplete(paymentId);
    const updated = await actor.getPayments();
    setPayments(updated);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "tasks", label: "All Tasks" },
    { key: "users", label: "Users" },
    { key: "taskers", label: "Taskers" },
    { key: "payments", label: "Payments" },
    { key: "payouts", label: "Payouts" },
  ];

  if (loading || isFetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin" style={{ color: G }} />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <XCircle size={40} className="text-red-400" />
        <p className="text-white/60">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#050505" }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">
            Task Turtle control panel
          </p>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
          style={{ background: "rgba(255,255,255,0.03)", border: BORDER }}
          data-ocid="admin.tab"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t.key ? G : "transparent",
                color: tab === t.key ? "#000" : "rgba(255,255,255,0.4)",
              }}
              data-ocid={`admin.${t.key}.tab`}
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
            transition={{ duration: 0.2 }}
          >
            {tab === "overview" && (
              <OverviewTab tasks={tasks} payments={payments} />
            )}
            {tab === "tasks" && <AllTasksTab tasks={tasks} />}
            {tab === "users" && <UsersTab tasks={tasks} />}
            {tab === "taskers" && (
              <TaskersTab tasks={tasks} payments={payments} />
            )}
            {tab === "payments" && (
              <PaymentsTab payments={payments} onMarkPaid={handleMarkPaid} />
            )}
            {tab === "payouts" && (
              <PayoutsTab payments={payments} onMarkPaid={handleMarkPaid} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
