"use client";

import Link from "next/link";

export default function Home() {
  return (
    <Link href="/main" className="block cursor-pointer">
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-[#5A38A4] to-[#254BA4] font-sans">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/banhmilogo.png"
            alt="background effect"
            className="h-full w-full object-cover opacity-15"
          />
        </div>
        <div className="relative text-center">
          {/* Logo - falls from top with overlap */}
          <div
            className="animate-fall-down absolute top-1/2 left-1/2 z-20"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            <img
              src="/banhmilogo.png"
              alt="BanhMi Logo"
              className="h-auto w-[40vw] max-w-350 sm:max-w-400 md:max-w-450 lg:max-w-500"
            />
          </div>

          {/* Text - rises from bottom */}
          <h1
            className="animate-rise-up relative z-10 text-8xl font-normal whitespace-pre-line text-white sm:text-9xl md:text-[12rem] lg:text-[14rem] xl:text-[16rem]"
            style={{ fontFamily: "var(--font-my-font)" }}
          >
            {`BanhMi` + `\n` + `Bandit`}
          </h1>
        </div>
      </main>

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

        @keyframes fallDown {
          0% {
            transform: translate(-50%, -50%) translateY(-100vh);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translateY(0);
            opacity: 1;
          }
        }

        @keyframes riseUp {
          0% {
            transform: translateY(100vh);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-in forwards;
        }

        .animate-fade-out {
          animation: fadeOut 0.8s ease-out forwards;
        }

        .animate-fall-down {
          animation: fallDown 1.5s ease-out forwards;
        }

        .animate-rise-up {
          animation: riseUp 1.5s ease-out forwards;
        }
      `}</style>
    </Link>
  );
}
