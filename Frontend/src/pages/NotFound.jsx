import { Link } from "react-router-dom";
import { Bike, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-slate-50">
      <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mb-6">
        <Bike size={40} className="text-orange-400" />
      </div>
      <h1 className="font-display font-extrabold text-6xl text-orange-500 mb-2">404</h1>
      <p className="text-lg text-slate-500 mb-8 max-w-xs">
        Ye page nahi mila. Shayad galat raste pe aagaye!
      </p>
      <Link to="/dashboard"
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
        <Home size={16} /> Dashboard pe wapas jao
      </Link>
    </div>
  );
}