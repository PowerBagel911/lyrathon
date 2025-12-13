import Link from "next/link";
import { Sandwich } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 font-sans">
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-8 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600">
            <Sandwich className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">BanhMiBandit</span>
        </div>
        <Link 
          href="/signin" 
          className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-white/20 hover:border-white/30 tracking-wide"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="relative px-6 lg:px-12">
        <div className="mx-auto max-w-6xl pt-16 pb-24 lg:pt-24 lg:pb-32">
          {/* Main Content */}
          <div className="text-left max-w-4xl">
            {/* Headline */}
            <h1 className="mb-8 text-5xl font-black leading-[0.9] text-white lg:text-7xl xl:text-8xl tracking-tight">
              Stop chasing opportunities.
            </h1>
            <h2 className="mb-12 text-5xl font-black leading-[0.9] text-white/90 lg:text-7xl xl:text-8xl tracking-tight">
              Let them find you.
            </h2>

            {/* Description */}
            <div className="mb-16 max-w-2xl space-y-6">
              <p className="text-xl leading-relaxed text-slate-300 lg:text-2xl font-light">
                Connect your GitHub profile with companies you're targeting. 
                Our AI analyzes your actual code contributions and automatically surfaces 
                the roles where you'd make the biggest impact.
              </p>
              <p className="text-xl leading-relaxed text-slate-300 lg:text-2xl font-light">
                Get instant match scores with detailed explanations. Hiring teams see 
                the same analysis. When there's mutual fit, conversations happen naturally. 
                <span className="font-medium text-white"> One profile, unlimited opportunities.</span>
              </p>
            </div>

            {/* Action Area */}
            <div className="space-y-8">
              <p className="text-lg text-slate-400 font-medium tracking-wide uppercase text-sm">Get Started</p>
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                <Link
                  href="/recruiter"
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-12 py-6 text-xl font-semibold text-white shadow-xl transition-all duration-300 hover:from-blue-500 hover:to-blue-600 hover:shadow-2xl hover:-translate-y-1 tracking-wide"
                >
                  <span className="relative z-10">For Recruiters</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
                </Link>
                <Link
                  href="/applicant"
                  className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/30 px-12 py-6 text-xl font-semibold text-white shadow-xl transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl hover:-translate-y-1 tracking-wide"
                >
                  <span className="relative z-10">For Developers</span>
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
