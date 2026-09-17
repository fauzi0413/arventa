export type SupportedPropertyType = 'KOS' | 'KONTRAKAN' | 'APARTEMEN' | 'RUKO';

export interface PropertyTypeConfig {
  type: SupportedPropertyType;
  typeName: string;
  badgeLabel: string;
  unitLabel: string;
  unitLabelPlural: string;
  addUnitTitle: string;
  editUnitTitle: string;
  unitNameLabel: string;
  unitNamePlaceholder: string;
  defaultBatchPrefix: string;
  capacityLabel: string;
  capacityPlaceholder: string;
  dimensionsLabel: string;
  dimensionsPlaceholder: string;
  facilitiesTitle: string;
  facilitiesDescription: string;
  defaultFacilities: string[];
  hintText?: string;
  samplePropertyName: string;
}

export const PROPERTY_TYPE_CONFIGS: Record<SupportedPropertyType, PropertyTypeConfig> = {
  KOS: {
    type: 'KOS',
    typeName: 'Kos-Kosan',
    badgeLabel: 'Kos',
    unitLabel: 'Kamar',
    unitLabelPlural: 'Kamar',
    addUnitTitle: 'Tambah Kamar Kos',
    editUnitTitle: 'Ubah Informasi Kamar',
    unitNameLabel: 'Nomor / Nama Kamar',
    unitNamePlaceholder: 'Contoh: Kamar 101, Kamar 2A',
    defaultBatchPrefix: 'Kamar ',
    capacityLabel: 'Kapasitas Maksimal (Orang)',
    capacityPlaceholder: 'Contoh: 1 atau 2',
    dimensionsLabel: 'Ukuran Kamar (Dimensi)',
    dimensionsPlaceholder: 'Contoh: 3x4 m',
    facilitiesTitle: 'Fasilitas & Inventaris Kamar',
    facilitiesDescription: 'Pilih perabot atau perlengkapan yang disediakan di dalam kamar ini.',
    defaultFacilities: [
      'AC',
      'Kasur Springbed',
      'Lemari Pakaian',
      'WiFi',
      'Kamar Mandi Dalam',
      'Meja Belajar',
      'Water Heater',
      'TV',
      'Kulkas Mini',
    ],
    hintText: undefined,
    samplePropertyName: 'Contoh: Kos Graha Asri Dago',
  },
  KONTRAKAN: {
    type: 'KONTRAKAN',
    typeName: 'Kontrakan',
    badgeLabel: 'Kontrakan',
    unitLabel: 'Pintu / Rumah',
    unitLabelPlural: 'Pintu / Unit',
    addUnitTitle: 'Tambah Unit Kontrakan',
    editUnitTitle: 'Ubah Informasi Kontrakan',
    unitNameLabel: 'Nomor Pintu / Nama Rumah',
    unitNamePlaceholder: 'Contoh: Pintu 1, Rumah Blok B-12',
    defaultBatchPrefix: 'Pintu ',
    capacityLabel: 'Kapasitas Penghuni / Keluarga (Orang)',
    capacityPlaceholder: 'Contoh: 4',
    dimensionsLabel: 'Luas Bangunan / Tanah (Dimensi)',
    dimensionsPlaceholder: 'Contoh: 6x10 m (60 m²)',
    facilitiesTitle: 'Fasilitas & Sarana Rumah Kontrakan',
    facilitiesDescription: 'Pilih fasilitas dan kelengkapan yang tersedia pada unit kontrakan ini.',
    defaultFacilities: [
      'Ruang Tamu',
      'Dapur Bersih',
      'Garasi / Carport',
      'Teras',
      'Listrik Token Mandiri',
      'Pompa Air / PDAM',
      'Tandon Air',
      'AC',
      'Pagar Keliling',
    ],
    hintText: 'Panduan: Jika properti ini adalah 1 rumah kontrakan utuh (bukan petakan), Anda cukup membuat 1 unit dengan nama "Rumah Utama" atau "Seluruh Rumah".',
    samplePropertyName: 'Contoh: Kontrakan Melati Indah / Rumah Cendana',
  },
  APARTEMEN: {
    type: 'APARTEMEN',
    typeName: 'Apartemen',
    badgeLabel: 'Apartemen',
    unitLabel: 'Unit Apartemen',
    unitLabelPlural: 'Unit Apartemen',
    addUnitTitle: 'Tambah Unit Apartemen',
    editUnitTitle: 'Ubah Informasi Unit Apartemen',
    unitNameLabel: 'Nomor Unit & Tower',
    unitNamePlaceholder: 'Contoh: Tower A - Unit 1205, Studio 03',
    defaultBatchPrefix: 'Unit ',
    capacityLabel: 'Kapasitas Penghuni (Orang)',
    capacityPlaceholder: 'Contoh: 2',
    dimensionsLabel: 'Tipe & Luas Unit (Dimensi)',
    dimensionsPlaceholder: 'Contoh: Studio / 2BR (36 m²)',
    facilitiesTitle: 'Fasilitas & Kelengkapan Unit Apartemen',
    facilitiesDescription: 'Pilih fasilitas internal unit dan akses fasilitas gedung yang tersedia.',
    defaultFacilities: [
      'Smart Lock / Kartu Akses',
      'Balkon',
      'AC',
      'Kitchen Set',
      'Water Heater',
      'Kulkas',
      'Intercom',
      'Akses Kolam Renang',
      'Akses Gym & Fitness',
      'Akses Parkir Mobil',
    ],
    hintText: 'Panduan: Anda dapat mengatur tarif Transit / Harian serta biaya utilitas / deposit untuk unit apartemen ini.',
    samplePropertyName: 'Contoh: Apartemen Gateway Tower A',
  },
  RUKO: {
    type: 'RUKO',
    typeName: 'Ruko / Komersial',
    badgeLabel: 'Ruko',
    unitLabel: 'Blok / Lantai',
    unitLabelPlural: 'Blok / Lantai Ruko',
    addUnitTitle: 'Tambah Unit / Lantai Ruko',
    editUnitTitle: 'Ubah Informasi Ruko',
    unitNameLabel: 'Nama Blok / Lantai Ruko',
    unitNamePlaceholder: 'Contoh: Ruko Blok A-1, Lantai 1',
    defaultBatchPrefix: 'Blok ',
    capacityLabel: 'Kapasitas Staf / Operasional (Orang)',
    capacityPlaceholder: 'Contoh: 10',
    dimensionsLabel: 'Luas Bangunan & Jumlah Lantai',
    dimensionsPlaceholder: 'Contoh: 5x15 m (2 Lantai)',
    facilitiesTitle: 'Fasilitas & Spesifikasi Ruko',
    facilitiesDescription: 'Pilih spesifikasi komersial dan fasilitas penunjang usaha pada ruko ini.',
    defaultFacilities: [
      'Rolling Door / Folding Gate',
      'Area Parkir Luas',
      'Daya Listrik 3-Phase / 4400W+',
      'Toilet Karyawan',
      'Kanopi Depan',
      'CCTV Area',
      'Ruang Display / Kasir',
      'Area Bongkar Muat',
    ],
    hintText: 'Panduan: Jika ruko bertingkat disewakan terpisah per tingkat, Anda dapat membuat unit per lantai (misal: Lantai 1, Lantai 2).',
    samplePropertyName: 'Contoh: Ruko Sudirman Center Blok A',
  },
};

/**
 * Resolves a standardized property type from various potential representations:
 * - Direct enum: 'KOS', 'KONTRAKAN', 'APARTEMEN', 'RUKO'
 * - Category ID: 'cat-1' (Kos), 'cat-2' (Apartemen), 'cat-3' (Kontrakan), 'cat-4' (Ruko)
 * - Object property: { type: 'KONTRAKAN' } or { categoryId: 'cat-3' } or { name: '...' }
 */
export function resolvePropertyType(
  property?: { type?: string; categoryId?: string; categoryName?: string; name?: string } | null,
  categoryId?: string,
  rawType?: string
): SupportedPropertyType {
  const candidate = (
    rawType ||
    property?.type ||
    categoryId ||
    property?.categoryId ||
    property?.categoryName ||
    ''
  ).toUpperCase();

  if (candidate === 'KONTRAKAN' || candidate === 'CAT-3' || candidate.includes('KONTRAKAN')) {
    return 'KONTRAKAN';
  }
  if (candidate === 'APARTEMEN' || candidate === 'CAT-2' || candidate.includes('APARTEMEN') || candidate.includes('APARTMENT')) {
    return 'APARTEMEN';
  }
  if (candidate === 'RUKO' || candidate === 'CAT-4' || candidate.includes('RUKO')) {
    return 'RUKO';
  }
  return 'KOS';
}

/**
 * Returns the full UI & wording configuration for the given property type.
 */
export function getPropertyTypeConfig(
  propertyOrType?: any,
  categoryId?: string
): PropertyTypeConfig {
  const resolvedType = resolvePropertyType(
    typeof propertyOrType === 'object' ? propertyOrType : null,
    categoryId,
    typeof propertyOrType === 'string' ? propertyOrType : undefined
  );

  return PROPERTY_TYPE_CONFIGS[resolvedType] || PROPERTY_TYPE_CONFIGS.KOS;
}
