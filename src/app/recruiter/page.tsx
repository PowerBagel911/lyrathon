"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

export default function RecruiterPage() {
  const [roleInput, setRoleInput] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalKeywords, setModalKeywords] = useState("");

  // Get companyId from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCompanyId = sessionStorage.getItem("companyId");
      setCompanyId(storedCompanyId);
    }
  }, []);

  // Fetch company details
  const { data: company } = api.post.getCompanyById.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId }
  );

  // Fetch jobs for this company
  const { data: jobs = [], isLoading, refetch } = api.post.getJobsByCompany.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId }
  );

  // Create job mutation
  const createJob = api.post.createJob.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Modal handlers
  const handleOpenModal = () => {
    // Open modal with empty fields for creating a new job
    setModalTitle("");
    setModalDescription("");
    setModalKeywords("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveJob = async () => {
    if (!modalTitle.trim() || !companyId) return;

    // Parse keywords from comma-separated string
    const keywordsArray = modalKeywords
      .split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0);

    try {
      await createJob.mutateAsync({
        companyId,
        title: modalTitle.trim(),
        description: modalDescription.trim() || undefined,
        requiredSkills: keywordsArray,
      });

      // Clear and close
      setModalTitle("");
      setModalDescription("");
      setModalKeywords("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating job:", error);
      alert("Failed to create job. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-[#5A38A4] to-[#254BA4] font-sans pb-10 md:pb-16 lg:pb-20">
      {/* Main Card */}
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-10">
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
        <Link
          href="/who-applied"
          className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-4 py-3 sm:px-6 sm:py-4 text-base sm:text-lg md:text-xl font-semibold tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl"
        >
          <span className="relative z-10">Who Applied?</span>
        </Link>
      </nav>

      {/* Content */}
      <div className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        {/* Headline */}
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl text-left">
          {company && (
            <div className="mb-4 sm:mb-6">
              <span className="inline-block rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base md:text-lg font-semibold text-white border border-white/30">
                {company.name}
              </span>
            </div>
          )}
          <h1 className="mb-6 sm:mb-8 font-['Garamond'] text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[0.9] font-normal tracking-tight text-white">
            The right candidates - already ready
          </h1>
          <h1 className="mb-8 sm:mb-10 md:mb-12 font-['Garamond'] text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl leading-[0.9] font-bold tracking-tight text-white/90">
            Find the one.
          </h1>
        </div>

        {/* Search Area */}
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4 lg:gap-6">
          <input
            type="text"
            placeholder="Enter a job title (e.g., Senior Frontend Engineer)"
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            className="flex-1 rounded-full border-2 border-transparent bg-white px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base text-gray-800 placeholder-gray-500 focus:border-purple-300 focus:outline-none"
          />
          <button 
            onClick={handleOpenModal}
            className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-6 py-3 sm:px-8 sm:py-4 text-lg sm:text-xl font-semibold tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl"
          >
            Create job role
          </button>
        </div>

        {/* Existing Roles Section */}
        <div className="mt-8 sm:mt-10 md:mt-12">
          <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold text-white">
            Your existing roles:
          </h2>
          {isLoading ? (
            <div className="min-h-37.5 sm:min-h-50 rounded-2xl border-2 border-dashed border-white/30 bg-white/5 p-6 sm:p-8 text-center">
              <p className="text-sm sm:text-base text-white/60">Loading roles...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="min-h-37.5 sm:min-h-50 rounded-2xl border-2 border-dashed border-white/30 bg-white/5 p-6 sm:p-8 text-center">
              <p className="text-sm sm:text-base text-white/60">No roles created yet</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-white/20 bg-white/10 p-4 sm:p-6 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/15"
                >
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    {job.title}
                  </h3>
                  {job.description && (
                    <p className="text-sm sm:text-base text-white/80 mb-3">
                      {job.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {(job.requiredSkills as string[]).map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-white/20 px-3 py-1 text-xs sm:text-sm text-white"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          />

          {/* Modal Content */}
          <div className="relative bg-gradient-to-br from-[#3d2a6d] to-[#1e3a5f] border border-white/20 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors text-xl font-light"
            >
              ×
            </button>

            {/* Modal Header */}
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mb-6">
              Create New Job Role
            </h2>

            {/* Form */}
            <div className="space-y-5">
              {/* Job Title Input */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g., Senior Frontend Engineer"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl focus:ring-2 focus:ring-white/30 focus:outline-none"
                />
              </div>

              {/* Description Textarea */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Role Description
                </label>
                <textarea
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Describe the responsibilities and requirements..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl focus:ring-2 focus:ring-white/30 focus:outline-none resize-none"
                />
              </div>

              {/* Keywords Input */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Keywords
                </label>
                <input
                  type="text"
                  value={modalKeywords}
                  onChange={(e) => setModalKeywords(e.target.value)}
                  placeholder="React, TypeScript, Next.js (comma-separated)"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl focus:ring-2 focus:ring-white/30 focus:outline-none"
                />
                <p className="mt-1 text-xs text-white/50">
                  Separate multiple keywords with commas
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveJob}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white py-3 sm:py-4 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg mt-4"
              >
                Save Job Role
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
