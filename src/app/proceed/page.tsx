"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function ProceedPage() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => {
      router.push(path);
    }, 400);
  };

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

  // Fetch applications for this company (proceeded status)
  const { data: applications = [], isLoading } = api.post.getApplicationsByCompany.useQuery(
    { companyId: companyId!, status: "proceeded" },
    { enabled: !!companyId }
  );

  // Fetch analysis for selected application
  const { data: analysis, isLoading: analysisLoading } = api.post.getApplicationAnalysis.useQuery(
    { applicationId: selectedApplicationId! },
    { enabled: !!selectedApplicationId }
  );

  // Filter and sort applications
  const filteredAndSortedApplications = applications
    .filter((app) => {
      if (!searchTerm.trim()) return true;
      const searchLower = searchTerm.toLowerCase();
      const name = app.applicant.name?.toLowerCase() || "";
      const email = app.applicant.email.toLowerCase();
      return name.includes(searchLower) || email.includes(searchLower);
    })
    .sort((a, b) => {
      const dateA = new Date(a.appliedAt).getTime();
      const dateB = new Date(b.appliedAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  return (
    <main className="min-h-screen bg-linear-to-br from-[#5A38A4] to-[#254BA4] font-sans pb-10 md:pb-16 lg:pb-20">
      {/* Custom styles for dropdown */}
      <style jsx global>{`
        select {
          background-color: rgba(90, 56, 164, 0.1) !important;
        }
        select option {
          background-color: #5A38A4 !important;
          color: white !important;
        }
        select option:checked,
        select option:hover,
        select option:focus {
          background-color: #6B4AB8 !important;
          color: white !important;
        }
        select:focus option:checked {
          background-color: #6B4AB8 !important;
          color: white !important;
        }
      `}</style>
      {/* Navbar */}
      <nav className={`relative z-10 flex items-center justify-between px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-10 ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}>
        <div className="flex items-center">
          <Link href="/" onClick={handleNavigation('/')}>
            <span
              style={{ fontFamily: "var(--font-my-font)" }}
              className="cursor-pointer pb-1.5 text-xl font-normal tracking-tight text-white transition-opacity hover:opacity-80 sm:text-2xl md:text-3xl"
            >
              BanhMiBandit
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/who-applied"
            onClick={handleNavigation('/who-applied')}
            className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-4 py-3 sm:px-6 sm:py-4 text-base sm:text-lg md:text-xl font-semibold tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl"
          >
            <span className="relative z-10">Who Applied</span>
          </Link>
          <Link
            href="/recruiter"
            onClick={handleNavigation('/recruiter')}
            className="group relative overflow-hidden rounded-2xl border border-white/30 bg-white/10 px-4 py-3 sm:px-6 sm:py-4 text-base sm:text-lg md:text-xl font-semibold tracking-wide text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/20 hover:shadow-2xl"
          >
            <span className="relative z-10">Back to Recruiter</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className={`relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}>
        {/* Headline */}
        <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl text-left mb-8">
          {company && (
            <div className="mb-4 sm:mb-6">
              <span className="inline-block rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base md:text-lg font-semibold text-white border border-white/30">
                {company.name}
              </span>
            </div>
          )}
          <h1 className="mb-6 sm:mb-8 font-['Garamond'] text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[0.9] font-normal tracking-tight text-white">
            Proceed
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applicants List */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Proceeded Applicants</h2>
              <div className="text-sm text-white/60">
                {filteredAndSortedApplications.length} {filteredAndSortedApplications.length === 1 ? "applicant" : "applicants"}
              </div>
            </div>

            {/* Search and Sort Controls */}
            <div className="mb-4 space-y-3">
              {/* Search Input */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
              />
              
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-white/80">Sort by:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    paddingRight: '2.5rem',
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-white/60">Loading applicants...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8 border border-white/20 rounded-2xl bg-white/5">
                <p className="text-white/60">No proceeded applicants yet</p>
              </div>
            ) : filteredAndSortedApplications.length === 0 ? (
              <div className="text-center py-8 border border-white/20 rounded-2xl bg-white/5">
                <p className="text-white/60">No applicants found matching "{searchTerm}"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedApplications.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedApplicationId(app.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedApplicationId === app.id
                        ? "bg-white/20 border-white/40"
                        : "bg-white/5 border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-white">
                          {app.applicant.name || app.applicant.email}
                        </p>
                        <p className="text-sm text-white/60">{app.applicant.email}</p>
                        <p className="text-xs text-white/40 mt-1">
                          Applied: {new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Analysis Results */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Analysis Results</h2>
            {!selectedApplicationId ? (
              <div className="text-center py-8 border border-white/20 rounded-2xl bg-white/5">
                <p className="text-white/60">Select an applicant to view analysis</p>
              </div>
            ) : analysisLoading ? (
              <div className="text-center py-8">
                <p className="text-white/60">Loading analysis...</p>
              </div>
            ) : !analysis || (!analysis.cvClaims && !analysis.evidenceValidation && !analysis.jobFitAnalysis) ? (
              <div className="text-center py-8 border border-white/20 rounded-2xl bg-white/5">
                <p className="text-white/60">Analysis is still processing...</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-150 overflow-y-auto">
                {/* Evidence Validation */}
                {analysis.evidenceValidation && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-2">GitHub Validation</h3>
                    <p className="text-white/80 mb-2">
                      <span className="font-semibold">Match Score:</span> {analysis.evidenceValidation.matchScore}%
                    </p>
                    <p className="text-white/70 text-sm whitespace-pre-wrap">
                      {analysis.evidenceValidation.summary}
                    </p>
                  </div>
                )}

                {/* Job Fit Analysis */}
                {analysis.jobFitAnalysis && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-2">Job Match Analysis</h3>
                    <p className="text-white/80 mb-2">
                      <span className="font-semibold">Preferred Role:</span> {analysis.jobFitAnalysis.preferredRole}
                    </p>
                    <p className="text-white/80 mb-2">
                      <span className="font-semibold">Skill Coverage:</span> {analysis.jobFitAnalysis.skillCoveragePercentage}%
                    </p>
                    <div className="mb-3">
                      <p className="text-white/80 font-semibold mb-1">Match Scores:</p>
                      <div className="space-y-1">
                        {Object.entries(analysis.jobFitAnalysis.roleMatchScores as Record<string, number>).map(([job, score]) => (
                          <p key={job} className="text-white/70 text-sm">
                            {job}: {score}%
                          </p>
                        ))}
                      </div>
                    </div>
                    {Array.isArray(analysis.jobFitAnalysis.matchedSkills) && analysis.jobFitAnalysis.matchedSkills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-white/80 font-semibold mb-1">Matched Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.jobFitAnalysis.matchedSkills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green-500/20 rounded text-sm text-green-200">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray(analysis.jobFitAnalysis.missingSkills) && analysis.jobFitAnalysis.missingSkills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-white/80 font-semibold mb-1">Missing Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.jobFitAnalysis.missingSkills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-red-500/20 rounded text-sm text-red-200">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-white/70 text-sm whitespace-pre-wrap mt-3">
                      {analysis.jobFitAnalysis.summary}
                    </p>
                  </div>
                )}

                {/* CV Claims */}
                {analysis.cvClaims && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-2">Extracted Skills</h3>
                    {Array.isArray(analysis.cvClaims.skills) && analysis.cvClaims.skills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-white/80 font-semibold mb-1">Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.cvClaims.skills.slice(0, 20).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-white/20 rounded text-sm text-white">
                              {skill.name} ({skill.category})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Repositories */}
                {analysis.repositories && analysis.repositories.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-2">GitHub Repositories</h3>
                    <div className="space-y-2">
                      {analysis.repositories.slice(0, 5).map((repo) => (
                        <div key={repo.id} className="p-2 bg-white/5 rounded">
                          <a
                            href={repo.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-300 hover:text-blue-200 text-sm font-medium"
                          >
                            {repo.repoName}
                          </a>
                          {repo.isFork && (
                            <span className="ml-2 text-xs text-white/50">(Fork)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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
