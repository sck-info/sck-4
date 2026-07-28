import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-[#faf7f2] overflow-hidden selection:bg-[#b86a16]/20">
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full border border-[#b86a16]/10" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[30rem] h-[30rem] rounded-full border border-[#b86a16]/10" />

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#b86a16]/10 flex items-center justify-center">
            <FileQuestion className="w-10 h-10 text-[#b86a16]" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-[#1c1f4a] font-display mb-2">404</h1>
        <p className="text-xs font-semibold text-[#b86a16] uppercase tracking-wider mb-4">Page Not Found</p>

        <p className="text-sm text-[#5a5e7a] leading-relaxed mb-8">
          The page you are looking for does not exist or has been moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white text-xs font-semibold transition-all"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
