"use client";

import AuthComponent from "@/components/Auth";
import Dashboard from "@/components/Dashboard";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Home() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-secondary">
        <div className="text-accent-cyan animate-pulse">Initializing AIA Systems...</div>
      </main>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-secondary relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-orange/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-cyan/10 blur-[120px] rounded-full"></div>

      <div className="flex flex-col items-center gap-2 mb-12 text-center relative z-10">
        <h1 className="text-5xl font-bold tracking-tight text-white flex items-center gap-4">
          <span className="text-accent-orange text-6xl">A</span>
          Asai Analytics
        </h1>
        <p className="text-text-secondary text-lg font-medium">
          Agentic RAG Document Intelligence for Construction
        </p>
      </div>

      <AuthComponent />

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl relative z-10">
        <div className="glass-card p-6 flex flex-col gap-3">
          <h3 className="text-accent-cyan font-bold uppercase text-xs tracking-widest">OneDrive Triage</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Automated MCP-powered monitoring. New construction documents are triaged and indexed with zero human review.
          </p>
        </div>
        <div className="glass-card p-6 flex flex-col gap-3">
          <h3 className="text-accent-orange font-bold uppercase text-xs tracking-widest">Multimodal RAG</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Extract intelligence from blueprints, site photos, BIM videos, and complex project tables.
          </p>
        </div>
        <div className="glass-card p-6 flex flex-col gap-3">
          <h3 className="text-white font-bold uppercase text-xs tracking-widest">Traceability</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Get instant answers with precise citations to client, product, or domain-specific documents.
          </p>
        </div>
      </div>
    </main>
  );
}
