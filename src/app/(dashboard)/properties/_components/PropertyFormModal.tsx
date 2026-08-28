'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, Image as ImageIcon, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Property, PropertyCategory, PropertyStatus } from '../_types';

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (propertyData: Omit<Property, 'id' | 'createdAt'>) => Promise<void> | void;
  categories: PropertyCategory[];
  statuses: PropertyStatus[];
  initialData?: Property | null;
}

export default function PropertyFormModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  statuses,
  initialData,
}: PropertyFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [totalUnits, setTotalUnits] = useState<number>(0);
  const [occupiedUnits, setOccupiedUnits] = useState<number>(0);
  const [description, setDescription] = useState('');

  // Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Submit / UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset or initialize state when opening / switching initialData
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setAddress(initialData.address || '');
        setCategoryId(initialData.categoryId || categories[0]?.id || '');
        setStatusId(initialData.statusId || statuses[0]?.id || '');
        setTotalUnits(initialData.totalUnits || 0);
        setOccupiedUnits(initialData.occupiedUnits || 0);
        setDescription(initialData.description || '');
        setPreviewUrl(initialData.imageUrl || '');
        setSelectedFile(null);
      } else {
        setName('');
        setAddress('');
        setCategoryId(categories[0]?.id || '');
        setStatusId(statuses[0]?.id || '');
        setTotalUnits(0);
        setOccupiedUnits(0);
        setDescription('');
        setPreviewUrl('');
        setSelectedFile(null);
      }
      setErrorMessage(null);
      setUploadStatus('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, categories, statuses]);

  if (!isOpen) return null;

  // Handle local file selection
  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('File harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 10 MB.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    // Create instant local blob preview URL
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !categoryId || !statusId) {
      setErrorMessage('Mohon lengkapi semua field yang wajib diisi (*).');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      let finalImageUrl = previewUrl;

      // If user selected a new local file, upload it to storage
      if (selectedFile) {
        setUploadStatus('Mengunggah gambar properti...');
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', selectedFile);
          uploadFormData.append('bucket', 'property-images');

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json();
            if (uploadJson.data?.url) {
              finalImageUrl = uploadJson.data.url;
            }
          }
        } catch (uploadErr) {
          console.warn('Upload API notice: falling back to base64 preview', uploadErr);
        }
      }

      setUploadStatus('Menyimpan data properti ke database...');

      await onSubmit({
        name: name.trim(),
        address: address.trim(),
        categoryId,
        statusId,
        totalUnits: Number(totalUnits),
        occupiedUnits: Math.min(Number(occupiedUnits), Number(totalUnits)),
        description: description.trim(),
        imageUrl: finalImageUrl.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      console.error('Submit error in PropertyFormModal:', err);
      setErrorMessage(err?.message || 'Gagal menyimpan properti ke database.');
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#F7F4ED] border border-[#C7D3C0] p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C7D3C0]/60 pb-3 mb-4">
          <div>
            <h3 className="text-lg font-black text-gray-800">
              {initialData ? 'Ubah Informasi Properti' : 'Tambah Properti Baru'}
            </h3>
            <p className="text-xs text-gray-500">
              {initialData ? 'Perbarui data properti yang tersambung di database' : 'Daftarkan unit properti baru milik owner ke database'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-1 text-gray-500 hover:bg-[#C7D3C0]/40 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama Properti */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Nama Properti <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kost Griya Melati"
              className="w-full rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2.5 text-xs focus:border-[#8FA28A] focus:outline-none shadow-2xs"
            />
          </div>

          {/* Alamat Lengkap */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Alamat Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contoh: Jl. Diponegoro No. 45, Bandung"
              className="w-full rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2.5 text-xs focus:border-[#8FA28A] focus:outline-none shadow-2xs"
            />
          </div>

          {/* Kategori & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white text-gray-800 px-3 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none shadow-2xs"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white text-gray-800 px-3 py-2 text-xs font-semibold focus:border-[#8FA28A] focus:outline-none shadow-2xs"
              >
                {statuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Total Units & Occupied Units */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Total Unit/Kamar <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={totalUnits}
                onChange={(e) => setTotalUnits(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2.5 text-xs focus:border-[#8FA28A] focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Unit Terisi <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max={totalUnits}
                required
                value={occupiedUnits}
                onChange={(e) => setOccupiedUnits(Math.min(totalUnits, Math.max(0, Number(e.target.value))))}
                className="w-full rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2.5 text-xs focus:border-[#8FA28A] focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Upload Foto / Gambar Properti (File Upload instead of URL input) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Foto Properti (Upload File)
            </label>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {previewUrl ? (
              /* Image Preview Box */
              <div className="relative rounded-2xl border-2 border-dashed border-[#8FA28A] bg-white p-3 shadow-2xs space-y-2">
                <div className="relative h-40 w-full overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Preview Properti"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs rounded-xl p-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg bg-white/90 hover:bg-white text-gray-800 px-2 py-1 text-[11px] font-bold transition-all shadow-xs"
                      title="Ganti Foto"
                    >
                      Ganti Foto
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="rounded-lg bg-red-600 hover:bg-red-700 text-white p-1 text-xs transition-all shadow-xs"
                      title="Hapus Foto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {selectedFile && (
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium px-1">
                    <span className="truncate max-w-[250px]">{selectedFile.name}</span>
                    <span>{(selectedFile.size / 1024).toFixed(0)} KB</span>
                  </div>
                )}
              </div>
            ) : (
              /* Drag & Drop Upload Zone */
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all bg-white hover:bg-gray-50/80 ${
                  isDragOver
                    ? 'border-[#8FA28A] bg-[#8FA28A]/10 scale-[1.01]'
                    : 'border-gray-300 hover:border-[#8FA28A]'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="h-12 w-12 rounded-2xl bg-[#8FA28A]/15 text-[#8FA28A] flex items-center justify-center shadow-xs">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      Klik untuk memilih file foto atau seret ke sini
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Mendukung format JPG, PNG, WEBP (Maksimal 10 MB)
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-1 rounded-xl bg-[#8FA28A]/10 px-3 py-1.5 text-xs font-bold text-[#8FA28A] hover:bg-[#8FA28A]/20 transition-colors"
                  >
                    Pilih File Foto
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Deskripsi Properti */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Deskripsi Properti
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Berikan keterangan detail mengenai properti, fasilitas umum, tata tertib, dll..."
              className="w-full rounded-xl border border-gray-300 bg-white text-gray-800 px-3.5 py-2.5 text-xs focus:border-[#8FA28A] focus:outline-none resize-none shadow-2xs"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#C7D3C0]/40">
            {uploadStatus ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8FA28A]">
                <Loader2 className="h-4 w-4 animate-spin text-[#8FA28A]" />
                <span>{uploadStatus}</span>
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-2xs"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-[#8FA28A] hover:bg-[#7D9178] text-white px-5 py-2 text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>{initialData ? 'Simpan Perubahan' : 'Tambah Properti'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
