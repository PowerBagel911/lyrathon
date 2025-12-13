"use client";

import Link from "next/link";
import { useState } from "react";

export default function RecruiterPage() {
  const [roleInput, setRoleInput] = useState("");

  return (
    <main className="min-h-screen bg-linear-to-br from-[#5A38A4] to-[#254BA4] font-sans">
      {/* Main Card */}
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-8 lg:px-12">
        <div className="flex items-center">
          {/* <div className="flex h-15 w-15 -mt-2 items-center justify-center rounded-lg">
            <img
              src="/banhmilogo.png"
              alt="BanhMiBandit Logo"
              className="h-15 w-15"
            />
          </div> */}
          <Link href="/">
            <span className="pb-1.5 text-3xl font-normal tracking-tight text-white italic cursor-pointer hover:opacity-80 transition-opacity">
              BanhMiBandit
            </span>
          </Link>
        </div>
        <Link
          href="/who-applied"
          className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-4 py-4 text-xl font-semibold tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl"
        >
          <span className="relative z-10">Who Applied?</span>
        </Link>
      </nav>

      {/* Content */}
      <div className="relative px-6 lg:px-12">
        {/* Headline */}
        <div className="max-w-4xl text-left">
          <h1 className="mb-8 font-['Garamond'] text-5xl leading-[0.9] font-normal tracking-tight text-white lg:text-7xl xl:text-4xl">
            The right candidates - already ready
          </h1>
          <h1 className="mb-12 font-['Garamond'] text-5xl leading-[0.9] font-bold tracking-tight text-white/90 lg:text-7xl xl:text-8xl">
            Find the one.
          </h1>
        </div>

        {/* Search Area */}
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
          <input
            type="text"
            placeholder="Enter a job title (e.g., Senior Frontend Engineer)"
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            className="flex-1 rounded-full border-2 border-transparent bg-white px-6 py-4 text-gray-800 placeholder-gray-500 focus:border-purple-300 focus:outline-none"
          />
          <button className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-4 py-4 text-xl font-semibold tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl">
            Create job role
          </button>
        </div>

        {/* Existing Roles Section */}
        <div className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-white">
            Your existing role:
          </h2>
          {/* Empty state - roles would be displayed here */}
          <div className="min-h-50 rounded-2xl border-2 border-dashed border-white/30 bg-white/5 p-8 text-center">
            <p className="text-white/60">No roles created yet</p>
          </div>
        </div>
      </div>
    </main>
  );
}
