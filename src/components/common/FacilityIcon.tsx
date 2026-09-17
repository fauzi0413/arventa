import React from 'react';
import {
  Wind,
  BedDouble,
  Bath,
  DoorClosed,
  Wifi,
  Tv,
  Utensils,
  Flame,
  Armchair,
  KeyRound,
  Car,
  Waves,
  Dumbbell,
  Zap,
  Droplets,
  ShieldCheck,
  Sun,
  Video,
  Package,
  Layers,
  Sparkles,
  type LucideProps,
} from 'lucide-react';

interface FacilityIconProps extends LucideProps {
  name: string;
}

export function getFacilityIconComponent(name: string): React.ComponentType<LucideProps> {
  const n = (name || '').toLowerCase();
  if (n.includes('ac') || n.includes('air conditioner') || n.includes('kipas') || n.includes('ventilasi')) return Wind;
  if (n.includes('kasur') || n.includes('bed') || n.includes('springbed') || n.includes('ranjang')) return BedDouble;
  if (n.includes('mandi') || n.includes('shower') || n.includes('toilet') || n.includes('wc')) return Bath;
  if (n.includes('lemari') || n.includes('pakaian') || n.includes('wardrobe') || n.includes('closet')) return DoorClosed;
  if (n.includes('wifi') || n.includes('internet') || n.includes('router') || n.includes('jaringan')) return Wifi;
  if (n.includes('tv') || n.includes('television') || n.includes('televisi') || n.includes('layar')) return Tv;
  if (n.includes('dapur') || n.includes('kompor') || n.includes('kitchen') || n.includes('masak') || n.includes('dining')) return Utensils;
  if (n.includes('water heater') || n.includes('pemanas') || n.includes('heater') || n.includes('gas')) return Flame;
  if (n.includes('meja') || n.includes('kursi') || n.includes('sofa') || n.includes('tamu') || n.includes('belajar')) return Armchair;
  if (n.includes('pintu') || n.includes('smart lock') || n.includes('kunci') || n.includes('akses') || n.includes('keycard')) return KeyRound;
  if (n.includes('parkir') || n.includes('garasi') || n.includes('carport') || n.includes('mobil') || n.includes('motor')) return Car;
  if (n.includes('kolam') || n.includes('pool') || n.includes('renang')) return Waves;
  if (n.includes('gym') || n.includes('fitness') || n.includes('olahraga')) return Dumbbell;
  if (n.includes('listrik') || n.includes('token') || n.includes('daya') || n.includes('pln') || n.includes('kwh')) return Zap;
  if (n.includes('air') || n.includes('tandon') || n.includes('pompa') || n.includes('pdam') || n.includes('sumur')) return Droplets;
  if (n.includes('rolling') || n.includes('folding') || n.includes('gate') || n.includes('pagar') || n.includes('kanopi')) return ShieldCheck;
  if (n.includes('balkon') || n.includes('teras') || n.includes('rooftop')) return Sun;
  if (n.includes('cctv') || n.includes('kamera') || n.includes('security')) return Video;
  return Package;
}

export default function FacilityIcon({ name, className = 'h-4 w-4', ...props }: FacilityIconProps) {
  const Icon = getFacilityIconComponent(name);
  return <Icon className={className} {...props} />;
}
