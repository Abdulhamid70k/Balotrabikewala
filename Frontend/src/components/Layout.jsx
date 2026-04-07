// Layout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header  from "./Header";

export default function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setOpen(false)} />
      )}
      <div className="flex-1 flex flex-col md:ml-60 min-w-0">
        <Header onMenuClick={() => setOpen(true)} />
        <main className="flex-1 p-4 md:p-6">
          <div style={{ animation: "fadeUp .22s ease both" }}>
            <Outlet />
          </div>
        </main>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}