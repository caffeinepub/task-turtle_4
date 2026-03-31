import {
  Ban,
  CheckCircle,
  ClipboardCopy,
  DollarSign,
  Eye,
  ListChecks,
  Loader2,
  RefreshCw,
  Search,
  ShieldOff,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type {
  EscrowPayment,
  PublicTask,
  UserProfile,
  UserProfileEntry,
} from "../backend.d";
import { PaymentStatus, TaskStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";

import {
  calculateCommission,
  calculatePlatformFee,
  getTaskerEarning,
} from "../utils/platformFee";

const G = "#00E676";
const CARD = "rgba(255,255,255,0.04)";
const BORDER = "1px solid rgba(0,230,118,0.12)";
const SEARCH_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#fff",
  borderRadius: 10,
  padding: "10px 14px 10px 40px",
  fontSize: 14,
  fontWeight: 600,
  outline: "none",
  width: "100%",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

type Tab =
  | "overview"
  | "tasks"
  | "users"
  | "taskers"
  | "payments"
  | "payouts"
  | "profiles";

function truncate(s: string, n = 10) {
  if (!s) return "—";
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1" style={{ maxWidth: 560 }}>
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "rgba(255,255,255,0.3)" }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        style={SEARCH_STYLE}
        className="search-input"
        data-ocid="admin.search_input"
      />
    </div>
  );
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
      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function formatDateTime(ts: bigint | null | undefined) {
  if (!ts) return "—";
  try {
    const d = new Date(Number(ts / 1_000_000n));
    return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
  } catch {
    return "—";
  }
}

// Legacy alias used in overview
function formatDate(ts: bigint) {
  return formatDateTime(ts);
}

function formatINR(amount: bigint) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

// ─────────────────── Profile Modal ───────────────────
function ProfileModal({
  profile,
  onClose,
}: { profile: UserProfile; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.18 }}
        className="rounded-2xl p-6 w-full max-w-sm relative"
        style={{
          background: "rgba(10,20,14,0.97)",
          border: "1px solid rgba(0,230,118,0.2)",
          boxShadow: "0 0 40px rgba(0,230,118,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-black text-lg">User Profile</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.4)" }}
            data-ocid="profile.close_button"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          {[
            { label: "Full Name", value: profile.name },
            { label: "Phone", value: profile.phone },
            { label: "Location", value: profile.location },
            { label: "UPI ID", value: profile.upiId },
            ...(profile.aadharNumber
              ? [{ label: "Aadhar Number", value: profile.aadharNumber }]
              : []),
            ...(profile.studentId
              ? [{ label: "Student ID", value: profile.studentId }]
              : []),
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(0,230,118,0.1)",
              }}
            >
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                {label}
              </p>
              <p className="text-white font-semibold text-sm">{value || "—"}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
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
    .reduce((acc, p) => {
      const relatedTask = tasks.find((t) => t.id === p.taskId);
      const pa = relatedTask
        ? Number(relatedTask.productAmount ?? 0n)
        : Number(p.amount);
      const tf = relatedTask ? Number(relatedTask.taskerFee ?? 0n) : 0;
      const b = relatedTask ? Number(relatedTask.boost ?? 0n) : 0;
      return acc + calculatePlatformFee(pa) + calculateCommission(tf, b);
    }, 0);

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
      label: "Platform Fee",
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

      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-4 stat-card"
          style={{ background: CARD, border: BORDER, transition: "all 0.2s" }}
        >
          <p className="text-white/60 text-xs mb-1 font-bold">
            Active Tasks Now
          </p>
          <p className="text-xl font-bold" style={{ color: "#FBBF24" }}>
            {accepted.length}
          </p>
        </div>
        <div
          className="rounded-2xl p-4 stat-card"
          style={{ background: CARD, border: BORDER, transition: "all 0.2s" }}
        >
          <p className="text-white/60 text-xs mb-1 font-bold">
            Registered Taskers
          </p>
          <p className="text-xl font-bold" style={{ color: "#A78BFA" }}>
            {uniqueAcceptors}
          </p>
        </div>
      </div>

      <div
        className="rounded-2xl p-5"
        style={{ background: CARD, border: BORDER }}
      >
        <p className="text-white/80 text-sm font-bold mb-4">
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

      <div
        className="rounded-2xl p-5"
        style={{ background: CARD, border: BORDER }}
      >
        <p className="text-white/80 text-sm font-bold mb-4">Recent Activity</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/60 text-xs font-bold">
                <th className="text-left pb-3 font-bold">Task</th>
                <th className="text-left pb-3 font-bold">Posted By</th>
                <th className="text-left pb-3 font-bold">Amount</th>
                <th className="text-left pb-3 font-bold">Status</th>
                <th className="text-left pb-3 font-bold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recent.map((t, i) => (
                <tr
                  key={t.id}
                  data-ocid={`overview.item.${i + 1}`}
                  className="admin-table-row transition-all duration-200"
                >
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
                  <td className="py-2.5 text-white">
                    {formatINR(t.amount)}
                    {Number(t.productAmount ?? 0n) > 0 && (
                      <div
                        style={{
                          color: "rgba(255,255,255,0.4)",
                          fontSize: "0.7rem",
                        }}
                      >
                        Item ₹{Number(t.productAmount)} | Fee ₹
                        {Number(t.taskerFee ?? 0n)}
                        {Number(t.boost ?? 0n) > 0
                          ? `| Boost ₹${Number(t.boost ?? 0n)}`
                          : ""}
                      </div>
                    )}
                  </td>
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
function AllTasksTab({
  tasks,
  payments,
  blockedUsers,
  onBlockUser,
  onCancelTask,
}: {
  tasks: PublicTask[];
  payments: EscrowPayment[];
  blockedUsers: Set<string>;
  onBlockUser: (principal: string) => void;
  onCancelTask: (taskId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);

  const filtered = search
    ? tasks.filter((t) => t.id.toLowerCase().includes(search.toLowerCase()))
    : tasks;

  function handleCancel(taskId: string) {
    setCancelling(taskId);
    onCancelTask(taskId);
    setCancelling(null);
  }

  return (
    <div className="space-y-4">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by Task ID…"
      />

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: CARD, border: BORDER }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-white/60 text-xs border-b font-bold"
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
                  "Tasker UPI",
                  "Posted",
                  "Accepted",
                  "Delivered",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-bold whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((t, i) => {
                const payment = payments.find((p) => p.taskId === t.id);
                const upiId = payment?.taskerUpiId || "—";
                const posterPrincipal = t.poster.toString();
                const isBlocked = blockedUsers.has(posterPrincipal);

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-white/[0.02] transition-colors"
                    data-ocid={`tasks.item.${i + 1}`}
                  >
                    <td className="px-4 py-3 font-mono text-white/50 text-xs">
                      {t.id.slice(-6)}
                      <CopyBtn text={t.id} />
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
                    <td className="px-4 py-3 text-white">
                      {formatINR(t.amount)}
                      {Number(t.productAmount ?? 0n) > 0 && (
                        <div
                          style={{
                            color: "rgba(255,255,255,0.4)",
                            fontSize: "0.7rem",
                          }}
                        >
                          Item ₹{Number(t.productAmount)} | Fee ₹
                          {Number(t.taskerFee ?? 0n)}
                          {Number(t.boost ?? 0n) > 0
                            ? `| Boost ₹${Number(t.boost ?? 0n)}`
                            : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-white/40 text-xs">
                          {truncate(posterPrincipal, 12)}
                        </span>
                        <CopyBtn text={posterPrincipal} />
                        {isBlocked && (
                          <span
                            className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{
                              background: "rgba(239,68,68,0.2)",
                              color: "#F87171",
                            }}
                          >
                            BLOCKED
                          </span>
                        )}
                      </div>
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
                    <td className="px-4 py-3">
                      <span className="text-white/60 text-xs">{upiId}</span>
                      {upiId !== "—" && <CopyBtn text={upiId} />}
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">
                      {formatDateTime(t.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">
                      {t.acceptedAt != null
                        ? formatDateTime(t.acceptedAt!)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">
                      {t.completedAt != null
                        ? formatDateTime(t.completedAt!)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {t.status !== TaskStatus.completed && (
                          <button
                            type="button"
                            disabled={cancelling === t.id}
                            onClick={() => handleCancel(t.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                            style={{
                              background: "rgba(239,68,68,0.15)",
                              color: "#F87171",
                              border: "1px solid rgba(239,68,68,0.3)",
                            }}
                            title="Cancel task"
                            data-ocid={`tasks.delete_button.${i + 1}`}
                          >
                            {cancelling === t.id ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Trash2 size={11} />
                            )}
                            Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onBlockUser(posterPrincipal)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                          style={{
                            background: isBlocked
                              ? "rgba(239,68,68,0.2)"
                              : "rgba(255,255,255,0.06)",
                            color: isBlocked
                              ? "#F87171"
                              : "rgba(255,255,255,0.4)",
                            border: isBlocked
                              ? "1px solid rgba(239,68,68,0.4)"
                              : "1px solid rgba(255,255,255,0.1)",
                          }}
                          title={isBlocked ? "Unblock user" : "Block user"}
                          data-ocid={`tasks.toggle.${i + 1}`}
                        >
                          <Ban size={11} />
                          {isBlocked ? "Unblock" : "Block"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="py-12 text-center text-white/20"
                    data-ocid="tasks.empty_state"
                  >
                    {search ? "No tasks match your search" : "No tasks found"}
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

// ─────────────────── Users ───────────────────
function UsersTab({
  tasks,
  blockedUsers,
  onBlockUser,
  profileMap,
}: {
  tasks: PublicTask[];
  blockedUsers: Set<string>;
  onBlockUser: (principal: string) => void;
  profileMap: Map<string, UserProfile>;
}) {
  const [search, setSearch] = useState("");
  const [viewProfile, setViewProfile] = useState<UserProfile | null>(null);

  // Build user map: principal -> { taskCount, amountSpent }
  const userMap = new Map<string, { taskCount: number; amountSpent: number }>();
  for (const t of tasks) {
    const key = t.poster.toString();
    const prev = userMap.get(key) ?? { taskCount: 0, amountSpent: 0 };
    userMap.set(key, {
      taskCount: prev.taskCount + 1,
      amountSpent: prev.amountSpent + Number(t.amount),
    });
  }

  let users = Array.from(userMap.entries());

  if (search) {
    const q = search.toLowerCase();
    users = users.filter(([principal]) => {
      const p = profileMap.get(principal);
      return (
        principal.toLowerCase().includes(q) ||
        (p?.name?.toLowerCase().includes(q) ?? false) ||
        (p?.phone?.toLowerCase().includes(q) ?? false)
      );
    });
  }

  return (
    <>
      <div className="space-y-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name or Principal ID…"
        />

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: CARD, border: BORDER }}
        >
          <div
            className="px-5 py-3 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <p className="text-white font-semibold">{users.length} Users</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-white/60 text-xs border-b font-bold"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  {[
                    "#",
                    "Name",
                    "Phone No",
                    "Location",
                    "Principal ID",
                    "Amount Spent",
                    "Wallet Balance",
                    "Tasks",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-bold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(([principal, info], i) => {
                  const isBlocked = blockedUsers.has(principal);
                  return (
                    <tr
                      key={principal}
                      className="hover:bg-white/[0.02]"
                      data-ocid={`users.item.${i + 1}`}
                    >
                      <td className="px-4 py-3 text-white/20 text-xs">
                        {i + 1}
                      </td>
                      {(() => {
                        const prof = profileMap.get(principal);
                        return (
                          <>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold text-sm">
                                  {prof?.name || "—"}
                                </span>
                                {isBlocked && (
                                  <span
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={{
                                      background: "rgba(239,68,68,0.2)",
                                      color: "#F87171",
                                    }}
                                  >
                                    BLOCKED
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-white/70 text-xs">
                              {prof?.phone || "—"}
                            </td>
                            <td className="px-4 py-3 text-white/70 text-xs">
                              {prof?.location || "—"}
                            </td>
                          </>
                        );
                      })()}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: "rgba(0,230,118,0.5)" }}
                          >
                            User ID
                          </span>
                          <div className="flex items-center gap-1">
                            <span
                              className="font-mono font-bold text-xs"
                              style={{ color: "#00E676" }}
                            >
                              {truncate(principal, 18)}
                            </span>
                            <CopyBtn text={principal} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white">
                          ₹{info.amountSpent.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">—</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold" style={{ color: G }}>
                          {info.taskCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onBlockUser(principal)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                            style={{
                              background: isBlocked
                                ? "rgba(239,68,68,0.2)"
                                : "rgba(255,255,255,0.06)",
                              color: isBlocked
                                ? "#F87171"
                                : "rgba(255,255,255,0.5)",
                              border: isBlocked
                                ? "1px solid rgba(239,68,68,0.4)"
                                : "1px solid rgba(255,255,255,0.1)",
                            }}
                            data-ocid={`users.toggle.${i + 1}`}
                          >
                            <Ban size={12} />
                            {isBlocked ? "Unblock" : "Block"}
                          </button>
                          {profileMap.get(principal) && (
                            <button
                              type="button"
                              onClick={() =>
                                setViewProfile(profileMap.get(principal)!)
                              }
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                              style={{
                                background: "rgba(0,230,118,0.1)",
                                color: "#00E676",
                                border: "1px solid rgba(0,230,118,0.3)",
                              }}
                              data-ocid={`users.secondary_button.${i + 1}`}
                              title="View Profile"
                            >
                              <Eye size={12} /> View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-white/20"
                      data-ocid="users.empty_state"
                    >
                      {search ? "No users match your search" : "No users yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {viewProfile && (
          <ProfileModal
            profile={viewProfile}
            onClose={() => setViewProfile(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────── Taskers ───────────────────
function TaskersTab({
  tasks,
  payments,
  profileMap,
}: {
  tasks: PublicTask[];
  payments: EscrowPayment[];
  profileMap: Map<string, UserProfile>;
}) {
  const [search, setSearch] = useState("");
  const [suspended, setSuspended] = useState<Set<string>>(new Set());
  const [viewProfile, setViewProfile] = useState<UserProfile | null>(null);

  const taskerMap = new Map<
    string,
    { completed: number; earned: number; upiId: string; isActive: boolean }
  >();

  for (const t of tasks.filter((t) => t.acceptor)) {
    const key = t.acceptor!.toString();
    const prev = taskerMap.get(key) ?? {
      completed: 0,
      earned: 0,
      upiId: "—",
      isActive: false,
    };
    let earned = prev.earned;
    let upiId = prev.upiId;
    let completed = prev.completed;
    let isActive = prev.isActive;

    if (t.status === TaskStatus.accepted) isActive = true;
    if (t.status === TaskStatus.completed) {
      completed += 1;
      const tf = Number(t.taskerFee ?? 0n);
      const b = Number(t.boost ?? 0n);
      const pa = Number(t.productAmount ?? 0n);
      if (pa > 0 || tf > 0) {
        earned += pa + tf + b - calculateCommission(tf, b);
      } else {
        earned += getTaskerEarning(Number(t.amount));
      }
      const pmt = payments.find((p) => p.taskId === t.id);
      if (pmt?.taskerUpiId) upiId = pmt.taskerUpiId;
    }
    taskerMap.set(key, { completed, earned, upiId, isActive });
  }

  let taskers = Array.from(taskerMap.entries());

  if (search) {
    const q = search.toLowerCase();
    taskers = taskers.filter(
      ([principal, info]) =>
        principal.toLowerCase().includes(q) ||
        info.upiId.toLowerCase().includes(q),
    );
  }

  function toggleSuspend(principal: string) {
    setSuspended((prev) => {
      const next = new Set(prev);
      if (next.has(principal)) next.delete(principal);
      else next.add(principal);
      return next;
    });
  }

  return (
    <>
      <div className="space-y-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by Principal ID or UPI ID…"
        />

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: CARD, border: BORDER }}
        >
          <div
            className="px-5 py-3 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <p className="text-white font-semibold">{taskers.length} Taskers</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-white/60 text-xs border-b font-bold"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  {[
                    "#",
                    "Name",
                    "Phone",
                    "Location",
                    "Active",
                    "Principal ID",
                    "Tasks Completed",
                    "Total Earned",
                    "UPI ID",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-bold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {taskers.map(([principal, info], i) => {
                  const isSuspended = suspended.has(principal);
                  return (
                    <tr
                      key={principal}
                      className="hover:bg-white/[0.02]"
                      data-ocid={`taskers.item.${i + 1}`}
                    >
                      <td className="px-4 py-3 text-white/20 text-xs">
                        {i + 1}
                      </td>
                      {(() => {
                        const prof = profileMap.get(principal);
                        return (
                          <>
                            <td className="px-4 py-3 text-white font-semibold text-sm">
                              {prof?.name || "—"}
                            </td>
                            <td className="px-4 py-3 text-white/70 text-xs">
                              {prof?.phone || "—"}
                            </td>
                            <td className="px-4 py-3 text-white/70 text-xs">
                              {prof?.location || "—"}
                            </td>
                          </>
                        );
                      })()}
                      <td className="px-4 py-3">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{
                            background: info.isActive
                              ? G
                              : "rgba(255,255,255,0.2)",
                          }}
                          title={info.isActive ? "Active" : "Inactive"}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: "rgba(0,230,118,0.5)" }}
                          >
                            Tasker ID
                          </span>
                          <div className="flex items-center gap-1">
                            <span
                              className="font-mono font-bold text-xs"
                              style={{ color: "#00E676" }}
                            >
                              {truncate(principal, 16)}
                            </span>
                            <CopyBtn text={principal} />
                            {isSuspended && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: "rgba(239,68,68,0.2)",
                                  color: "#F87171",
                                }}
                              >
                                SUSPENDED
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold" style={{ color: G }}>
                          {info.completed}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white">
                        ₹{Math.round(info.earned).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white/60 text-xs">
                          {info.upiId}
                        </span>
                        {info.upiId !== "—" && <CopyBtn text={info.upiId} />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSuspend(principal)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                            style={{
                              background: isSuspended
                                ? "rgba(239,68,68,0.2)"
                                : "rgba(255,255,255,0.06)",
                              color: isSuspended
                                ? "#F87171"
                                : "rgba(255,255,255,0.5)",
                              border: isSuspended
                                ? "1px solid rgba(239,68,68,0.4)"
                                : "1px solid rgba(255,255,255,0.1)",
                            }}
                            data-ocid={`taskers.toggle.${i + 1}`}
                          >
                            <ShieldOff size={12} />
                            {isSuspended ? "Restore" : "Suspend"}
                          </button>
                          {profileMap.get(principal) && (
                            <button
                              type="button"
                              onClick={() =>
                                setViewProfile(profileMap.get(principal)!)
                              }
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                              style={{
                                background: "rgba(0,230,118,0.1)",
                                color: "#00E676",
                                border: "1px solid rgba(0,230,118,0.3)",
                              }}
                              data-ocid={`taskers.secondary_button.${i + 1}`}
                              title="View Profile"
                            >
                              <Eye size={12} /> View
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {taskers.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-12 text-center text-white/20"
                      data-ocid="taskers.empty_state"
                    >
                      {search
                        ? "No taskers match your search"
                        : "No taskers yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {viewProfile && (
          <ProfileModal
            profile={viewProfile}
            onClose={() => setViewProfile(null)}
          />
        )}
      </AnimatePresence>
    </>
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
  const [search, setSearch] = useState("");

  const filters: { key: PayFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "success", label: "✓ Success" },
    { key: "pending", label: "⏳ Pending" },
    { key: "failed", label: "✗ Failed" },
  ];

  let filtered = payments.filter((p) => {
    if (filter === "success") return p.status === PaymentStatus.COMPLETED;
    if (filter === "pending") return p.status === PaymentStatus.PAID;
    if (filter === "failed") return p.status === PaymentStatus.FAILED;
    return true;
  });

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.paymentId.toLowerCase().includes(q) ||
        p.taskId.toLowerCase().includes(q),
    );
  }

  async function handleMark(paymentId: string) {
    setMarking(paymentId);
    await onMarkPaid(paymentId);
    setMarking(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by Payment ID or Task ID…"
        />
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
                    : "1px solid rgba(0,230,118,0.12)",
              }}
              data-ocid={`payments.${f.key}.toggle`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: CARD, border: BORDER }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-white/60 text-xs border-b font-bold"
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
                  <th key={h} className="text-left px-4 py-3 font-bold">
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
                    {search
                      ? "No payments match your search"
                      : "No payments found"}
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
  tasks,
  onMarkPaid,
}: {
  payments: EscrowPayment[];
  tasks: PublicTask[];
  onMarkPaid: (paymentId: string) => Promise<void>;
}) {
  const [marking, setMarking] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const pending = payments.filter((p) => p.status === PaymentStatus.PAID);
  const completed = payments.filter(
    (p) => p.status === PaymentStatus.COMPLETED,
  );
  const pendingAmt = pending.reduce((a, p) => a + Number(p.amount), 0);
  const completedAmt = completed.reduce((a, p) => a + Number(p.amount), 0);
  const platformRevenue = completed.reduce((a, p) => {
    const relatedTask = tasks.find((t) => t.id === p.taskId);
    const pa = relatedTask
      ? Number(relatedTask.productAmount ?? 0n)
      : Number(p.amount);
    const tf = relatedTask ? Number(relatedTask.taskerFee ?? 0n) : 0;
    const b = relatedTask ? Number(relatedTask.boost ?? 0n) : 0;
    return a + calculatePlatformFee(pa) + calculateCommission(tf, b);
  }, 0);

  let filteredPayments = payments;
  if (search) {
    const q = search.toLowerCase();
    filteredPayments = payments.filter(
      (p) =>
        p.taskId.toLowerCase().includes(q) ||
        p.taskerUpiId?.toLowerCase().includes(q),
    );
  }

  async function handleMark(paymentId: string) {
    setMarking(paymentId);
    await onMarkPaid(paymentId);
    setMarking(null);
  }

  return (
    <div className="space-y-6">
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
            sub: "Tiered fee + 15% commission",
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

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by Task ID or UPI ID…"
      />

      <div className="space-y-3">
        {filteredPayments.map((p, i) => (
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
                    Tasker gets: {(() => {
                      const relatedTask = tasks.find((t) => t.id === p.taskId);
                      const tf = relatedTask
                        ? Number(relatedTask.taskerFee ?? 0n)
                        : 0;
                      const b = relatedTask
                        ? Number(relatedTask.boost ?? 0n)
                        : 0;
                      const pa = relatedTask
                        ? Number(relatedTask.productAmount ?? 0n)
                        : 0;
                      const commission = calculateCommission(tf, b);
                      const taskerGets =
                        pa > 0 || tf > 0
                          ? pa + tf + b - commission
                          : getTaskerEarning(Number(p.amount));
                      return (
                        <>
                          <span style={{ color: G }}>
                            ₹{taskerGets.toLocaleString("en-IN")}
                          </span>
                          {(pa > 0 || tf > 0) && (
                            <div
                              style={{
                                color: "rgba(255,255,255,0.4)",
                                fontSize: "0.7rem",
                              }}
                            >
                              Item ₹{pa} + Earn ₹{tf + b - commission} = ₹
                              {taskerGets}
                            </div>
                          )}
                        </>
                      );
                    })()}
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
        {filteredPayments.length === 0 && (
          <div
            className="py-12 text-center text-white/20"
            data-ocid="payouts.empty_state"
          >
            {search ? "No payouts match your search" : "No payments recorded"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────── Profiles Tab ───────────────────
function ProfilesTab({
  profileMap,
  tasks,
}: {
  profileMap: Map<string, UserProfile>;
  tasks: PublicTask[];
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{
    principal: string;
    profile: UserProfile;
  } | null>(null);

  // Determine role: tasker = someone who accepted at least one task
  const taskerPrincipals = new Set(
    tasks.filter((t) => t.acceptor != null).map((t) => t.acceptor!.toString()),
  );
  const posterPrincipals = new Set(tasks.map((t) => t.poster.toString()));

  const entries = Array.from(profileMap.entries());
  const filtered = search
    ? entries.filter(([principal, p]) => {
        const q = search.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.upiId?.toLowerCase().includes(q) ||
          principal.toLowerCase().includes(q)
        );
      })
    : entries;

  return (
    <>
      <div className="space-y-6">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, phone, location, UPI ID or Principal…"
        />

        {filtered.length === 0 && (
          <div
            className="py-16 text-center text-white/20"
            data-ocid="profiles.empty_state"
          >
            {search ? "No profiles match your search" : "No profiles saved yet"}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(([principal, profile]) => {
            const isTasker = taskerPrincipals.has(principal);
            const isUser = posterPrincipals.has(principal);
            const role =
              isTasker && isUser
                ? "User + Tasker"
                : isTasker
                  ? "Tasker"
                  : "User";
            const roleColor = isTasker ? "#00E676" : "#60A5FA";
            const tasksDone = tasks.filter(
              (t) =>
                t.acceptor?.[0]?.toString() === principal &&
                t.status === "completed",
            ).length;
            const tasksPosted = tasks.filter(
              (t) => t.poster.toString() === principal,
            ).length;

            return (
              <motion.div
                key={principal}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.01]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(0,230,118,0.14)",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
                }}
                onClick={() => setSelected({ principal, profile })}
                data-ocid={"profiles.card"}
              >
                {/* Avatar + Name */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0"
                    style={{
                      background: `${roleColor}22`,
                      color: roleColor,
                      border: `1.5px solid ${roleColor}44`,
                    }}
                  >
                    {(profile.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-black text-sm truncate">
                      {profile.name || "—"}
                    </p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${roleColor}20`, color: roleColor }}
                    >
                      {role}
                    </span>
                  </div>
                </div>

                {/* Details grid */}
                <div className="space-y-2 mb-4">
                  {[
                    { label: "Phone", value: profile.phone },
                    { label: "Location", value: profile.location },
                    { label: "UPI ID", value: profile.upiId },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center"
                    >
                      <span className="text-white/40 text-[11px] font-semibold">
                        {label}
                      </span>
                      <span className="text-white/80 text-[11px] font-semibold truncate max-w-[55%]">
                        {value || "—"}
                      </span>
                    </div>
                  ))}
                  {profile.aadharNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-[11px] font-semibold">
                        Aadhar
                      </span>
                      <span className="text-white/80 text-[11px] font-semibold">
                        {`••••${profile.aadharNumber.slice(-4)}`}
                      </span>
                    </div>
                  )}
                  {profile.studentId && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-[11px] font-semibold">
                        Student ID
                      </span>
                      <span className="text-white/80 text-[11px] font-semibold truncate max-w-[55%]">
                        {profile.studentId}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div
                  className="flex gap-3 pt-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex-1 text-center">
                    <p className="text-[11px] text-white/30 font-semibold">
                      Tasks Posted
                    </p>
                    <p
                      className="font-black text-sm"
                      style={{ color: "#60A5FA" }}
                    >
                      {tasksPosted}
                    </p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-[11px] text-white/30 font-semibold">
                      Tasks Done
                    </p>
                    <p className="font-black text-sm" style={{ color: G }}>
                      {tasksDone}
                    </p>
                  </div>
                </div>

                {/* Principal */}
                <div
                  className="mt-3 pt-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/25 font-bold uppercase tracking-wider">
                      ID
                    </span>
                    <span className="font-mono text-[10px] text-white/40 truncate">
                      {principal.slice(0, 24)}…
                    </span>
                    <CopyBtn text={principal} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="text-white/20 text-xs text-center pt-2">
          {filtered.length} profile{filtered.length !== 1 ? "s" : ""} found —
          click any card to view full details
        </p>
      </div>

      {/* Full profile modal */}
      <AnimatePresence>
        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(6px)",
            }}
            onClick={() => setSelected(null)}
            onKeyDown={(e) => e.key === "Escape" && setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl p-6 w-full max-w-md relative"
              style={{
                background: "rgba(8,18,12,0.98)",
                border: "1px solid rgba(0,230,118,0.25)",
                boxShadow: "0 0 60px rgba(0,230,118,0.12)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black"
                    style={{
                      background: `${G}22`,
                      color: G,
                      border: `2px solid ${G}44`,
                    }}
                  >
                    {(selected.profile.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg">
                      {selected.profile.name || "Unknown"}
                    </h3>
                    <p className="text-white/40 text-xs">My Profile Details</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10 text-white/40"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Full Name", value: selected.profile.name },
                  { label: "Phone Number", value: selected.profile.phone },
                  { label: "Location", value: selected.profile.location },
                  { label: "UPI ID", value: selected.profile.upiId },
                  ...(selected.profile.aadharNumber
                    ? [
                        {
                          label: "Aadhar Number",
                          value: selected.profile.aadharNumber,
                        },
                      ]
                    : []),
                  ...(selected.profile.studentId
                    ? [
                        {
                          label: "Student ID",
                          value: selected.profile.studentId,
                        },
                      ]
                    : []),
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl px-4 py-3 flex justify-between items-center"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(0,230,118,0.1)",
                    }}
                  >
                    <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider">
                      {label}
                    </p>
                    <p className="text-white font-semibold text-sm max-w-[60%] text-right">
                      {value || "—"}
                    </p>
                  </div>
                ))}
              </div>

              {/* Principal ID */}
              <div
                className="mt-4 rounded-xl px-4 py-3"
                style={{
                  background: "rgba(0,230,118,0.06)",
                  border: "1px solid rgba(0,230,118,0.2)",
                }}
              >
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
                  Principal ID
                </p>
                <div className="flex items-center gap-2">
                  <p
                    className="font-mono text-xs break-all"
                    style={{ color: G }}
                  >
                    {selected.principal}
                  </p>
                  <CopyBtn text={selected.principal} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────── Main ───────────────────
function AdminTabButton({
  tabKey,
  label,
  activeTab,
  onClick,
}: {
  tabKey: Tab;
  label: string;
  activeTab: Tab;
  onClick: (k: Tab) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isActive = activeTab === tabKey;
  return (
    <button
      type="button"
      onClick={() => onClick(tabKey)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-all cursor-pointer"
      style={{
        background: isActive
          ? G
          : hovered
            ? "rgba(0,230,118,0.10)"
            : "transparent",
        color: isActive
          ? "#000"
          : hovered
            ? "rgba(255,255,255,0.85)"
            : "rgba(255,255,255,0.45)",
        fontWeight: isActive ? 800 : 600,
        boxShadow: isActive
          ? "0 0 14px rgba(0,230,118,0.4), inset 0 -2px 0 rgba(0,0,0,0.15)"
          : "none",
        borderBottom: isActive ? `2px solid ${G}` : "2px solid transparent",
        transition: "all 0.2s",
      }}
      data-ocid={`admin.${tabKey}.tab`}
    >
      {label}
    </button>
  );
}

export function AdminDashboard() {
  const { actor, isFetching } = useActor();
  const [tab, setTab] = useState<Tab>("overview");
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [payments, setPayments] = useState<EscrowPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [profileMap, setProfileMap] = useState<Map<string, UserProfile>>(
    new Map(),
  );

  async function loadData() {
    if (!actor) return;
    // Fetch profiles separately so a permission error doesn't crash everything
    const [adminCheck, allTasks, allPayments] = await Promise.all([
      actor.isCallerAdmin(),
      actor.getAllTasks(),
      actor.getPayments(),
    ]);
    setIsAdmin(adminCheck);
    setTasks(allTasks);
    setPayments(allPayments);

    // getAllUserProfiles requires admin role — fetch separately with error handling
    try {
      const allProfiles = await actor.getAllUserProfiles();
      setProfileMap(new Map(allProfiles.map((e) => [e.principal, e.profile])));
    } catch {
      // If user profiles can't be fetched (e.g. not yet admin), keep existing map
      console.warn("Could not load user profiles");
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadData intentionally excluded
  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadData();
      if (!cancelled) setLoading(false);
    })().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching]);

  async function handleRefresh() {
    if (!actor || refreshing) return;
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 2000);
  }

  async function handleMarkPaid(paymentId: string) {
    if (!actor) return;
    await actor.markPayoutComplete(paymentId);
    const updated = await actor.getPayments();
    setPayments(updated);
  }

  function handleCancelTask(taskId: string) {
    // UI-only cancel (cancelTask not yet in deployed backend)
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  function handleBlockUser(principal: string) {
    setBlockedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(principal)) next.delete(principal);
      else next.add(principal);
      return next;
    });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "tasks", label: "All Tasks" },
    { key: "users", label: "Users" },
    { key: "taskers", label: "Taskers" },
    { key: "payments", label: "Payments" },
    { key: "payouts", label: "Payouts" },
    { key: "profiles", label: "Profiles" },
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
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #000000 0%, #060e09 50%, #000000 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Animated green top border */}
        <div
          className="h-[2px] w-full rounded-full mb-6"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #00E676 40%, #00E67640 60%, transparent 100%)",
            animation: "pulse-green 2.5s ease-in-out infinite",
          }}
        />
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Task Turtle control panel
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 flex-shrink-0"
            style={{
              background: refreshed ? `${G}20` : "rgba(255,255,255,0.06)",
              color: refreshed ? G : "rgba(255,255,255,0.6)",
              border: refreshed
                ? `1px solid ${G}40`
                : "1px solid rgba(0,230,118,0.15)",
            }}
            data-ocid="admin.primary_button"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
              style={{ color: refreshed ? G : undefined }}
            />
            {refreshing ? "Refreshing…" : refreshed ? "Updated ✓" : "Refresh"}
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto"
          style={{ background: "rgba(255,255,255,0.03)", border: BORDER }}
          data-ocid="admin.tab"
        >
          {TABS.map((t) => (
            <AdminTabButton
              key={t.key}
              tabKey={t.key}
              label={t.label}
              activeTab={tab}
              onClick={setTab}
            />
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
            {tab === "tasks" && (
              <AllTasksTab
                tasks={tasks}
                payments={payments}
                blockedUsers={blockedUsers}
                onBlockUser={handleBlockUser}
                onCancelTask={handleCancelTask}
              />
            )}
            {tab === "users" && (
              <UsersTab
                tasks={tasks}
                blockedUsers={blockedUsers}
                onBlockUser={handleBlockUser}
                profileMap={profileMap}
              />
            )}
            {tab === "taskers" && (
              <TaskersTab
                tasks={tasks}
                payments={payments}
                profileMap={profileMap}
              />
            )}
            {tab === "payments" && (
              <PaymentsTab payments={payments} onMarkPaid={handleMarkPaid} />
            )}
            {tab === "payouts" && (
              <PayoutsTab
                payments={payments}
                tasks={tasks}
                onMarkPaid={handleMarkPaid}
              />
            )}
            {tab === "profiles" && (
              <ProfilesTab profileMap={profileMap} tasks={tasks} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
