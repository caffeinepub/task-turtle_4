import { ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { FeaturedTasks } from "./components/FeaturedTasks";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { LiveMap } from "./components/LiveMap";
import { Navbar } from "./components/Navbar";
import { OTPVerification } from "./components/OTPVerification";
import { PaymentDemo } from "./components/PaymentDemo";
import { TaskTimeline } from "./components/TaskTimeline";
import { TurtleChatbot } from "./components/TurtleChatbot";
import { YouTubeSlider } from "./components/YouTubeSlider";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { AdminPage } from "./pages/AdminPage";
import { BlogPage } from "./pages/BlogPage";
import { Dashboard } from "./pages/Dashboard";
import { FeaturesPage } from "./pages/FeaturesPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { LoginPage } from "./pages/LoginPage";
import MyProfile from "./pages/MyProfile";
import { TaskerPage } from "./pages/TaskerPage";
import { TasksPage } from "./pages/TasksPage";
import { WalletPage } from "./pages/WalletPage";

const GREEN = "#00E676";

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return hash;
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const hash = useHashRoute();
  const isAuthenticated = !!identity;

  // After login, redirect to admin if that was the intent
  useEffect(() => {
    if (isAuthenticated && !isInitializing) {
      const intent = localStorage.getItem("loginIntent");
      if (intent === "admin" && hash !== "#admin") {
        window.location.hash = "#admin";
      }
    }
  }, [isAuthenticated, isInitializing, hash]);

  const [showOTP, setShowOTP] = useState(false);
  const [verified, setVerified] = useState(false);

  function handleVerified() {
    setShowOTP(false);
    setVerified(true);
    setTimeout(() => setVerified(false), 3500);
  }

  if (isInitializing) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#000000" }}
      >
        <div
          className="w-12 h-12 rounded-full border-2 animate-spin"
          style={{
            borderColor: "rgba(0,230,118,0.2)",
            borderTopColor: "#00E676",
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Separate pages via hash routing
  if (hash === "#admin")
    return (
      <>
        <AdminPage />
        <TurtleChatbot />
      </>
    );
  if (hash === "#dashboard")
    return (
      <>
        <Dashboard />
        <TurtleChatbot />
      </>
    );
  if (hash === "#profile")
    return (
      <>
        <MyProfile />
        <TurtleChatbot />
      </>
    );
  if (hash === "#tasker")
    return (
      <>
        <TaskerPage />
        <TurtleChatbot />
      </>
    );
  if (hash === "#wallet")
    return (
      <>
        <WalletPage />
        <TurtleChatbot />
      </>
    );
  if (hash === "#features")
    return (
      <>
        <FeaturesPage />
        <TurtleChatbot />
      </>
    );
  if (hash === "#how-it-works")
    return (
      <>
        <HowItWorksPage />
        <TurtleChatbot />
      </>
    );
  if (hash === "#tasks")
    return (
      <>
        <TasksPage />
        <TurtleChatbot />
      </>
    );
  if (hash === "#blog")
    return (
      <>
        <BlogPage />
        <TurtleChatbot />
      </>
    );

  // Default: Landing page (Home)
  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      <div
        className="fixed top-0 left-0 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(0,230,118,0.08) 0%, transparent 60%)",
          zIndex: 0,
        }}
      />
      <div
        className="fixed bottom-0 right-0 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 100% 100%, rgba(0,230,118,0.07) 0%, transparent 60%)",
          zIndex: 0,
        }}
      />

      <AnimatePresence>
        {showOTP && (
          <motion.div
            key="otp-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(6px)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md"
            >
              <OTPVerification
                taskId="demo-task-001"
                taskTitle="Grocery Pickup – Bandra"
                onVerified={handleVerified}
                onCancel={() => setShowOTP(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative" style={{ zIndex: 1 }}>
        <Navbar />
        <main>
          <Hero />
          <HowItWorks />
          <YouTubeSlider />
          <LiveMap />
          <FeaturedTasks />

          {/* Task Timeline Demo */}
          <section className="py-20 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <p
                  className="text-xs font-semibold tracking-widest uppercase mb-3"
                  style={{ color: GREEN }}
                >
                  Live Tracking
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Always know where your task is
                </h2>
                <p className="text-white/50 text-base max-w-md mx-auto">
                  Real-time stage updates from the moment your task is posted to
                  final verification.
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-6 justify-center items-start">
                <div className="w-full max-w-sm mx-auto">
                  <p className="text-white/30 text-xs text-center mb-3 uppercase tracking-widest">
                    Just started
                  </p>
                  <TaskTimeline currentStage={1} />
                </div>
                <div className="w-full max-w-sm mx-auto">
                  <p
                    className="text-xs text-center mb-3 uppercase tracking-widest font-semibold"
                    style={{ color: GREEN }}
                  >
                    In progress
                  </p>
                  <TaskTimeline currentStage={3} />
                </div>
                <div className="w-full max-w-sm mx-auto">
                  <p className="text-white/30 text-xs text-center mb-3 uppercase tracking-widest">
                    Completed
                  </p>
                  <TaskTimeline currentStage={5} />
                </div>
              </div>
            </div>
          </section>

          {/* OTP Demo */}
          <section className="py-20 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <p
                  className="text-xs font-semibold tracking-widest uppercase mb-3"
                  style={{ color: GREEN }}
                >
                  Secure Handoff
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  OTP-verified task completion
                </h2>
                <p className="text-white/50 text-base max-w-md mx-auto">
                  Every delivery is confirmed with a one-time code — so only you
                  can mark a task as done.
                </p>
              </div>
              <div className="flex justify-center">
                <div
                  className="relative w-full max-w-sm rounded-2xl p-8 text-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid rgba(0,230,118,0.12)",
                  }}
                  data-ocid="otp.card"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                    style={{
                      background: `${GREEN}18`,
                      border: `1px solid ${GREEN}35`,
                      boxShadow: `0 0 24px ${GREEN}25`,
                    }}
                  >
                    <ShieldCheck size={28} style={{ color: GREEN }} />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">
                    Grocery Pickup – Bandra
                  </h3>
                  <p className="text-white/40 text-sm mb-1">
                    Task ID: demo-task-001
                  </p>
                  <p className="text-white/30 text-xs mb-8">
                    Tap below to simulate the delivery verification flow
                  </p>
                  <AnimatePresence>
                    {verified && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mb-5 px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                        style={{
                          background: `${GREEN}18`,
                          border: `1px solid ${GREEN}50`,
                          color: GREEN,
                        }}
                        data-ocid="otp.success_state"
                      >
                        <ShieldCheck size={16} /> Task verified successfully!
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    type="button"
                    className="w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200"
                    style={{
                      background:
                        "linear-gradient(135deg, #00E676 0%, #00ff90 55%, #00E676 100%)",
                      color: "#000",
                      boxShadow:
                        "0 0 24px rgba(0,230,118,0.55), 0 0 48px rgba(0,230,118,0.2)",
                    }}
                    onClick={() => {
                      setVerified(false);
                      setShowOTP(true);
                    }}
                    data-ocid="otp.open_modal_button"
                  >
                    Verify Task
                  </button>
                  <p className="text-white/20 text-xs mt-4">
                    A 6-digit OTP will be generated for this task
                  </p>
                </div>
              </div>
            </div>
          </section>

          <PaymentDemo />
        </main>
        <Footer />
      </div>

      {/* Floating Turtle Chatbot — visible on all pages */}
      <TurtleChatbot />
    </div>
  );
}
