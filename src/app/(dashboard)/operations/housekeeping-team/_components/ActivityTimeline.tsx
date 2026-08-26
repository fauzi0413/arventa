'use client';

import React from 'react';
import {
  Sparkles,
  ClipboardList,
  Receipt,
  UserCheck,
  Building,
  DoorOpen,
  Calendar,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ActivityItem } from '../_types';

interface ActivityTimelineProps {
  activities: ActivityItem[];
  loading: boolean;
}

export default function ActivityTimeline({ activities, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-[#8FA28A] border-t-transparent mx-auto" />
          <p className="text-xs text-gray-500 font-medium">Memuat log aktivitas tim...</p>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#C7D3C0] bg-white p-12 text-center shadow-2xs space-y-2">
        <ClipboardList className="h-8 w-8 text-gray-400 mx-auto" />
        <h4 className="text-sm font-bold text-gray-700">Belum Ada Aktivitas Tercatat</h4>
        <p className="text-xs text-gray-400 max-w-sm mx-auto">
          Log aktivitas kebersihan kamar, check-in/out, dan pencatatan pengeluaran staf akan muncul secara otomatis di sini.
        </p>
      </div>
    );
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'ROOM_STATUS':
        return {
          icon: ClipboardList,
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          title: 'Update Status Kamar',
        };
      case 'EXPENSE':
        return {
          icon: Receipt,
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          title: 'Pengeluaran Operasional',
        };
      case 'CHECKIN_CHECKOUT':
        return {
          icon: DoorOpen,
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          dot: 'bg-blue-500',
          title: 'Check-In / Out',
        };
      default:
        return {
          icon: Info,
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          dot: 'bg-gray-500',
          title: 'Aktivitas Umum',
        };
    }
  };

  return (
    <div className="relative space-y-4 before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gray-200 before:z-0">
      {activities.map((act) => {
        const badge = getActivityBadge(act.type);
        const IconComponent = badge.icon;
        const formattedTime = new Date(act.timestamp).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div key={act.id} className="relative z-10 flex items-start gap-4">
            {/* Timeline Dot Icon */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border-2 border-[#8FA28A] shadow-xs text-[#8FA28A] mt-1">
              <IconComponent className="h-3.5 w-3.5" />
            </div>

            {/* Card Content */}
            <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs hover:shadow-xs transition-all space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${badge.color}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                    {badge.title}
                  </span>

                  <span className="text-xs font-bold text-gray-800">
                    {act.propertyName}
                  </span>

                  {act.unitNumber && act.unitNumber !== '-' && (
                    <span className="text-[11px] font-bold text-[#8FA28A] bg-[#8FA28A]/10 px-2 py-0.5 rounded-md">
                      Unit: {act.unitNumber}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{formattedTime}</span>
                </div>
              </div>

              {/* Activity Description */}
              <p className="text-xs font-semibold text-gray-700 leading-relaxed">
                {act.activity}
              </p>

              {/* Status Change Flow Badge if exists */}
              {act.previousStatus && act.newStatus && (
                <div className="flex items-center gap-2 text-[11px] bg-gray-50 p-2 rounded-xl border border-gray-100 text-gray-600">
                  <span className="font-semibold text-gray-500">Status:</span>
                  <span className="font-bold text-gray-700 bg-white px-2 py-0.5 rounded border">
                    {act.previousStatus}
                  </span>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {act.newStatus}
                  </span>
                </div>
              )}

              {/* Performer & Notes */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Pelaksana:</span>
                  <span className="font-bold text-gray-800">{act.performerName}</span>
                  <span className="text-[10px] text-gray-400">({act.performerRole})</span>
                </div>

                {act.notes && act.notes !== '-' && (
                  <p className="text-[11px] text-gray-500 italic max-w-md truncate">
                    Catatan: &ldquo;{act.notes}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
