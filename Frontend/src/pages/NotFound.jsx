import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-slate-50">
      <span className="text-7xl mb-4">🏍️</span>
      <h1 className="font-display font-extrabold text-7xl text-orange-500 mb-2">404</h1>
      <p className="text-lg text-slate-500 mb-8">
        Ye page nahi mila. Shayad galat raste pe aagaye!
      </p>
      <Link
        to="/dashboard"
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors"
      >
        Dashboard pe wapas jao →
      </Link>
    </div>
  );
}