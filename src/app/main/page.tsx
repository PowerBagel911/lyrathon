"use client";

import Link from "next/link";
import { Sandwich } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
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
    <main className="relative min-h-screen bg-linear-to-br from-[#5A38A4] to-[#254BA4] font-sans">
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
          <Link href="/">
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

      {/* Hero Section */}
      <div
        className={`relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 ${isExiting ? "animate-fade-out" : "animate-fade-in"}`}
      >
        <div className="max-w-9xl mx-auto flex flex-col items-center text-left">
          {/* Main Content */}
          <div className="max-w-4xl text-left lg:max-w-5xl xl:max-w-6xl">
            {/* Headline */}
            <h1 className="mb-6 font-['Garamond'] text-3xl leading-[0.9] font-normal tracking-tight text-white sm:mb-8 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              Stop chasing opportunities,
            </h1>
            <h1 className="mb-8 font-['Garamond'] text-3xl leading-[0.9] font-bold tracking-tight text-white/90 sm:mb-10 sm:text-4xl md:mb-12 md:text-5xl lg:text-6xl xl:text-8xl">
              Let them find you.
            </h1>

            {/* Description */}
            <div className="max-w-8xl mb-8 space-y-4 sm:mb-10 sm:space-y-6 md:mb-12">
              <p className="text-base leading-relaxed font-light text-slate-300 sm:text-lg md:text-xl lg:text-2xl">
                Connect your GitHub profile with companies you're targeting. Our
                AI analyzes your actual code contributions and automatically
                surfaces the roles where you'd make the biggest impact.
              </p>
              <p className="text-base leading-relaxed font-light text-slate-300 sm:text-lg md:text-xl lg:text-2xl">
                Get instant match scores with detailed explanations. Hiring
                teams see the same analysis. When there's mutual fit,
                conversations happen naturally.
                <span className="font-medium text-white">
                  {" "}
                  One profile, unlimited opportunities.
                </span>
              </p>
            </div>

            {/* Action Area */}
            <div className="flex flex-col items-center space-y-6 sm:space-y-8">
              <p className="font-['Garamond'] text-xl font-bold tracking-wide text-white uppercase sm:text-2xl md:text-3xl">
                Get Started
              </p>
              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:gap-6">
                <Link
                  href="/recruiter-auth"
                  onClick={handleNavigation("/recruiter-auth")}
                  className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl sm:px-10 sm:py-5 sm:text-lg md:px-12 md:py-6 md:text-xl"
                >
                  <span className="relative z-10">For Recruiters</span>
                  <div className="absolute inset-0 bg-linear-to-r from-blue-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
                </Link>
                <Link
                  href="/applicant"
                  onClick={handleNavigation("/applicant")}
                  className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl sm:px-10 sm:py-5 sm:text-lg md:px-12 md:py-6 md:text-xl"
                >
                  <span className="relative z-10">For Applicants</span>
                  <div className="absolute inset-0 bg-linear-to-r from-blue-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          animation: fadeOut 0.8s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
