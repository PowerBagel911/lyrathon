"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sandwich } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function RecruiterSignupPage() {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const createCompany = api.post.createCompany.useMutation({
    onSuccess: (data) => {
      // Store company ID in session storage
      sessionStorage.setItem("companyId", data.id);
      // Navigate to recruiter page
      router.push("/recruiter");
    },
    onError: (error) => {
      setError(error.message || "Failed to create company. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Company name is required");
      return;
    }

    // Normalize website URL - add http:// if no protocol is provided
    let normalizedWebsite = website.trim();
    if (normalizedWebsite && !normalizedWebsite.match(/^https?:\/\//i)) {
      normalizedWebsite = `http://${normalizedWebsite}`;
    }

    try {
      createCompany.mutate({
        name: name.trim(),
        website: normalizedWebsite || undefined,
        description: description.trim() || undefined,
      });
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-[#5A38A4] to-[#254BA4] font-sans">
      

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center px-6 lg:px-12 min-h-[80vh]">
        <div className="w-full max-w-2xl">
          {/* Heading */}
          <h1 className="mb-8 text-4xl lg:text-5xl xl:text-6xl font-serif font-bold text-white leading-tight text-center">
            Sign Up for Your Company
          </h1>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div>
              <label htmlFor="name" className="block mb-2 text-lg font-medium text-white">
                Company Name <span className="text-red-300">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your company name"
                className="w-full px-6 py-4 text-lg rounded-xl bg-white text-gray-900 placeholder-gray-500 border-0 focus:ring-4 focus:ring-blue-500/50 focus:outline-none shadow-xl transition-all duration-200"
                required
                autoComplete="off"
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block mb-2 text-lg font-medium text-white">
                Website
              </label>
              <input
                id="website"
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="example.com or https://example.com"
                className="w-full px-6 py-4 text-lg rounded-xl bg-white text-gray-900 placeholder-gray-500 border-0 focus:ring-4 focus:ring-blue-500/50 focus:outline-none shadow-xl transition-all duration-200"
                autoComplete="off"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block mb-2 text-lg font-medium text-white">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your company..."
                rows={4}
                className="w-full px-6 py-4 text-lg rounded-xl bg-white text-gray-900 placeholder-gray-500 border-0 focus:ring-4 focus:ring-blue-500/50 focus:outline-none shadow-xl transition-all duration-200 resize-none"
                autoComplete="off"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/50 text-red-100">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={createCompany.isPending}
              className={`group relative overflow-hidden rounded-2xl w-full px-12 py-8 text-xl font-semibold text-white shadow-xl transition-all duration-300 tracking-wide border ${
                createCompany.isPending
                  ? "bg-gray-400 border-gray-500 cursor-not-allowed opacity-60"
                  : "border-white/30 bg-white/10 backdrop-blur-sm hover:border-white/40 hover:bg-white/20 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
              }`}
            >
              <span className="relative z-10">
                {createCompany.isPending ? "Creating Company..." : "One Banh Mi per Company"}
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-blue-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-20"></div>
            </button>

            {/* Back Link */}
            <div className="text-center">
              <Link
                href="/recruiter-auth"
                className="text-white/80 hover:text-white transition-colors text-lg underline"
              >
                Back to options
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl pointer-events-none"></div>
    </main>
  );
}
