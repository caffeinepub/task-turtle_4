import { FeaturedTasks } from "./components/FeaturedTasks";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Navbar } from "./components/Navbar";

export default function App() {
  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#050505" }}
    >
      {/* Ambient background glows */}
      {/* Top-left glow */}
      <div
        className="fixed top-0 left-0 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(0,230,118,0.08) 0%, transparent 60%)",
          zIndex: 0,
        }}
      />
      {/* Bottom-right glow */}
      <div
        className="fixed bottom-0 right-0 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 100% 100%, rgba(0,230,118,0.07) 0%, transparent 60%)",
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div className="relative" style={{ zIndex: 1 }}>
        <Navbar />
        <main>
          <Hero />
          <HowItWorks />
          <FeaturedTasks />
        </main>
        <Footer />
      </div>
    </div>
  );
}
