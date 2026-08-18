'use client';

import React from 'react';
import { Clock, User, FileText, ShieldCheck } from 'lucide-react';
import { TimelineLog } from '../../types';

interface ReportHistoryTimelineProps {
  timeline: TimelineLog[];
}

export default function ReportHistoryTimeline({ timeline }: ReportHistoryTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-gray-400 italic bg-gray-50 rounded-xl border border-gray-100">
        Belum ada riwayat audit trail terrekam.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-[#8FA28A]" />
          Riwayat Audit Trail & Status Timeline
        </h4>
        <span className="text-[10px] font-bold text-gray-400">
          {timeline.length} Catatan
        </span>
      </div>

      {/* Vertical Stepper Timeline */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
        {timeline.map((log, index) => {
          const isLatest = index === timeline.length - 1;

          return (
            <div key={log.id || `timeline-${index}`} className="relative group">
              {/* Stepper Dot */}
              <div
                className={`absolute -left-6 top-1 h-5 w-5 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                  isLatest
                    ? 'border-[#8FA28A] ring-4 ring-[#8FA28A]/20'
                    : 'border-gray-300'
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    isLatest ? 'bg-[#8FA28A]' : 'bg-gray-400'
                  }`}
                />
              </div>

              {/* Log Card Box */}
              <div className="p-3 rounded-xl border border-gray-200 bg-white shadow-sm space-y-1.5 text-xs">
                {/* Header: Actor & Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-bold text-gray-800">{log.performerName}</span>
                    <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-1.5 py-0.5 rounded">
                      {log.performerRole}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider">
                  <span className="px-2 py-0.5 rounded bg-[#8FA28A]/10 text-[#6A7866] border border-[#8FA28A]/30">
                    Status: {log.status}
                  </span>
                </div>

                {/* Notes */}
                {log.notes && (
                  <p className="text-[11px] text-gray-600 leading-relaxed font-medium bg-gray-50 p-2 rounded-lg border border-gray-100">
                    "{log.notes}"
                  </p>
                )}

                {/* Attachment if present */}
                {log.attachmentUrl && (
                  <div className="pt-0.5">
                    <a
                      href={log.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Lihat Lampiran Struk/Bukti</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
