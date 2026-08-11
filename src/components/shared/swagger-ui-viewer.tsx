"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { openApiSpec } from "@/lib/swagger/openapi-spec";

// Dynamic import for SwaggerUI to prevent SSR window issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export function SwaggerUiViewer() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Header */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                OpenAPI 3.0.3
              </span>
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
                REST API Spec
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ARVENTA SaaS Platform REST API Docs
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Dokumentasi interaktif OpenAPI/Swagger untuk seluruh REST API backend ARVENTA Property Management System.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/api/docs/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              📥 Download OpenAPI JSON
            </a>
          </div>
        </div>

        {/* Swagger UI Container */}
        <div className="bg-white rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-4 sm:p-6 text-slate-900">
          <SwaggerUI spec={openApiSpec} />
        </div>
      </div>
    </div>
  );
}
