"use client";

import Link from "next/link";
import { Sandwich } from "lucide-react";

export default function RecruiterAuthPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#5A38A4] to-[#254BA4] font-sans">
      {/* Logo */}
      <div className="px-6 pt-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3 w-fit">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600">
            <Sandwich className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">BanhMiBandit</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center px-6 lg:px-12 min-h-[80vh]">
        <div className="w-full max-w-4xl text-center">
          {/* Heading */}
          <h1 className="mb-12 text-4xl lg:text-6xl xl:text-7xl font-serif font-bold text-white leading-tight">
            For Recruiters
          </h1>

          {/* Options */}
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-center max-w-3xl mx-auto">
            {/* Sign Up Option */}
            <Link
              href="/recruiter-signup"
              className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-12 py-8 text-xl font-semibold text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl w-full sm:w-auto min-w-[280px]"
            >
              <span className="relative z-10 block">Sign Up for Your Company</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
            </Link>

            {/* Log In Option */}
            <Link
              href="/recruiter-choice"
              className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-12 py-8 text-xl font-semibold text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl w-full sm:w-auto min-w-[280px]"
            >
              <span className="relative z-10 block">Log In with Your Company</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl pointer-events-none"></div>
    </main>
  );
}
