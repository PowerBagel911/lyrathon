"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sandwich } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function RecruiterChoicePage() {
  const [companyName, setCompanyName] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => {
      router.push(path);
    }, 400);
  };

  // Fetch company names based on search input
  const { data: companyOptions = [], isFetching } = api.post.getCompanyNames.useQuery(
    { search: companyName },
    { 
      enabled: companyName.length > 0,
      staleTime: 60_000,
    }
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDropdown || companyOptions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < companyOptions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const selected = companyOptions[selectedIndex];
        if (selected) {
          handleSelectCompany(selected.id, selected.name);
        }
      } else if (e.key === "Escape") {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDropdown, companyOptions, selectedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyName(e.target.value);
    setSelectedCompanyId(null); // Reset selection when typing
    setShowDropdown(true);
    setSelectedIndex(-1);
  };

  const handleSelectCompany = (id: string, name: string) => {
    setCompanyName(name);
    setSelectedCompanyId(id);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompanyId) {
      alert("Please select a company from the dropdown list.");
      return;
    }

    try {
      // Store company ID in session storage
      sessionStorage.setItem("companyId", selectedCompanyId);
      
      // Navigate to recruiter page without exposing company ID in URL
      router.push("/recruiter");
    } catch (error) {
      console.error("Error processing company:", error);
      alert("Failed to process company. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-[#5A38A4] to-[#254BA4] font-sans">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/b.png"
          alt="background effect"
          className="h-full w-full object-cover opacity-30"
        />
      </div>
      {/* Navbar */}
      <nav className={`relative z-10 flex items-center justify-start px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-10 ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}>
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

      {/* Main Content */}
      <div className={`flex min-h-[80vh] flex-col items-center justify-center px-6 lg:px-12 ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}>
        <div className="w-full max-w-4xl text-center">
          {/* Heading */}
          <h1 className="mb-12 font-serif text-4xl leading-tight font-bold text-white lg:text-6xl xl:text-7xl">
            What company are you coming from?
          </h1>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {/* Input Field */}
            <div className="flex-1 w-full sm:w-auto relative">
              <input
                ref={inputRef}
                type="text"
                value={companyName}
                onChange={handleInputChange}
                onFocus={() => companyName && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Enter your company name"
                className="w-full rounded-2xl border-0 bg-white px-8 py-6 text-xl text-gray-900 placeholder-gray-500 shadow-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/50 focus:outline-none"
                required
                autoComplete="off"
              />
              
              {/* Dropdown */}
              {showDropdown && companyOptions.length > 0 && (
                <ul
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50 border border-gray-200"
                >
                  {companyOptions.map((company, idx) => (
                    <li
                      key={company.id}
                      className={`px-8 py-4 text-lg cursor-pointer transition-colors ${
                        selectedIndex === idx
                          ? "bg-blue-100 text-blue-900"
                          : "text-gray-900 hover:bg-gray-100"
                      } ${
                        idx === 0 ? "rounded-t-xl" : ""
                      } ${
                        idx === companyOptions.length - 1 ? "rounded-b-xl" : "border-b border-gray-100"
                      }`}
                      onMouseDown={() => handleSelectCompany(company.id, company.name)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      {company.name}
                    </li>
                  ))}
                </ul>
              )}
              
              {/* Loading indicator */}
              {isFetching && companyName && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedCompanyId}
              className={`group relative overflow-hidden rounded-2xl px-12 py-6 text-xl font-semibold text-white shadow-xl transition-all duration-300 tracking-wide whitespace-nowrap ${
                selectedCompanyId
                  ? "bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed opacity-60"
              }`}
            >
              <span className="relative z-10">Start Hiring</span>
            </button>
          </form>
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
