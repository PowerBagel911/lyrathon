"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

export default function ApplicantPage() {
  const [companyInput, setCompanyInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  // Fetch companies based on search
  const { data: companies = [], isLoading } = api.post.getAllCompanies.useQuery(
    { search: searchTerm },
    { staleTime: 60_000 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(companyInput);
  };

  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => {
      router.push(path);
    }, 400);
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-[#5A38A4] to-[#254BA4] pb-10 font-sans md:pb-16 lg:pb-20">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/b.png"
          alt="background effect"
          className="h-full w-full object-cover opacity-30"
        />
      </div>
      {/* Navbar */}
      <nav className={`relative z-10 flex items-center justify-between px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-10 ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}>
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
      </nav>

      {/* Content */}
      <div className={`relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}>
        {/* Headline */}
        <div className="max-w-4xl text-left lg:max-w-5xl xl:max-w-6xl">
          <h1 className="mb-6 font-['Garamond'] text-3xl leading-[0.9] font-normal tracking-tight text-white sm:mb-8 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
            Apply to your dream companies,
          </h1>
          <h1 className="mb-8 font-['Garamond'] text-3xl leading-[0.9] font-bold tracking-tight text-white/90 sm:mb-10 sm:text-4xl md:mb-12 md:text-5xl lg:text-6xl xl:text-8xl">
            We will find the best roles for you.
          </h1>
        </div>

        {/* Search Area */}
        <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:gap-4 lg:gap-6">
          <input
            type="text"
            placeholder="What company do you want to work at?"
            value={companyInput}
            onChange={(e) => setCompanyInput(e.target.value)}
            className="flex-1 rounded-full border-2 border-transparent bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-500 focus:border-purple-300 focus:outline-none sm:px-6 sm:py-4 sm:text-base"
          />
          <button 
            type="submit"
            className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-6 py-3 sm:px-8 sm:py-4 text-lg sm:text-xl font-semibold tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl"
          >
            Search
          </button>
        </form>

        {/* Company Cards */}
        <div className="mt-8 sm:mt-10 md:mt-12 space-y-4 sm:space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-white/60">Loading companies...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60">No companies found. Try a different search term.</p>
            </div>
          ) : (
            companies.map((company) => {
              // Create URL-friendly company slug
              const companySlug = company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              
              return (
                <Link 
                  key={company.id}
                  href={`/applicant/${companySlug}`}
                  onClick={(e) => {
                    // Store company ID in session storage
                    sessionStorage.setItem("applicantCompanyId", company.id);
                    // Trigger fade transition
                    handleNavigation(`/applicant/${companySlug}`)(e);
                  }}
                  className="group relative block overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 text-base sm:text-lg md:text-xl font-normal tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl cursor-pointer"
                >
                  <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl font-bold text-white">
                    {company.name}
                  </h2>
                  {company.description && (
                    <p className="leading-relaxed text-sm sm:text-base md:text-lg text-white/90">
                      {company.description}
                    </p>
                  )}
                  {company.website && (
                    <p className="mt-2 text-sm text-white/70">
                      {company.website}
                    </p>
                  )}
                </Link>
              );
            })
          )}
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
          animation: fadeOut 0.4s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
