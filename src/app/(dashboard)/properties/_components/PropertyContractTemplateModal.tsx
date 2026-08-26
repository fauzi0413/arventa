'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  Loader2,
  Building2,
  Sparkles,
  Info,
  BookOpen,
  Eye,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Layers,
} from 'lucide-react';

export interface TemplateArticle {
  id: string;
  title: string;
  items: string[];
}

interface PropertyContractTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
  propertyAddress?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  initialData?: {
    templateName?: string;
    customClauses?: string[];
    rules?: string;
    notes?: string;
  } | null;
  onSaved?: () => void;
}

export default function PropertyContractTemplateModal({
  isOpen,
  onClose,
  propertyId,
  propertyName,
  propertyAddress,
  ownerName,
  ownerPhone,
  ownerEmail,
  initialData,
  onSaved,
}: PropertyContractTemplateModalProps) {
  const [activeTab, setActiveTab] = useState<'FORM' | 'PREVIEW'>('FORM');
  const [templateName, setTemplateName] = useState('Template Standar Properti');
  const [articles, setArticles] = useState<TemplateArticle[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form inputs for adding articles & items
  const [newArticleTitleInput, setNewArticleTitleInput] = useState('');
  const [itemInputs, setItemInputs] = useState<Record<string, string>>({});
  const modalBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  useEffect(() => {
    if (initialData) {
      setTemplateName(initialData.templateName || `Template Kontrak ${propertyName}`);

      // Parse rules if stored as JSON array of articles
      if (typeof initialData.rules === 'string' && initialData.rules.trim() !== '') {
        try {
          const parsed = JSON.parse(initialData.rules);
          if (Array.isArray(parsed)) {
            setArticles(parsed);
            return;
          }
        } catch {
          // If rules is not JSON
        }
      }

      // If rules is null/undefined and customClauses exists, fallback for old records
      if (initialData.rules === null && Array.isArray(initialData.customClauses) && initialData.customClauses.length > 0) {
        setArticles([
          {
            id: 'art-1',
            title: 'PASAL 3: KETENTUAN KHUSUS & TATA TERTIB',
            items: initialData.customClauses,
          },
        ]);
      } else {
        setArticles([]);
      }
    } else {
      setTemplateName(`Template Kontrak ${propertyName}`);
      setArticles([]);
    }
  }, [initialData, propertyName, isOpen]);

  if (!isOpen) return null;

  // Article handlers
  const handleAddArticle = () => {
    const title = newArticleTitleInput.trim();
    if (!title) return;

    const nextPasalNum = articles.length + 3;
    const formattedTitle = title.toUpperCase().startsWith('PASAL') ? title : `PASAL ${nextPasalNum}: ${title.toUpperCase()}`;

    const newArt: TemplateArticle = {
      id: `art-${Date.now()}`,
      title: formattedTitle,
      items: ['Ketentuan poin pasal baru...'],
    };

    setArticles((prev) => [...prev, newArt]);
    setNewArticleTitleInput('');
  };

  const handleRemoveArticle = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateArticleTitle = (id: string, newTitle: string) => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, title: newTitle } : a)));
  };

  const handleAddItemToArticle = (articleId: string) => {
    const text = (itemInputs[articleId] || '').trim();
    if (!text) return;

    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, items: [...a.items, text] } : a))
    );

    setItemInputs((prev) => ({ ...prev, [articleId]: '' }));
  };

  const handleRemoveItemFromArticle = (articleId: string, itemIdx: number) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleId
          ? { ...a, items: a.items.filter((_, idx) => idx !== itemIdx) }
          : a
      )
    );
  };

  const handleUpdateItemText = (articleId: string, itemIdx: number, text: string) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleId
          ? {
            ...a,
            items: a.items.map((item, idx) => (idx === itemIdx ? text : item)),
          }
          : a
      )
    );
  };

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      setIsSubmitting(true);
      setSuccessMessage('');

      let finalArticles = [...articles];

      // Auto-commit pending new article title input if user typed but didn't click "+ Tambah Pasal"
      if (newArticleTitleInput.trim()) {
        const title = newArticleTitleInput.trim();
        const nextPasalNum = finalArticles.length + 3;
        const formattedTitle = title.toUpperCase().startsWith('PASAL')
          ? title
          : `PASAL ${nextPasalNum}: ${title.toUpperCase()}`;

        finalArticles.push({
          id: `art-${Date.now()}`,
          title: formattedTitle,
          items: ['Ketentuan poin pasal baru...'],
        });
        setArticles(finalArticles);
        setNewArticleTitleInput('');
      }

      // Auto-commit pending item text for any article if typed but didn't click "+ Tambah Poin"
      finalArticles = finalArticles.map((art) => {
        const pendingItem = (itemInputs[art.id] || '').trim();
        if (pendingItem) {
          return { ...art, items: [...art.items, pendingItem] };
        }
        return art;
      });

      // Flatten all item points into customClauses for backward compatibility
      const allClauses = finalArticles.flatMap((a) => a.items.map((i) => i.trim())).filter(Boolean);
      const rulesSerialized = JSON.stringify(finalArticles);

      const res = await fetch(`/api/properties/${propertyId}/contract-template`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateName,
          customClauses: allClauses,
          rules: rulesSerialized,
        }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.success !== false) {
        setSuccessMessage('Template pasal-pasal kontrak properti berhasil disimpan!');
        setTimeout(() => {
          if (onSaved) onSaved();
          onClose();
        }, 1000);
      } else {
        const errorDetail = json?.message || json?.error || 'Gagal menyimpan template kontrak ke database.';
        alert(`Gagal menyimpan: ${typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail)}`);
      }
    } catch (err: any) {
      console.error('Failed to save property contract template:', err);
      alert(`Terjadi kesalahan saat menyimpan: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background border border-border w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Template Kontrak Per Properti</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5" /> {propertyName}
              </p>
            </div>
          </div>

          {/* Navigation Tab Switcher */}
          <div className="flex items-center bg-muted/60 rounded-xl p-1 border border-border text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('FORM')}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${activeTab === 'FORM'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Layers className="w-3.5 h-3.5 text-primary" />
              1. Pengaturan Pasal ({articles.length} Pasal)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PREVIEW')}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${activeTab === 'PREVIEW'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Eye className="w-3.5 h-3.5" />
              2. Live Pratinjau Dokumen
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div ref={modalBodyRef} className="p-6 overflow-y-auto space-y-6 flex-1 bg-card/40">
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'FORM' ? (
            /* TAB 1: FORM PENGATURAN PASAL-PASAL */
            <form id="template-form" onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* Nama Template */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <label className="block font-bold text-foreground uppercase tracking-wider text-[11px]">
                  Nama Template Kontrak Properti
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Contoh: Template Kontrak Standard Kos Graha Asri"
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-semibold text-xs"
                  required
                />
              </div>

              {/* Informative Banner */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Konfigurasi Pasal-Pasal Khusus per Properti</span>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Setiap pasal yang Anda tambahkan di bawah ini akan otomatis menjadi pasal turunan resmi pada Surat Perjanjian Sewa Digital penyewa di properti ini.
                  </p>
                </div>
              </div>

              {/* Articles Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-primary" /> Daftar Pasal Khusus Properti
                  </span>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    Total {articles.length} Pasal Terkonfigurasi
                  </span>
                </div>

                {articles.map((art, artIdx) => (
                  <div key={art.id} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                    {/* Article Header & Title */}
                    <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                      <div className="flex-1 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                          {artIdx + 3}
                        </span>
                        <input
                          type="text"
                          value={art.title}
                          onChange={(e) => handleUpdateArticleTitle(art.id, e.target.value)}
                          placeholder="Contoh: PASAL 3: KETENTUAN KHUSUS & TATA TERTIB"
                          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background font-black text-foreground focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveArticle(art.id)}
                        className="px-2.5 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 font-bold transition-colors flex items-center gap-1 text-[11px] shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus Pasal
                      </button>
                    </div>

                    {/* Article Points List */}
                    <div className="space-y-2 pl-2">
                      {art.items.map((itemText, itemIdx) => (
                        <div key={itemIdx} className="flex items-start gap-2">
                          <span className="font-bold text-muted-foreground mt-2 w-5 text-right shrink-0">
                            {itemIdx + 1}.
                          </span>
                          <textarea
                            rows={2}
                            value={itemText}
                            onChange={(e) => handleUpdateItemText(art.id, itemIdx, e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-medium leading-relaxed"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromArticle(art.id, itemIdx)}
                            className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 mt-1"
                            title="Hapus Poin Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Point to this Article */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                      <input
                        type="text"
                        value={itemInputs[art.id] || ''}
                        onChange={(e) =>
                          setItemInputs((prev) => ({ ...prev, [art.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddItemToArticle(art.id);
                          }
                        }}
                        placeholder={`Tambah poin baru untuk ${art.title.slice(0, 20)}...`}
                        className="flex-1 px-3 py-2 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddItemToArticle(art.id)}
                        className="px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold transition-colors flex items-center gap-1 text-xs shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Poin
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add New Article Button */}
                <div className="p-4 rounded-xl border-2 border-dashed border-border bg-card/60 flex items-center gap-3">
                  <input
                    type="text"
                    value={newArticleTitleInput}
                    onChange={(e) => setNewArticleTitleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddArticle();
                      }
                    }}
                    placeholder="Judul Pasal Baru (Contoh: SANKSI DAN DENDA KETERLAMBATAN)"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-bold text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddArticle}
                    className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Tambah Pasal Baru
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* TAB 2: LIVE PRATINJAU DOKUMEN KONTRAK */
            <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl border border-border">
              <div className="bg-white text-slate-900 p-8 rounded-xl shadow-md max-w-3xl mx-auto space-y-6 font-serif leading-relaxed text-xs">
                {/* Official Letterhead Header */}
                <div className="border-b border-slate-200 pb-4 flex items-center justify-between font-sans">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-lg shadow-sm">
                      A
                    </div>
                    <div>
                      <h1 className="font-extrabold text-sm tracking-wide text-slate-900">ARVENTA</h1>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        PROPERTY MANAGEMENT SYSTEMS
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">SURAT PERJANJIAN DIGITAL</div>
                    <div className="text-xs font-mono font-bold text-slate-900">KTR/ARV/[PROPERTI]</div>
                    <div className="text-[11px] text-slate-500">
                      Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center py-2 space-y-1 font-sans">
                  <h2 className="text-lg font-extrabold uppercase underline tracking-wide text-slate-900">
                    SURAT PERJANJIAN SEWA MENYEMA
                  </h2>
                  <p className="text-xs font-medium text-slate-600">
                    Perjanjian Sewa Unit Kamar / Properti
                  </p>
                </div>

                {/* Mukadimah */}
                <p className="text-xs text-justify">
                  Pada hari ini, disepakati perjanjian sewa-menyewa antara pihak-pihak di bawah ini yang bertindak sah secara hukum:
                </p>

                {/* Party I & Party II Details */}
                <div className="space-y-3 font-sans text-xs">
                  {/* PIHAK PERTAMA */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-700" />
                      PIHAK PERTAMA (Pemilik Properti / Pengelola):
                    </div>
                    <div className="grid grid-cols-3 gap-y-1 pl-5">
                      <span className="text-slate-500">Nama Pemilik (Owner)</span>
                      <span className="col-span-2 font-semibold text-slate-900">: {ownerName}</span>
                      <span className="text-slate-500">No. Telepon / WA</span>
                      <span className="col-span-2 font-semibold text-slate-900">: {ownerPhone && !ownerPhone.startsWith('[') ? ownerPhone : '081222222222'}</span>
                      <span className="text-slate-500">Email Pemilik</span>
                      <span className="col-span-2 font-semibold text-slate-900">: {ownerEmail && !ownerEmail.startsWith('[') ? ownerEmail : 'owner@arventa.id'}</span>
                      <span className="text-slate-500">Nama Properti</span>
                      <span className="col-span-2 font-semibold text-slate-900">: {propertyName}</span>
                      <span className="text-slate-500">Alamat Properti</span>
                      <span className="col-span-2 font-semibold text-slate-900">: {propertyAddress}</span>
                    </div>
                  </div>

                  {/* PIHAK KEDUA */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-700" />
                      PIHAK KEDUA (Penyewa Utama / Tenant):
                    </div>
                    <div className="grid grid-cols-3 gap-y-1 pl-5">
                      <span className="text-slate-500">Nama Lengkap</span>
                      <span className="col-span-2 font-semibold text-slate-900 italic">: [Data Penyewa Utama]</span>
                      <span className="text-slate-500">No. Telepon / WA</span>
                      <span className="col-span-2 font-semibold text-slate-900 italic">: [No. WA Penyewa]</span>
                      <span className="text-slate-500">Email</span>
                      <span className="col-span-2 font-semibold text-slate-900 italic">: [Email Penyewa]</span>
                      <span className="text-slate-500">NIK / No. KTP</span>
                      <span className="col-span-2 font-semibold text-slate-900 italic">: [NIK Penyewa]</span>
                    </div>
                  </div>
                </div>

                {/* PASAL 1 Standard */}
                <div className="space-y-2 pt-2 text-xs font-sans">
                  <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                    PASAL 1: OBJEK SEWA & JANGKA WAKTU
                  </h3>
                  <ol className="list-decimal pl-5 space-y-1.5 text-justify">
                    <li>
                      <strong>Objek Sewa:</strong> PIHAK PERTAMA menyewakan objek kepada PIHAK KEDUA berupa{' '}
                      <strong className="text-slate-900">Unit / Kamar</strong> pada{' '}
                      <strong className="text-slate-900">{propertyName}</strong>.
                    </li>
                    <li>
                      <strong>Masa Sewa:</strong> Berlaku mulai dari tanggal{' '}
                      <span className="font-semibold text-slate-900 italic">[Tanggal Mulai]</span> sampai dengan tanggal{' '}
                      <span className="font-semibold text-slate-900 italic">[Tanggal Selesai]</span> (Skema Pembayaran:{' '}
                      <span className="font-semibold text-slate-900 italic">[Periode Sewa]</span>) dan akan bertambah apabila <span className="font-bold">PIHAK KEDUA</span> (Penyewa) memperpanjang masa sewa.
                    </li>
                    <li>
                      <strong>Harga Sewa:</strong> Disepakati harga sewa sebesar{' '}
                      <span className="font-semibold text-slate-900 italic">[Harga Sewa]</span>.
                    </li>
                  </ol>
                </div>

                {/* PASAL 2 Standard */}
                <div className="space-y-2 text-xs font-sans">
                  <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                    PASAL 2: HAK DAN KEWAJIBAN PIHAK KEDUA (PENYEWA)
                  </h3>
                  <ol className="list-decimal pl-5 space-y-1.5 text-justify">
                    <li>Penyewa berhak menggunakan unit dan fasilitas yang disediakan dengan baik.</li>
                    <li>Penyewa wajib membayar harga sewa sebelum atau pada tanggal jatuh tempo.</li>
                    <li>Penyewa dilarang memindahtangankan objek sewa kepada pihak ketiga tanpa izin tertulis dari Pemilik.</li>
                    <li>Penyewa dilarang melakukan kegiatan yang melanggar hukum di lokasi properti.</li>
                  </ol>
                </div>

                {/* Custom Articles Created in Form */}
                {articles.map((art) => (
                  <div key={art.id} className="space-y-2">
                    <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-1 font-sans">
                      {art.title}
                    </h3>
                    <ol className="list-decimal pl-5 space-y-1.5 text-justify">
                      {art.items.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}

                {/* Closing */}
                <p className="text-xs text-justify pt-2">
                  Demikian surat perjanjian sewa ini dibuat secara sah dan digital melalui platform ARVENTA Property Management untuk dipergunakan sebagaimana mestinya.
                </p>

                {/* Signatures */}
                <div className="pt-6 grid grid-cols-2 gap-8 text-center font-sans">
                  <div>
                    <p className="font-bold text-slate-800">PIHAK PERTAMA (Pemilik Properti)</p>
                    <div className="my-3 py-2 px-3 border border-dashed border-emerald-500 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-semibold inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> VERIFIED DIGITAL SIGNATURE
                    </div>
                    <p className="font-bold text-slate-900 mt-2">{ownerName}</p>
                    <p className="text-[11px] text-slate-500">Pemilik Properti {propertyName}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">PIHAK KEDUA (Penyewa)</p>
                    <div className="my-3 py-2 px-3 border border-dashed border-blue-500 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-semibold inline-flex items-center gap-1">
                      ✓ SETUJU & MENERIMA SYARAT
                    </div>
                    <p className="font-bold text-slate-900 mt-2">[Nama Penyewa]</p>
                    <p className="text-[11px] text-slate-500">Penyewa Utama</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between shrink-0 text-xs">
          <div className="text-muted-foreground flex items-center gap-2">
            {activeTab === 'FORM' ? (
              <span>Gunakan tab di kanan atas untuk melihat pratinjau live dokumen</span>
            ) : (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Pratinjau Dokumen Kontrak sesuai konfigurasi pasal saat ini
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit()}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Simpan Template</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
