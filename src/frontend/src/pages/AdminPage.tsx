import { LogOut, ShieldCheck } from "lucide-react";
import { AdminDashboard } from "../components/AdminDashboard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const GREEN = "#00E676";

export function AdminPage() {
  const { clear } = useInternetIdentity();

  function handleLogout() {
    localStorage.removeItem("loginIntent");
    clear();
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000000" }}>
      {/* Top navbar */}
      <div
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🐢</span>
            <span className="text-white font-bold text-lg tracking-tight">
              <span style={{ color: GREEN }}>Task</span>Turtle
            </span>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(245,158,11,0.12)",
                color: "#F59E0B",
                border: "1px solid rgba(245,158,11,0.25)",
              }}
            >
              <ShieldCheck size={10} className="inline mr-1" />
              Admin
            </span>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
            style={{ border: "1px solid rgba(0,230,118,0.12)" }}
            onClick={handleLogout}
            data-ocid="admin.secondary_button"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
      <AdminDashboard />
    </div>
  );
}
