import { LogOut, Menu, Turtle, X } from "lucide-react";
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

export function AppNavbar({ currentPage }: { currentPage: Page }) {
  const { clear } = useInternetIdentity();
  const [menuOpen, setMenuOpen] = useState(false);

  function navigate(hash: string) {
    window.location.hash = hash;
    setMenuOpen(false);
  }

  return (
    <>
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-3"
        style={{
          background: "rgba(0,0,0,0.92)",
          borderBottom: "1px solid rgba(0,230,118,0.12)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Animated top border */}
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

        {/* Desktop Nav */}
        <nav
          className="hidden md:flex items-center gap-1"
          data-ocid="appnav.nav.panel"
        >
          {NAV_LINKS.map((link) => {
            const isActive = currentPage === link.page;
            return (
              <button
                key={link.page}
                type="button"
                onClick={() => navigate(link.hash)}
                className="px-4 py-2 rounded-full text-sm transition-all cursor-pointer min-h-[36px]"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)"
                    : "transparent",
                  color: isActive ? "#000000" : "rgba(255,255,255,0.6)",
                  fontWeight: isActive ? 800 : 700,
                  boxShadow: isActive
                    ? "0 0 20px rgba(0,230,118,0.5), 0 0 40px rgba(0,230,118,0.2)"
                    : "none",
                }}
                data-ocid={`appnav.${link.page}.link`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right side: logout + mobile hamburger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              clear();
              window.location.hash = "";
            }}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold transition-all hover:bg-white/10 min-h-[36px]"
            style={{ color: "rgba(255,255,255,0.55)" }}
            data-ocid="appnav.logout.button"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((p) => !p)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.7)",
            }}
            data-ocid="appnav.menu.button"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="md:hidden sticky top-[57px] z-40 px-4 pb-3"
          style={{
            background: "rgba(0,0,0,0.96)",
            borderBottom: "1px solid rgba(0,230,118,0.12)",
          }}
        >
          <nav className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map((link) => {
              const isActive = currentPage === link.page;
              return (
                <button
                  key={link.page}
                  type="button"
                  onClick={() => navigate(link.hash)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all min-h-[44px]"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)"
                      : "rgba(255,255,255,0.04)",
                    color: isActive ? "#000000" : "rgba(255,255,255,0.7)",
                    border: `1px solid ${isActive ? "transparent" : "rgba(0,230,118,0.1)"}`,
                  }}
                  data-ocid={`appnav.${link.page}.link`}
                >
                  {link.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                clear();
                window.location.hash = "";
                setMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all min-h-[44px] flex items-center gap-2"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              data-ocid="appnav.logout.button"
            >
              <LogOut size={15} /> Logout
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
