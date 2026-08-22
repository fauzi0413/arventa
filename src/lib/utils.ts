import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Standardized Date & Time Utility for Indonesia (WIB / Asia/Jakarta - GMT+7)
 */
export const TIMEZONE_WIB = 'Asia/Jakarta';

/**
 * Formats a Date object or ISO date string into Indonesian Date & Time (WIB)
 * Example output: "22 Agu 2026 • 19:29:11 WIB"
 */
export function formatIndonesianDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return '-';
  try {
    // If date-only string (e.g. "2026-08-22")
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }

    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);

    // Check if timestamp is UTC midnight (00:00:00.000Z) from database Date-only field
    const isUtcMidnight = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
    if (isUtcMidnight) {
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
    }

    const dateFormatted = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: TIMEZONE_WIB,
    });

    const timeFormatted = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: TIMEZONE_WIB,
    });

    return `${dateFormatted} • ${timeFormatted} WIB`;
  } catch {
    return String(dateStr);
  }
}

/**
 * Formats a Date object or ISO string into Indonesian Date only
 * Example output: "22 Agu 2026"
 */
export function formatIndonesianDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '-';
  try {
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }

    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);

    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: TIMEZONE_WIB,
    });
  } catch {
    return String(dateStr);
  }
}
