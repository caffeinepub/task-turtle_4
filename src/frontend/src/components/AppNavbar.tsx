import { LogOut, Turtle } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const GREEN = "#00E676";

type Page = "dashboard" | "tasker" | "wallet" | "profile";

const NAV_LINKS: { label: string; page: Page; hash: string }[] = [
  { label: "Dashboard", page: "dashboard", hash: "#dashboard" },
  { label: "Tasker", page: "tasker", hash: "#tasker" },
  { label: "Wallet", page: "wallet", hash: "#wallet" },
  { label: "Profile", page: "profile", hash: "#profile" },
];

function NavLink({
  link,
  isActive,
  onClick,
}: {
  link: { label: string; page: Page; hash: string };
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="px-3 md:px-4 py-2 rounded-full text-sm transition-all cursor-pointer"
      style={{
        background: isActive
          ? GREEN
          : hovered
            ? "rgba(0,230,118,0.12)"
            : "transparent",
        color: isActive
          ? "#050505"
          : hovered
            ? "rgba(255,255,255,0.9)"
            : "rgba(255,255,255,0.6)",
        fontWeight: isActive ? 800 : 700,
        boxShadow: isActive ? `0 0 14px ${GREEN}50` : "none",
        transition: "all 0.2s",
      }}
      data-ocid={`appnav.${link.page}.link`}
    >
      {link.label}
    </button>
  );
}

export function AppNavbar({ currentPage }: { currentPage: Page }) {
  const { clear } = useInternetIdentity();

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
      style={{
        background: "rgba(5,5,5,0.92)",
        borderBottom: "1px solid rgba(0,230,118,0.12)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Subtle animated top border */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${GREEN}60 40%, ${GREEN} 50%, ${GREEN}60 60%, transparent 100%)`,
          animation: "pulse 3s ease-in-out infinite",
        }}
      />

      {/* Logo */}
      <button
        type="button"
        onClick={() => {
          window.location.hash = "";
        }}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        data-ocid="appnav.logo.button"
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${GREEN}20`, border: `1px solid ${GREEN}40` }}
        >
          <Turtle size={16} style={{ color: GREEN }} />
        </div>
        <span className="text-white font-black text-base hidden sm:block">
          Task<span style={{ color: GREEN }}>Turtle</span>
        </span>
      </button>

      {/* Center Nav */}
      <nav className="flex items-center gap-1" data-ocid="appnav.nav.panel">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.page}
            link={link}
            isActive={currentPage === link.page}
            onClick={() => {
              window.location.hash = link.hash;
            }}
          />
        ))}
      </nav>

      {/* Logout */}
      <button
        type="button"
        onClick={() => {
          clear();
          window.location.hash = "";
        }}
        className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold transition-all hover:bg-white/10"
        style={{ color: "rgba(255,255,255,0.55)" }}
        data-ocid="appnav.logout.button"
      >
        <LogOut size={15} />
        <span className="hidden sm:block">Logout</span>
      </button>
    </header>
  );
}
