import type { ReactNode } from "react";
import AnimatedBackground from "./AnimatedBackground";
import Footer from "./Footer";
import Navbar from "./Navbar";
import LiveChat from "./LiveChat";
import CommunityChat from "./CommunityChat";
import FloatingBalance from "./FloatingBalance";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />

      <div className="flex flex-col min-h-screen relative z-10">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>

      <CommunityChat />
      <FloatingBalance />
    </div>
  );
}
