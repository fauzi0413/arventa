'use client';

import React, { useState } from 'react';
import { Star, MessageSquare, Clock, User, CheckCircle2 } from 'lucide-react';
import { RatingData } from '../../types';

interface RatingSectionProps {
  rating: RatingData | null;
  status: string;
  onSubmitRating?: (score: number, feedback: string) => void;
  isTenantView?: boolean;
}

export default function RatingSection({
  rating,
  status,
  onSubmitRating,
  isTenantView = false,
}: RatingSectionProps) {
  const [selectedScore, setSelectedScore] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canBeRated = ['COMPLETED', 'RESOLVED', 'CLOSED', 'Selesai', 'Resolved'].includes(status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmitRating) return;
    setIsSubmitting(true);
    onSubmitRating(selectedScore, feedbackText);
    setIsSubmitting(false);
  };

  // Case 1: Already Rated (State Locked / Read-Only Card)
  if (rating) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= rating.score
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-black text-amber-900">
              {rating.score} / 5.0
            </span>
          </div>

          <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-amber-600" />
            Rating Terkonfirmasi
          </span>
        </div>

        {rating.feedback && (
          <p className="text-xs text-gray-700 italic font-medium bg-white/70 p-2.5 rounded-xl border border-amber-100">
            "{rating.feedback}"
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between text-[10px] text-amber-800 font-semibold pt-1">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3 text-amber-600" />
            Oleh: {rating.ratedBy?.name || 'Penyewa'}
          </span>
          <span className="flex items-center gap-1 font-mono text-amber-700">
            <Clock className="h-3 w-3" />
            {rating.ratedAt}
          </span>
        </div>
      </div>
    );
  }

  // Case 2: Not Rated Yet but Eligible (Interactive Form for Tenant)
  if (!rating && canBeRated && isTenantView && onSubmitRating) {
    return (
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-amber-200 bg-white p-4 space-y-3.5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
            Beri Rating & Ulasan Kepuasan
          </h4>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            Pekerjaan Selesai
          </span>
        </div>

        {/* Star Selector */}
        <div className="flex items-center justify-center gap-2 py-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setSelectedScore(star)}
              className="p-1 transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                className={`h-7 w-7 ${
                  star <= selectedScore
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Comment Input */}
        <div>
          <label className="text-[11px] font-bold text-gray-600 block mb-1">
            Ulasan / Catatan Kepuasan (Opsional):
          </label>
          <textarea
            rows={2}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Bagaimana hasil pekerjaan tim kami? Kebersihan/perbaikan memuaskan..."
            className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[38px] flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all shadow-sm"
        >
          <Star className="h-4 w-4 fill-white" />
          Kirim Rating & Ulasan
        </button>
      </form>
    );
  }

  // Case 3: Staff View & Not Rated Yet
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 text-center text-xs text-gray-400 italic">
      Belum ada rating atau ulasan dari penyewa.
    </div>
  );
}
