'use client';

import React from 'react';
import { Building, MapPin, Phone, ShieldCheck, HelpCircle } from 'lucide-react';
import { Property } from '@/app/(dashboard)/properties/_types';
import { EmergencyContact } from '../_types';

interface PropertyDetailCardProps {
  property: Property;
  emergencyContacts: EmergencyContact[];
  houseRules: string[];
}

export default function PropertyDetailCard({ property, emergencyContacts, houseRules }: PropertyDetailCardProps) {
  return (
    <div className="rounded-2xl border border-[#C7D3C0]/40 bg-white p-6 shadow-sm space-y-6">
      
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <Building className="h-5 w-5 text-[#8FA28A]" />
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Detail Properti & Pengelola</h3>
      </div>

      {/* Property Basic Info */}
      <div className="space-y-3">
        <h4 className="text-base font-black text-gray-800">{property.name}</h4>
        <div className="flex items-start gap-1.5 text-xs text-gray-600">
          <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
          <span>{property.address}</span>
        </div>
      </div>

      {/* Tata Tertib / House Rules */}
      <div className="space-y-2.5 pt-2 border-t border-gray-50">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
          <ShieldCheck className="h-4 w-4 text-[#8FA28A]" /> Tata Tertib Hunian
        </span>
        <ul className="space-y-1.5 pl-3.5 list-disc text-xs text-gray-600 font-medium">
          {houseRules.map((rule, idx) => (
            <li key={idx} className="leading-relaxed">{rule}</li>
          ))}
        </ul>
      </div>

      {/* Emergency Contacts */}
      <div className="space-y-3 pt-2 border-t border-gray-50">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
          <Phone className="h-4 w-4 text-[#8FA28A]" /> Kontak Darurat & Pengelola
        </span>
        <div className="grid gap-2 sm:grid-cols-2">
          {emergencyContacts.map((contact, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs">
              <div>
                <span className="text-[9px] font-bold text-[#8FA28A] uppercase tracking-wide">{contact.role}</span>
                <p className="font-black text-gray-800">{contact.name}</p>
              </div>
              <a
                href={`tel:${contact.phone}`}
                className="rounded-lg p-1.5 bg-[#8FA28A]/10 text-[#8FA28A] hover:bg-[#8FA28A]/20 transition-colors"
                title={`Call ${contact.name}`}
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
