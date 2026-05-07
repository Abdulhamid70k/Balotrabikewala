import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import BottomNav from "./Bottomnav";

export default function Layout() {
  const { pathname } = useLocation();

  // Pages jahan bottom nav nahi dikhega (forms)
  const hideNav = ["/stock/add", "/stock/service", "/sale"].some(p =>
    pathname.startsWith(p)
  ) || pathname.includes("/edit") || pathname.includes("/sell");

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 max-w-2xl mx-auto">
      <Header />
      <main className={`flex-1 overflow-y-auto ${hideNav ? "" : "pb-20"}`}>
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
      {!hideNav && <BottomNav />}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .page-enter { animation: fadeUp 0.2s ease both; }
      `}</style>
    </div>
  );
}