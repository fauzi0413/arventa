'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface FacilitySelectorProps {
  selectedFacilities: string[];
  onChange: (facilities: string[]) => void;
}

const PREDEFINED_FACILITIES = [
  { name: 'AC', icon: '❄️' },
  { name: 'Kasur Springbed', icon: '🛏️' },
  { name: 'Kamar Mandi Dalam', icon: '🚿' },
  { name: 'Lemari', icon: '🚪' },
  { name: 'WiFi', icon: '🌐' },
  { name: 'TV', icon: '📺' },
  { name: 'Dapur Mini', icon: '🍳' },
  { name: 'Water Heater', icon: '🔥' },
];

export default function FacilitySelector({
  selectedFacilities,
  onChange,
}: FacilitySelectorProps) {
  const toggleFacility = (facilityName: string) => {
    if (selectedFacilities.includes(facilityName)) {
      onChange(selectedFacilities.filter((f) => f !== facilityName));
    } else {
      onChange([...selectedFacilities, facilityName]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-600">Fasilitas Unit *</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PREDEFINED_FACILITIES.map((facility) => {
          const isSelected = selectedFacilities.includes(facility.name);
          return (
            <button
              key={facility.name}
              type="button"
              onClick={() => toggleFacility(facility.name)}
              className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                isSelected
                  ? 'border-[#8FA28A] bg-[#8FA28A]/10 text-gray-800 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>{facility.icon}</span>
                <span>{facility.name}</span>
              </span>
              {isSelected && <Check className="h-3.5 w-3.5 text-[#8FA28A]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
