import {
  CheckCheck,
  CheckCircle,
  Clock,
  Hourglass,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";

const GREEN = "#00E676";

type PaymentStatusType =
  | "PAYMENT_SUCCESSFUL"
  | "AWAITING_COMPLETION"
  | "PAYOUT_PENDING"
  | "COMPLETED"
  | "FAILED";

interface PaymentStatusProps {
  status: PaymentStatusType;
  className?: string;
}

const STATUS_CONFIG: Record<
  PaymentStatusType,
  {
    label: string;
    icon: React.ReactNode;
    bg: string;
    border: string;
    color: string;
    glow?: string;
  }
> = {
  PAYMENT_SUCCESSFUL: {
    label: "Payment Successful",
    icon: <CheckCircle size={13} />,
    bg: "rgba(0,230,118,0.12)",
    border: "rgba(0,230,118,0.3)",
    color: GREEN,
  },
  AWAITING_COMPLETION: {
    label: "Awaiting Task Completion",
    icon: <Clock size={13} />,
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.3)",
    color: "#FBB824",
  },
  PAYOUT_PENDING: {
    label: "Payout Pending (Manual)",
    icon: <Hourglass size={13} />,
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.3)",
    color: "#818CF8",
  },
  COMPLETED: {
    label: "Completed \u2713",
    icon: <CheckCheck size={13} />,
    bg: "rgba(0,230,118,0.16)",
    border: "rgba(0,230,118,0.5)",
    color: GREEN,
    glow: "0 0 12px rgba(0,230,118,0.4)",
  },
  FAILED: {
    label: "Payment Failed",
    icon: <XCircle size={13} />,
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.3)",
    color: "#F87171",
  },
};

export function PaymentStatus({ status, className = "" }: PaymentStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${className}`}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        boxShadow: config.glow,
      }}
      data-ocid="payment.status"
    >
      {config.icon}
      {config.label}
    </motion.span>
  );
}
