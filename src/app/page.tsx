import Link from "next/link";
import { Sandwich } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-br from-[#5A38A4] to-[#254BA4] font-sans">
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-start px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-10">
        <div className="flex items-center">
          {/* <div className="flex h-15 w-15 -mt-2 items-center justify-center rounded-lg">
            <img
              src="/banhmilogo.png"
              alt="BanhMiBandit Logo"
              className="h-15 w-15"
            />
          </div> */}
          <Link href="/">
            <span className="pb-1.5 text-xl sm:text-2xl md:text-3xl font-normal tracking-tight text-white italic cursor-pointer hover:opacity-80 transition-opacity">
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
      <div className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="max-w-9xl mx-auto flex flex-col items-center text-left">
          {/* Main Content */}
          <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl text-left">
            {/* Headline */}
            <h1 className="mb-6 sm:mb-8 font-['Garamond'] text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[0.9] font-normal tracking-tight text-white">
              Stop chasing opportunities,
            </h1>
            <h1 className="mb-8 sm:mb-10 md:mb-12 font-['Garamond'] text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl leading-[0.9] font-bold tracking-tight text-white/90">
              Let them find you.
            </h1>

            {/* Description */}
            <div className="max-w-8xl mb-8 sm:mb-10 md:mb-12 space-y-4 sm:space-y-6">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-light text-slate-300">
                Connect your GitHub profile with companies you're targeting. Our
                AI analyzes your actual code contributions and automatically
                surfaces the roles where you'd make the biggest impact.
              </p>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-light text-slate-300">
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
              <p className="font-['Garamond'] text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-wide uppercase">
                Get Started
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 w-full sm:w-auto">
                <Link
                  href="/recruiter-choice"
                  className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-12 py-6 text-xl font-semibold tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl"
                >
                  <span className="relative z-10">For Recruiters</span>
                  <div className="absolute inset-0 bg-linear-to-r from-blue-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
                </Link>
                <Link
                  href="/applicant"
                  className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-8 py-4 sm:px-10 sm:py-5 md:px-12 md:py-6 text-base sm:text-lg md:text-xl font-semibold tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl"
                >
                  <span className="relative z-10">For Applicants</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl"></div>
      </div>
    </main>
  );
}
