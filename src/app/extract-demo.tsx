"use client";
import { useState } from "react";
import { api } from "../trpc/react";

export default function ExtractDemoPage() {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [geminiKey, setGeminiKey] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [jobSpecA, setJobSpecA] = useState("");
  const [jobSpecB, setJobSpecB] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const extractCV = api.extract.extractCV.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cvFile) return alert("Please select a CV file");
    setLoading(true);
    const fileBuffer = await cvFile.arrayBuffer();
    const base64 = Buffer.from(fileBuffer).toString("base64");
    extractCV.mutate(
      {
        cvFile: base64,
        cvFileType: cvFile.type,
        cvFileName: cvFile.name,
        geminiKey,
        githubUrl,
        jobSpecA,
        jobSpecB,
      },
      {
        onSuccess: (data) => setResult(data),
        onError: (err) => setResult({ error: err.message }),
        onSettled: () => setLoading(false),
      }
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h1>Extract CV Demo (tRPC)</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>CV File (PDF/DOCX): </label>
          <input type="file" accept=".pdf,.docx" onChange={e => setCvFile(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label>Gemini API Key: </label>
          <input type="text" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} required />
        </div>
        <div>
          <label>GitHub Profile URL: </label>
          <input type="text" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
        </div>
        <div>
          <label>Job Spec A: </label>
          <textarea value={jobSpecA} onChange={e => setJobSpecA(e.target.value)} />
        </div>
        <div>
          <label>Job Spec B: </label>
          <textarea value={jobSpecB} onChange={e => setJobSpecB(e.target.value)} />
        </div>
        <button type="submit" disabled={loading}>{loading ? "Processing..." : "Extract"}</button>
      </form>
      {result && (
        <pre style={{ marginTop: 24, background: "#f5f5f5", padding: 16, borderRadius: 8 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
