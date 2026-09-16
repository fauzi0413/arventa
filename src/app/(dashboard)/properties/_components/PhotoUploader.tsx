'use client';

import React, { useRef, useState } from 'react';
import { Camera, Trash2, CheckCircle2 } from 'lucide-react';

interface PhotoUploaderProps {
  value?: string;
  onChange: (base64Str: string) => void;
}

export default function PhotoUploader({ value, onChange }: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(value || '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (limit to 1.5MB for localStorage friendliness)
    if (file.size > 1.5 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar. Silakan pilih foto di bawah 1.5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      onChange(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-muted-foreground">Foto Kondisi / Barang</label>
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative group h-20 w-20 rounded-xl overflow-hidden border border-border shadow-sm">
            <img src={preview} alt="Pratinjau" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-20 w-20 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Camera className="h-5 w-5 text-[#8FA28A]" />
            <span className="text-[10px] font-semibold mt-1">Pilih Foto</span>
          </button>
        )}

        <div className="text-xs text-muted-foreground space-y-0.5">
          <p className="font-semibold text-foreground flex items-center gap-1">
            {preview ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#8FA28A]" />
                Foto terpilih
              </>
            ) : (
              'Belum ada foto terpilih'
            )}
          </p>
          <p>Maksimal ukuran file: 1.5 MB</p>
          <p>Format: JPG, PNG, WEBP</p>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
