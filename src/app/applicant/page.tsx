"use client";

import Link from "next/link";
import { useState } from "react";

export default function ApplicantPage() {
  const [companyInput, setCompanyInput] = useState("");

  return (
    <main className="min-h-screen bg-linear-to-br from-[#5A38A4] to-[#254BA4] font-sans pb-10">
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
            <span className="cursor-pointer pb-1.5 text-3xl font-normal tracking-tight text-white italic transition-opacity hover:opacity-80">
              BanhMiBandit
            </span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="relative px-6 lg:px-12">
        {/* Headline */}
        <div className="max-w-4xl text-left">
          <h1 className="mb-8 font-['Garamond'] text-5xl leading-[0.9] font-normal tracking-tight text-white lg:text-7xl xl:text-4xl">
            Apply to your dream companies,
          </h1>
          <h1 className="mb-12 font-['Garamond'] text-5xl leading-[0.9] font-bold tracking-tight text-white/90 lg:text-7xl xl:text-8xl">
            We will find the best roles for you.
          </h1>
        </div>

        {/* Search Area */}
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
          <input
            type="text"
            placeholder="What company do you want to work at?"
            value={companyInput}
            onChange={(e) => setCompanyInput(e.target.value)}
            className="flex-1 rounded-full border-2 border-transparent bg-white px-6 py-4 text-gray-800 placeholder-gray-500 focus:border-purple-300 focus:outline-none"
          />
          <button className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-4 py-4 text-xl font-semibold tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl">
            Search
          </button>
        </div>

        {/* Sample Company Cards */}
        <div className="mt-12 space-y-6">
          {/* Google Card */}
          <Link 
            href="/applicant/google"
            className="group relative block overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-4 py-4 text-xl font-normal tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl cursor-pointer"
          >
            <h2 className="mb-4 text-3xl font-bold text-white">Google</h2>
            <p className="leading-relaxed text-white/90">
              Google is a leading technology company that builds products and
              services to help people find, create, and share information,
              including search, ads, cloud, software, and AI, all powered by its
              core mission to organize the world's information
            </p>
          </Link>

          {/* Amazon Card */}
          <Link 
            href="/applicant/amazon"
            className="group relative block overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-4 py-4 text-xl font-normal tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl cursor-pointer"
          >
            <h2 className="mb-4 text-3xl font-bold text-white">Amazon</h2>
            <p className="leading-relaxed text-white/90">
              a global tech giant known for its massive e-commerce platform,
              leading cloud computing (AWS), digital streaming (Prime Video),
              and AI services, evolving from an online bookstore into "the
              everything store" offering everything from groceries to
              electronics, driven by customer obsession and innovation.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
