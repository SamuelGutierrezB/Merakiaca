import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#E8DFCA] via-white to-[#E8DFCA]">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
