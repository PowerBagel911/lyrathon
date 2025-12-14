"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RecruiterAuthPage() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => {
      router.push(path);
    }, 400);
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-[#5A38A4] to-[#254BA4] font-sans">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/b.png"
          alt="background effect"
          className="h-full w-full object-cover opacity-30"
        />
      </div>

      {/* Navbar */}
      <nav
        className={`relative z-10 flex items-center justify-start px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-10 ${isExiting ? "animate-fade-out" : "animate-fade-in"}`}
      >
        <div className="flex items-center">
          {/* <div className="flex h-15 w-15 -mt-2 items-center justify-center rounded-lg">
            <img
              src="/banhmilogo.png"
              alt="BanhMiBandit Logo"
              className="h-15 w-15"
            />
          </div> */}
          <Link href="/" onClick={handleNavigation("/")}>
            <span
              style={{ fontFamily: "var(--font-my-font)" }}
              className="cursor-pointer pb-1.5 text-xl font-normal tracking-tight text-white transition-opacity hover:opacity-80 sm:text-2xl md:text-3xl"
            >
              BanhMiBandit
            </span>
          </Link>
        </div>
        {/* <Link 
          href="/signin" 
          className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-white/20 hover:border-white/30 tracking-wide"
        >
          Sign In
        </Link> */}
      </nav>

      {/* Main Content */}
      <div
        className={`flex min-h-[80vh] flex-col items-center justify-center px-6 lg:px-12 ${isExiting ? "animate-fade-out" : "animate-fade-in"}`}
      >
        <div className="w-full max-w-4xl text-center">
          {/* Heading */}
          <h1 className="mb-12 font-serif text-4xl leading-tight font-bold text-white lg:text-6xl xl:text-7xl">
            For Recruiters
          </h1>

          {/* Options */}
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 sm:flex-row">
            {/* Sign Up Option */}
            <Link
              href="/recruiter-signup"
              onClick={handleNavigation("/recruiter-signup")}
              className="group relative w-full min-w-70 overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-12 py-8 text-xl font-semibold text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl sm:w-auto"
            >
              <span className="relative z-10 block">
                Sign Up for Your Company
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-blue-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
            </Link>

            {/* Log In Option */}
            <Link
              href="/recruiter-choice"
              onClick={handleNavigation("/recruiter-choice")}
              className="group relative w-full min-w-70 overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-12 py-8 text-xl font-semibold text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl sm:w-auto"
            >
              <span className="relative z-10 block">
                Log In with Your Company
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-blue-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-1/4 left-1/4 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl"></div>

      <style jsx>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-in forwards;
        }

        .animate-fade-out {
          animation: fadeOut 0.4s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
