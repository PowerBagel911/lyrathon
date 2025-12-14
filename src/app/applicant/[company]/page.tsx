"use client";

import { use, useState, useRef, useEffect } from "react";
import { Sandwich, Upload, Check } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";

interface CompanyPageProps {
  params: Promise<{
    company: string;
  }>;
}

export default function CompanyPage({ params }: CompanyPageProps) {
  const { company } = use(params);
  const [githubUrl, setGithubUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get companyId from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCompanyId = sessionStorage.getItem("applicantCompanyId");
      setCompanyId(storedCompanyId);
    }
  }, []);

  // Fetch company details
  const { data: companyData, isLoading: companyLoading } = api.post.getCompanyById.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId }
  );

  // Fetch jobs for this company
  const { data: jobs = [], isLoading: jobsLoading } = api.post.getJobsByCompany.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId }
  );

  const companyName = companyData?.name || company.charAt(0).toUpperCase() + company.slice(1);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation - accept PDF, DOC, DOCX files
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedTypes.includes(file.type)) {
        setUploadedFile(file);
        console.log("Resume uploaded:", file.name, "Size:", file.size, "bytes");
        // TODO: Process and store the resume file
      } else {
        alert("Please upload a PDF, DOC, or DOCX file.");
      }
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) {
      return;
    }
    console.log("GitHub URL:", githubUrl, "Company:", companyName, "Company ID:", companyId);
    if (uploadedFile) {
      console.log("Resume file:", uploadedFile.name);
    }
    // TODO: Implement application logic
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-[#5A38A4] to-[#254BA4] font-sans flex items-center justify-center p-6">
      {/* Central Glassmorphism Card */}
      <div className="w-full max-w-4xl bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-10 lg:p-12">
        
        {/* Header with Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-linear-to-br from-orange-400 to-orange-600">
            <Sandwich className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">BanhMiBandit</span>
        </div>

        {/* Company Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-white mb-6">
            {companyName} Careers
          </h1>
          
          {/* Upload Resume Button */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <button 
              onClick={handleFileUpload}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-6 py-3 rounded-full text-white font-medium transition-all duration-200"
            >
              {uploadedFile ? (
                <>
                  <Check className="h-4 w-4" />
                  {uploadedFile.name.length > 20 
                    ? `${uploadedFile.name.substring(0, 20)}...` 
                    : uploadedFile.name
                  }
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload your resume
                </>
              )}
            </button>
          </div>
        </div>

        {/* Input Section */}
        <form onSubmit={handleApply} className="mb-12">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* GitHub URL Input */}
            <div className="flex-1 w-full">
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="Paste your GitHub URL"
                className="w-full px-6 py-4 bg-white text-gray-900 placeholder-gray-500 rounded-full border-0 focus:ring-4 focus:ring-white/20 focus:outline-none text-lg"
                required
              />
            </div>
            
            {/* Apply Button */}
            <button
              type="submit"
              className="bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-8 py-4 rounded-full font-semibold transition-all duration-200 hover:shadow-lg whitespace-nowrap"
            >
              Apply
            </button>
          </div>
        </form>

        {/* Job Listings */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Available Positions</h2>
          {jobsLoading || companyLoading ? (
            <div className="text-center py-8">
              <p className="text-white/60">Loading job positions...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 border border-white/20 rounded-2xl bg-white/5">
              <p className="text-white/60">No open positions at the moment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {jobs.map((job) => (
                <div key={job.id} className="border border-white/20 rounded-2xl p-6 bg-white/5 hover:bg-white/10 transition-all">
                  <h3 className="text-2xl font-bold text-white mb-3">{job.title}</h3>
                  
                  {job.description && (
                    <p className="text-white/80 mb-4 leading-relaxed">
                      {job.description}
                    </p>
                  )}
                  
                  {/* Required Skills */}
                  {job.requiredSkills && (job.requiredSkills as string[]).length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-white/90 mb-2">Required Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {(job.requiredSkills as string[]).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-white/20 rounded-full text-sm text-white"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Back to Search */}
        <div className="text-center">
          <Link 
            href="/applicant"
            className="inline-block bg-black/20 hover:bg-black/30 backdrop-blur-sm border border-white/10 px-8 py-3 rounded-full text-white font-medium transition-all duration-200"
          >
            Back to Search
          </Link>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl pointer-events-none"></div>
    </main>
  );
}
