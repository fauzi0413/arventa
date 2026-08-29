'use client';

import React, { useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  HelpCircle,
} from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: React.ReactNode;
  targetName?: string;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  description = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'warning',
  icon,
  targetName,
  isLoading = false,
}: ConfirmModalProps) {
  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Icon and theme config based on variant
  const variantStyles = {
    danger: {
      badgeBg: 'bg-red-50 text-red-600 border-red-200/80 shadow-red-500/10',
      ringColor: 'ring-red-100',
      defaultIcon: <AlertTriangle className="h-7 w-7" />,
      confirmBtn:
        'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md shadow-red-500/20',
    },
    warning: {
      badgeBg: 'bg-amber-50 text-amber-600 border-amber-200/80 shadow-amber-500/10',
      ringColor: 'ring-amber-100',
      defaultIcon: <AlertCircle className="h-7 w-7" />,
      confirmBtn:
        'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md shadow-amber-500/20',
    },
    success: {
      badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80 shadow-emerald-500/10',
      ringColor: 'ring-emerald-100',
      defaultIcon: <CheckCircle2 className="h-7 w-7" />,
      confirmBtn:
        'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20',
    },
    info: {
      badgeBg: 'bg-[#8FA28A]/10 text-[#8FA28A] border-[#8FA28A]/30 shadow-[#8FA28A]/10',
      ringColor: 'ring-[#8FA28A]/20',
      defaultIcon: <HelpCircle className="h-7 w-7" />,
      confirmBtn:
        'bg-gradient-to-r from-[#8FA28A] to-[#7D9178] hover:from-[#7D9178] hover:to-[#6B7F66] text-white shadow-md shadow-[#8FA28A]/20',
    },
  };

  const style = variantStyles[variant] || variantStyles.warning;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 p-6 sm:p-7 text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all disabled:opacity-50"
          title="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Visual Icon Badge */}
        <div className="mx-auto mb-4 flex items-center justify-center">
          <div
            className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border shadow-sm ring-8 ${style.badgeBg} ${style.ringColor} transition-transform hover:scale-105`}
          >
            {icon || style.defaultIcon}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-2">
          {title}
        </h3>

        {/* Description */}
        <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          {description}
        </div>

        {/* Highlighted Target Card (if applicable) */}
        {targetName && (
          <div className="mt-3.5 mx-auto max-w-xs rounded-2xl border border-gray-200/80 bg-gray-50/80 px-4 py-2.5 text-xs font-semibold text-gray-800 shadow-2xs font-mono flex items-center justify-center gap-2">
            <span className="truncate">{targetName}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-gray-900 transition-all disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${style.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
