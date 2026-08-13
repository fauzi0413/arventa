'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, BedDouble, Edit3, Trash2, ArrowRight } from 'lucide-react';
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
  const [totalUnits, setTotalUnits] = useState(0);
  const [occupiedUnits, setOccupiedUnits] = useState(0);

  useEffect(() => {
    const storedUnits = localStorage.getItem('arventa_units');
    if (storedUnits) {
      const allUnits = JSON.parse(storedUnits);
      const propUnits = allUnits.filter((u: any) => u.propertyId === property.id);
      setTotalUnits(propUnits.length);
      setOccupiedUnits(propUnits.filter((u: any) => u.status === 'Occupied').length);
    }
  }, [property.id]);

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
    <div className="group overflow-hidden rounded-2xl border border-[#C7D3C0]/40 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#8FA28A]/50 flex flex-col h-full">
      {/* Property Image & Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

        {/* Floating Category & Status Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {category && (
            <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-800 shadow-sm">
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
          <h4 className="text-base font-bold text-gray-800 line-clamp-1 group-hover:text-[#8FA28A] transition-colors">
            {property.name}
          </h4>

          <div className="mt-1.5 flex items-start gap-1 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 mt-0.5 text-gray-400 shrink-0" />
            <span className="line-clamp-1">{property.address}</span>
          </div>

          <p className="mt-3 text-xs text-gray-500 line-clamp-2 h-8 leading-relaxed">
            {property.description || 'Tidak ada deskripsi untuk properti ini.'}
          </p>

          {/* Occupancy Stats Section */}
          <div className="mt-4 pt-4 border-t border-[#C7D3C0]/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-600 flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5 text-[#8FA28A]" />
                Keterisian Kamar
              </span>
              <span className="font-bold text-gray-700">
                {occupiedUnits}/{totalUnits} Kamar ({occupancyRate}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#8FA28A] transition-all duration-500"
                style={{ width: `${Math.min(100, occupancyRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(property)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Edit Properti"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(property.id)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Hapus Properti"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <Link
            href={`/properties/${property.id}`}
            className="flex items-center gap-1 rounded-xl bg-[#8FA28A]/10 text-[#8FA28A] hover:bg-[#8FA28A] hover:text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm hover:shadow"
          >
            Detail
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
