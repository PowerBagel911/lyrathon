"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sandwich } from "lucide-react";
import Link from "next/link";

export default function RecruiterChoicePage() {
  const [companyName, setCompanyName] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      return;
    }

    console.log("Company Name:", companyName);
    
    // TODO: Add database interaction here
    // - Check if the company exists in the database
    // - If not, create a new company record
    // - Store company information for the recruiter session
    
    // For now, navigate to the recruiter page
    router.push("/recruiter");
  };

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
            What company are you coming from?
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-3xl mx-auto">
            {/* Input Field */}
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                className="w-full px-8 py-6 text-xl rounded-2xl bg-white text-gray-900 placeholder-gray-500 border-0 focus:ring-4 focus:ring-blue-500/50 focus:outline-none shadow-xl transition-all duration-200"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-12 py-6 text-xl font-semibold text-white shadow-xl transition-all duration-300 hover:from-blue-500 hover:to-blue-600 hover:shadow-2xl hover:-translate-y-1 tracking-wide whitespace-nowrap"
            >
              <span className="relative z-10">Start Hiring</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
            </button>
          </form>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl pointer-events-none"></div>
    </main>
  );
}
