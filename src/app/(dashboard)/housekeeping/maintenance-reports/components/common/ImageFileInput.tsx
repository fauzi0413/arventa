'use client';

import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageFileInputProps {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
}

export default function ImageFileInput({
  label,
  images,
  onChange,
  maxFiles = 4,
}: ImageFileInputProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [...images];

    Array.from(files).forEach((file) => {
      if (newImages.length >= maxFiles) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          newImages.push(reader.result as string);
          onChange([...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2 text-xs">
      <label className="font-bold text-gray-700 block flex items-center gap-1.5">
        <ImageIcon className="h-4 w-4 text-[#8FA28A]" />
        {label}
      </label>

      {/* Upload Drop Area */}
      <div className="flex items-center gap-3">
        <label className="min-h-[44px] px-4 py-2.5 flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/80 hover:bg-gray-100 text-gray-700 font-bold cursor-pointer transition-colors shadow-sm">
          <Upload className="h-4 w-4 text-[#8FA28A]" />
          <span>Pilih File Foto (JPG, PNG)</span>
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <span className="text-[10px] text-gray-400 font-semibold">
          {images.length} / {maxFiles} Foto Terpilih
        </span>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 pt-2">
          {images.map((img, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 h-20 bg-gray-100">
              <img src={img} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                title="Hapus Foto"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
