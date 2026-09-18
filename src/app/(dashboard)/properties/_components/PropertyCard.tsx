'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, DoorClosed, Edit3, Trash2, ArrowRight } from 'lucide-react';
import { Property, PropertyCategory, PropertyStatus } from '../_types';

interface PropertyCardProps {
  property: Property;
  category?: PropertyCategory;
  status?: PropertyStatus;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}

export default function PropertyCard({
  property,
  category,
  status,
  onEdit,
  onDelete,
}: PropertyCardProps) {
  const totalUnits = property.totalUnits ?? 0;
  const occupiedUnits = property.occupiedUnits ?? 0;

  const occupancyRate = totalUnits > 0 
    ? Math.round((occupiedUnits / totalUnits) * 100) 
    : 0;

  // Premium image handling with reliable Unsplash fallback based on category
  const getFallbackImage = (catName?: string) => {
    switch (catName?.toLowerCase()) {
      case 'kos':
        return 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=600';
      case 'apartemen':
        return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600';
      case 'kontrakan':
        return 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=600';
      case 'ruko':
        return 'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?auto=format&fit=crop&q=80&w=600';
      default:
        return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600';
    }
  };

  const displayImage = property.imageUrl || getFallbackImage(category?.name);

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#8FA28A]/50 flex flex-col h-full">
      {/* Property Image & Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        <img
          src={displayImage}
          alt={property.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            // If custom image fails, use standard fallback
            e.currentTarget.src = getFallbackImage(category?.name);
          }}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />

        {/* Floating Category & Status Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {category && (
            <span className="rounded-full bg-background/95 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm border border-border/50">
              {category.name}
            </span>
          )}
          {status && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm border border-white/20"
              style={{ backgroundColor: status.color }}
            >
              {status.name}
            </span>
          )}
        </div>
      </div>

      {/* Details Area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-base font-bold text-foreground line-clamp-1 group-hover:text-[#8FA28A] transition-colors">
            {property.name}
          </h4>

          <div className="mt-1.5 flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
            <span className="line-clamp-1">
              {property.address}
              {property.city ? ` • ${property.city}` : ''}
            </span>
          </div>

          <p className="mt-3 text-xs text-muted-foreground leading-relaxed min-h-[2.5rem]">
            {(() => {
              const text = property.description?.trim();
              if (!text) return 'Tidak ada deskripsi untuk properti ini.';
              const maxLen = 85;
              if (text.length <= maxLen) return text;
              return text.replace(new RegExp(`^(.{1,${maxLen}})(?:\\s.*|$)`, 's'), '$1') + '...';
            })()}
          </p>

          {/* Occupancy Stats Section */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-1">
                <DoorClosed className="h-3.5 w-3.5 text-[#8FA28A]" />
                Keterisian Unit
              </span>
              <span className="font-bold text-foreground">
                {occupiedUnits}/{totalUnits} Unit ({occupancyRate}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-[#8FA28A] transition-all duration-500"
                style={{ width: `${Math.min(100, occupancyRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(property)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Edit Properti"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(property.id)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Hapus Properti"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <Link
            href={`/properties/${property.id}`}
            className="flex items-center gap-1 rounded-xl bg-[#8FA28A]/10 text-[#8FA28A] hover:bg-[#8FA28A] hover:text-white dark:bg-[#8FA28A]/20 dark:text-[#A3B89E] dark:hover:bg-[#8FA28A] dark:hover:text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs hover:shadow-sm"
          >
            Detail
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
