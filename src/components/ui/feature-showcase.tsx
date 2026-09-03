"use client";

import * as React from "react";
import {
  motion,
  AnimatePresence,
  type PanInfo,
} from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Building2,
  BedDouble,
  Receipt,
  Wallet,
  CheckCircle2,
  Bot,
  Layers,
  Users,
  BarChart3,
  TrendingUp,
  Clock,
  Shield,
  FileSpreadsheet,
  AlertCircle,
  Activity,
  Megaphone,
  MessageSquare,
  UserCheck,
  FileText,
  CreditCard,
  Bell,
  Sliders,
} from "lucide-react";
import type { FeatureSlide } from "@/types/feature-showcase";
import { DEFAULT_SLIDES } from "@/components/ui/feature-slides.default";

export { DEFAULT_SLIDES };
export type { FeatureSlide };

interface CarouselStackedProps {
  slides?: FeatureSlide[];
}

export default function CarouselStacked({
  slides = DEFAULT_SLIDES,
}: CarouselStackedProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [windowWidth, setWindowWidth] = React.useState(
    () => (typeof window !== "undefined" ? window.innerWidth : 1200)
  );
  const total = slides.length;

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextSlide = React.useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = React.useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = (idx: number) => {
    setActiveIndex(idx);
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 35;
    if (info.offset.x < -threshold) {
      nextSlide();
    } else if (info.offset.x > threshold) {
      prevSlide();
    }
  };

  const activeSlide = slides[activeIndex];

  // Helper for responsive dynamic transformations (exact matching reference image 3D fan ribbon)
  const getTransform = (offset: number) => {
    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;

    if (offset === 0) {
      return {
        x: 0,
        rotateY: 0,
        scale: 1,
        zIndex: 50,
        opacity: 1,
        overlayOpacity: 0,
      };
    }

    const sign = Math.sign(offset);
    const abs = Math.abs(offset);

    // Responsive Spacing & 3D Depth
    let x = 0;
    let z = 0;
    let rotateY = 0;
    let scale = 1;
    let zIndex = 30;
    let opacity = 1;
    let overlayOpacity = 0.05;

    if (isMobile) {
      // Mobile transforms (neighbor cards clearly visible peeking from sides, layered strictly behind center card)
      if (abs === 1) {
        x = sign * 230;
        z = -120;
        rotateY = -sign * 14;
        scale = 0.84;
        zIndex = 30;
        opacity = 0.75;
        overlayOpacity = 0.12;
      } else {
        x = sign * 420;
        z = -220;
        rotateY = -sign * 22;
        scale = 0.7;
        zIndex = 10;
        opacity = 0;
        overlayOpacity = 0.3;
      }
    } else if (isTablet) {
      // Tablet transforms with proper negative z-depth to prevent intersection
      if (abs === 1) {
        x = sign * 300;
        z = -140;
        rotateY = -sign * 22;
        scale = 0.88;
        zIndex = 40;
        opacity = 0.95;
        overlayOpacity = 0.1;
      } else if (abs === 2) {
        x = sign * 560;
        z = -260;
        rotateY = -sign * 32;
        scale = 0.76;
        zIndex = 30;
        opacity = 0.7;
        overlayOpacity = 0.25;
      } else {
        x = sign * 780;
        z = -380;
        rotateY = -sign * 40;
        scale = 0.65;
        zIndex = 20;
        opacity = 0;
        overlayOpacity = 0.4;
      }
    } else {
      // Desktop transforms (generous spacing & deep z-depth, zero clipping)
      if (abs === 1) {
        x = sign * 560;
        z = -180;
        rotateY = -sign * 24;
        scale = 0.88;
        zIndex = 40;
        opacity = 1;
        overlayOpacity = 0.08;
      } else if (abs === 2) {
        x = sign * 1020;
        z = -340;
        rotateY = -sign * 36;
        scale = 0.74;
        zIndex = 30;
        opacity = 0.85;
        overlayOpacity = 0.22;
      } else {
        x = sign * 1420;
        z = -480;
        rotateY = -sign * 44;
        scale = 0.62;
        zIndex = 20;
        opacity = 0;
        overlayOpacity = 0.4;
      }
    }

    return {
      x,
      z,
      rotateY,
      scale,
      zIndex,
      opacity,
      overlayOpacity,
    };
  };

  return (
    <div className="flex flex-col items-center justify-center w-full py-2 sm:py-6 md:py-8 bg-transparent select-none overflow-visible">
      {/* ---------------- 3D COVERFLOW SLIDER STAGE ---------------- */}
      <div className="relative w-full flex items-center justify-center min-h-[220px] xs:min-h-[240px] sm:min-h-[330px] md:min-h-[420px] lg:min-h-[530px] xl:min-h-[590px] overflow-visible">
        {/* Navigation Arrow Left - Visible from sm up to keep mobile touch clean */}
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="hidden sm:flex absolute left-2 sm:left-[calc(50%-270px)] md:left-[calc(50%-350px)] lg:left-[calc(50%-450px)] xl:left-[calc(50%-510px)] z-50 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-white text-[#2F332E] hover:bg-white shadow-xl border border-gray-200/90 items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Navigation Arrow Right - Visible from sm up */}
        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="hidden sm:flex absolute right-2 sm:right-[calc(50%-270px)] md:right-[calc(50%-350px)] lg:right-[calc(50%-450px)] xl:right-[calc(50%-510px)] z-50 h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-white text-[#2F332E] hover:bg-white shadow-xl border border-gray-200/90 items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* 3D Panorama Stage with wide perspective */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="relative w-full h-[210px] xs:h-[230px] sm:h-[300px] md:h-[390px] lg:h-[495px] xl:h-[555px] flex items-center justify-center cursor-grab active:cursor-grabbing overflow-visible"
          style={{ perspective: 1800, transformStyle: "preserve-3d" }}
        >
          {slides.map((slide, index) => {
            let offset = index - activeIndex;
            if (offset > total / 2) offset -= total;
            if (offset < -total / 2) offset += total;

            const isCenter = offset === 0;
            const isVisible = Math.abs(offset) <= 2;

            if (!isVisible) return null;

            const t = getTransform(offset);

            return (
              <motion.div
                key={slide.id}
                onClick={() => goToSlide(index)}
                animate={{
                  x: t.x,
                  z: t.z,
                  rotateY: t.rotateY,
                  scale: t.scale,
                  opacity: t.opacity,
                  zIndex: t.zIndex,
                }}
                transition={{
                  type: "spring",
                  stiffness: 240,
                  damping: 26,
                  mass: 0.8,
                }}
                className={`absolute w-[82vw] max-w-[340px] sm:max-w-none sm:w-[480px] md:w-[640px] lg:w-[840px] xl:w-[960px] aspect-video rounded-2xl sm:rounded-3xl ${
                  isCenter
                    ? "border-2 border-[#8FA28A]/80 shadow-2xl ring-4 ring-[#8FA28A]/10 bg-white"
                    : "border border-[#C7D3C0]/70 shadow-xl cursor-pointer bg-white"
                } overflow-hidden flex flex-col justify-between transition-shadow duration-300`}
                style={{
                  transformStyle: "preserve-3d",
                  backgroundColor: "#FFFFFF",
                }}
              >
                {/* Visual Content (100% Opaque Frame) */}
                <MockupFrame slide={slide} isCenter={isCenter} />

                {/* Subtle dark tint overlay on non-center cards for natural depth perception */}
                {!isCenter && (
                  <motion.div
                    animate={{ opacity: t.overlayOpacity }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-black pointer-events-none rounded-2xl sm:rounded-3xl"
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ---------------- PAGINATION INDICATOR DOTS ---------------- */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-4 mb-4 sm:mb-6">
        {slides.map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                isActive
                  ? "w-6 sm:w-8 h-2 sm:h-2.5 bg-[#2F332E]"
                  : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-[#C7D3C0] hover:bg-[#8FA28A]"
              }`}
            />
          );
        })}
      </div>

      {/* ---------------- ACTIVE CARD FEATURE DETAILS (MATCHING SCREENSHOT) ---------------- */}
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 text-center space-y-2.5 sm:space-y-4">
        {/* Tech Stack Badges Row */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id + "-tags"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
          >
            {activeSlide.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-[#EAE5D9] text-[#4A5048] text-[10px] sm:text-xs font-semibold tracking-normal shadow-2xs border border-[#D9D3C5]"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Feature Main Title */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id + "-title"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-1 sm:space-y-1.5"
          >
            <h3 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-[#2F332E] tracking-tight leading-tight">
              {activeSlide.title}
            </h3>
            <p className="text-[9px] sm:text-xs font-black uppercase tracking-wider text-[#8FA28A]">
              {activeSlide.category}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Description Paragraph */}
        <AnimatePresence mode="wait">
          <motion.p
            key={activeSlide.id + "-desc"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-[11px] sm:text-sm md:text-[15px] text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            {activeSlide.description}
          </motion.p>
        </AnimatePresence>

        {/* CTA Button */}
        <div className="pt-1 sm:pt-2">
          <Link
            href={activeSlide.ctaHref}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white hover:bg-gray-50 border border-gray-300 text-xs sm:text-sm font-bold text-[#2F332E] shadow-sm hover:shadow-md transition-all duration-200 group"
          >
            <span>{activeSlide.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 group-hover:text-[#2F332E] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// UI MOCKUP / PHOTO RENDERER (Clean Full-Frame Photo Asset Matching User Screenshot)
// -----------------------------------------------------------------------------
function MockupFrame({
  slide,
  isCenter,
}: {
  slide: FeatureSlide;
  isCenter: boolean;
}) {
  // If image asset is uploaded / set from admin, render pure full-frame photo directly
  if (slide.imageUrl) {
    return (
      <div className="w-full h-full relative overflow-hidden bg-[#FAF9F5] flex items-center justify-center">
        {/* Full-Frame Edge-to-Edge Asset Photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.imageUrl}
          alt={slide.title}
          className="w-full h-full object-cover object-top select-none pointer-events-none"
          loading="lazy"
        />

        {/* Top-Right Floating Pill Badge (Matching User Screenshot e.g. "PMS SAAS") */}
        <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-20 px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-white/95 backdrop-blur-md border border-gray-200/80 text-gray-800 text-[9px] sm:text-[11px] font-black uppercase tracking-wider shadow-sm">
          {slide.badge}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 sm:p-4 md:p-5 relative bg-gradient-to-b from-[#FFFFFF] via-[#FAF9F5] to-[#F5F1E8]">
      {/* Top Window / Navbar Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E8E2D5] pb-1.5 sm:pb-3 shrink-0">
        {/* Left Brand Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="h-5 w-5 sm:h-7 sm:w-7 rounded-full bg-[#8FA28A] flex items-center justify-center text-white font-black text-[9px] sm:text-xs shadow-2xs shrink-0">
            A
          </div>
          <div className="text-left min-w-0">
            <span className="text-[11px] sm:text-sm font-extrabold text-[#2F332E] block leading-tight truncate">
              ARVENTA
            </span>
            <span className="hidden sm:block text-[9px] text-gray-400 font-medium leading-none truncate">
              {slide.mockup.headerTitle}
            </span>
          </div>
        </div>

        {/* Top Right Module Badge (Responsive & never overflowing) */}
        <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#8FA28A]/15 border border-[#8FA28A]/30 text-[#8FA28A] text-[8px] sm:text-[11px] font-black uppercase tracking-wide whitespace-nowrap shrink-0 leading-none shadow-2xs flex items-center justify-center">
          {slide.badge}
        </div>
      </div>

      {/* Center Mockup Body */}
      <div className="flex-1 flex flex-col justify-center items-center py-1 sm:py-2 text-center overflow-hidden">
        <>
            {/* 1. Property Management Mockup */}
            {slide.mockup.type === "property" && (
              <div className="w-full space-y-1 sm:space-y-2.5 px-0.5 sm:px-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[9px] sm:text-xs font-bold text-gray-700">
                    <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8FA28A]" />
                    <span>Status Kamar (Lt 1-3)</span>
                  </div>
                  <span className="text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    87.5% Okupansi
                  </span>
                </div>

                {/* Compact Room Grid (8 on mobile, 12 on sm+) */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 sm:gap-1.5">
                  {[
                    { room: "101", status: "Occupied", color: "bg-emerald-500 text-white" },
                    { room: "102", status: "Occupied", color: "bg-emerald-500 text-white" },
                    { room: "103", status: "Available", color: "bg-blue-500 text-white" },
                    { room: "104", status: "Occupied", color: "bg-emerald-500 text-white" },
                    { room: "201", status: "Cleaning", color: "bg-amber-500 text-white" },
                    { room: "202", status: "Occupied", color: "bg-emerald-500 text-white" },
                    { room: "203", status: "Occupied", color: "bg-emerald-500 text-white" },
                    { room: "204", status: "Available", color: "bg-blue-500 text-white" },
                    { room: "301", status: "Occupied", color: "bg-emerald-500 text-white", hiddenMobile: true },
                    { room: "302", status: "Maint.", color: "bg-rose-500 text-white", hiddenMobile: true },
                    { room: "303", status: "Occupied", color: "bg-emerald-500 text-white", hiddenMobile: true },
                    { room: "304", status: "Available", color: "bg-blue-500 text-white", hiddenMobile: true },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-0.5 sm:p-1.5 rounded-md sm:rounded-lg text-center shadow-2xs border border-black/5 ${item.color} ${item.hiddenMobile ? "hidden sm:block" : ""}`}
                    >
                      <div className="text-[9px] sm:text-xs font-black leading-tight">
                        {item.room}
                      </div>
                      <div className="text-[7px] sm:text-[8px] opacity-90 truncate">{item.status}</div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 text-[7px] sm:text-[10px] text-gray-500 pt-0.5 sm:pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" /> Terisi
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" /> Kosong
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500" /> Clean
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500" /> Maint
                  </span>
                </div>
              </div>
            )}

            {/* 2. Tenant Management Mockup */}
            {slide.mockup.type === "tenant" && (
              <div className="w-full space-y-1 sm:space-y-1.5 px-0.5 sm:px-3 text-left">
                <div className="flex items-center justify-between text-[9px] sm:text-xs font-bold text-gray-700">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8FA28A]" />
                    <span>Daftar Penyewa Terdaftar</span>
                  </div>
                  <span className="text-[8px] sm:text-[9px] text-[#8FA28A] font-extrabold">42 Penyewa</span>
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  {[
                    {
                      name: "Budi Santoso",
                      unit: "Kamar 204 (Deluxe)",
                      phone: "+62 812-3456-7890",
                      contract: "Hingga Des 2026",
                      status: "KTP Terverifikasi",
                      statusClass: "bg-emerald-100 text-emerald-800",
                    },
                    {
                      name: "Siti Rahmawati",
                      unit: "Kamar 102 (Standard)",
                      phone: "+62 857-9876-5432",
                      contract: "Hingga Sep 2026",
                      status: "KTP Terverifikasi",
                      statusClass: "bg-emerald-100 text-emerald-800",
                    },
                    {
                      name: "Dedi Kurniawan",
                      unit: "Kamar 301 (Studio)",
                      phone: "+62 813-1122-3344",
                      contract: "Deposit Lunas",
                      status: "Penyewa Baru",
                      statusClass: "bg-blue-100 text-blue-800",
                      hiddenMobile: true,
                    },
                  ].map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#C7D3C0]/60 shadow-2xs flex items-center justify-between text-[8.5px] sm:text-[10px] ${t.hiddenMobile ? "hidden sm:flex" : ""}`}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="h-5 w-5 sm:h-7 sm:w-7 rounded-full bg-[#8FA28A]/15 text-[#8FA28A] flex items-center justify-center font-bold text-[9px] sm:text-xs">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#2F332E] leading-tight">{t.name}</div>
                          <div className="text-[7.5px] sm:text-[9px] text-gray-400">
                            {t.unit}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-1.5 py-0.5 rounded-md font-bold text-[7.5px] sm:text-[9px] ${t.statusClass}`}
                        >
                          {t.status}
                        </span>
                        <div className="text-[7px] sm:text-[8px] text-gray-400 mt-0.5 hidden xs:block">{t.contract}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Billing & Payment Mockup */}
            {slide.mockup.type === "billing" && (
              <div className="w-full space-y-1 sm:space-y-2 px-0.5 sm:px-3">
                {/* Invoice Header Mockup */}
                <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-white border border-[#C7D3C0]/60 shadow-2xs flex items-center justify-between text-left">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-5 w-5 sm:h-7 sm:w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] sm:text-xs">
                      <Receipt className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <div>
                      <div className="text-[9px] sm:text-xs font-bold text-[#2F332E] leading-tight">
                        INV-2026/09/042
                      </div>
                      <div className="text-[7.5px] sm:text-[9px] text-gray-400">
                        Kamar 204 — Budi Santoso
                      </div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[7.5px] sm:text-[9px] font-bold">
                    LUNAS
                  </span>
                </div>

                {/* WhatsApp Reminder Strip */}
                <div className="p-1 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-50 border border-emerald-200 text-left flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[8px] sm:text-[10px] font-medium text-emerald-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>WhatsApp Pengingat Terkirim Otomatis</span>
                  </div>
                  <span className="text-[7.5px] sm:text-[8px] font-bold text-emerald-700">100%</span>
                </div>

                {/* Quick Summary Row */}
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-left">
                  <div className="p-1 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#C7D3C0]/50">
                    <div className="text-[7px] sm:text-[8px] text-gray-400">Total Tagihan</div>
                    <div className="text-[10px] sm:text-sm font-black text-[#2F332E]">
                      Rp 2.450.000
                    </div>
                  </div>
                  <div className="p-1 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#C7D3C0]/50">
                    <div className="text-[7px] sm:text-[8px] text-gray-400">Metode Bayar</div>
                    <div className="text-[10px] sm:text-sm font-black text-[#8FA28A]">
                      Transfer / QRIS
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Housekeeping Management Mockup */}
            {slide.mockup.type === "housekeeping" && (
              <div className="w-full space-y-1 sm:space-y-1.5 px-0.5 sm:px-3 text-left">
                <div className="flex items-center justify-between text-[9px] sm:text-xs font-bold text-gray-700">
                  <span>Housekeeping Schedule (Shift Pagi)</span>
                  <span className="text-[8px] sm:text-[9px] text-[#8FA28A] font-extrabold">3 Staf Aktif</span>
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  {[
                    {
                      room: "Kamar 103 (Deluxe)",
                      task: "Ganti Sprei & Sanitasi",
                      staff: "Pak Agus",
                      status: "SELESAI",
                      badgeClass: "bg-emerald-100 text-emerald-800",
                    },
                    {
                      room: "Kamar 201 (Standard)",
                      task: "Deep Clean Checkout",
                      staff: "Ibu Siti",
                      status: "PROSES",
                      badgeClass: "bg-amber-100 text-amber-800",
                    },
                    {
                      room: "Kamar 302 (Studio)",
                      task: "Pengecekan AC & Inventaris",
                      staff: "Pak Dedi",
                      status: "ANTRIAN",
                      badgeClass: "bg-gray-100 text-gray-700",
                      hiddenMobile: true,
                    },
                  ].map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#C7D3C0]/60 shadow-2xs flex items-center justify-between text-[8.5px] sm:text-[10px] ${t.hiddenMobile ? "hidden sm:flex" : ""}`}
                    >
                      <div>
                        <div className="font-bold text-[#2F332E] leading-tight">{t.room}</div>
                        <div className="text-[7.5px] sm:text-[9px] text-gray-400">
                          {t.task} • {t.staff}
                        </div>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded-md font-bold text-[7.5px] sm:text-[9px] ${t.badgeClass}`}
                      >
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Dashboard & Analytics Mockup */}
            {slide.mockup.type === "analytics" && (
              <div className="w-full space-y-1 sm:space-y-2 px-0.5 sm:px-3">
                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                  <div className="p-1 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#C7D3C0]/60 shadow-2xs text-left">
                    <div className="text-[7.5px] sm:text-[10px] text-gray-500 font-medium">Income</div>
                    <div className="text-[9.5px] sm:text-sm font-black text-emerald-700">Rp 64.85M</div>
                    <div className="text-[6.5px] sm:text-[8px] text-emerald-600 font-bold">+14.2%</div>
                  </div>
                  <div className="p-1 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#C7D3C0]/60 shadow-2xs text-left">
                    <div className="text-[7.5px] sm:text-[10px] text-gray-500 font-medium">OpEx</div>
                    <div className="text-[9.5px] sm:text-sm font-black text-rose-700">Rp 12.40M</div>
                    <div className="text-[6.5px] sm:text-[8px] text-gray-400 font-medium">Operasional</div>
                  </div>
                  <div className="p-1 sm:p-2 rounded-lg sm:rounded-xl bg-[#8FA28A]/15 border border-[#8FA28A]/40 shadow-2xs text-left">
                    <div className="text-[7.5px] sm:text-[10px] text-[#8FA28A] font-bold">Net Profit</div>
                    <div className="text-[9.5px] sm:text-sm font-black text-[#2F332E]">Rp 52.45M</div>
                    <div className="text-[6.5px] sm:text-[8px] text-[#8FA28A] font-bold">80.8%</div>
                  </div>
                </div>

                {/* Visual Bar Chart */}
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#C7D3C0]/60 shadow-2xs space-y-1">
                  <div className="flex justify-between items-center text-[7.5px] sm:text-[10px] font-bold text-gray-600">
                    <span>Tren Arus Kas (6 Bln)</span>
                    <span className="text-[#8FA28A] flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Naik
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-1 sm:gap-1.5 h-7 sm:h-12 pt-0.5 px-0.5">
                    {[
                      { month: "Jan", inc: "65%", opex: "20%" },
                      { month: "Feb", inc: "70%", opex: "22%" },
                      { month: "Mar", inc: "75%", opex: "18%" },
                      { month: "Apr", inc: "82%", opex: "20%" },
                      { month: "Mei", inc: "88%", opex: "19%" },
                      { month: "Jun", inc: "95%", opex: "18%" },
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full flex items-end justify-center gap-0.5 h-full">
                          <div
                            className="w-1/2 bg-[#8FA28A] rounded-t-xs"
                            style={{ height: bar.inc }}
                          />
                          <div
                            className="w-1/2 bg-[#C8A96B]/60 rounded-t-xs"
                            style={{ height: bar.opex }}
                          />
                        </div>
                        <span className="text-[6.5px] sm:text-[8px] text-gray-400 font-medium">
                          {bar.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. Community & Announcement Mockup */}
            {slide.mockup.type === "community" && (
              <div className="w-full space-y-1 sm:space-y-1.5 px-0.5 sm:px-3 text-left">
                <div className="flex items-center justify-between text-[9px] sm:text-xs font-bold text-gray-700">
                  <div className="flex items-center gap-1">
                    <Megaphone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C8A96B]" />
                    <span>Pengumuman & Komplain</span>
                  </div>
                  <span className="text-[8px] sm:text-[9px] text-[#8FA28A] font-extrabold">Aktif</span>
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-1.5">
                    <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[8.5px] sm:text-xs font-bold text-amber-900 truncate">
                        Pengumuman: Perawatan Toren Air
                      </div>
                      <div className="text-[7.5px] sm:text-[9px] text-amber-700 leading-tight line-clamp-1 sm:line-clamp-none">
                        Jadwal kuras toren Sabtu, 09:00 - 11:00 WIB.
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#C7D3C0]/60 shadow-2xs flex items-center justify-between text-[8.5px] sm:text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                        <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-[#2F332E]">Tiket: AC Kamar 203</div>
                        <div className="text-[7.5px] sm:text-[8px] text-gray-400">Teknisi ditugaskan</div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[7.5px] sm:text-[8px] font-bold">
                      SELESAI
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 7. AI Features Mockup */}
            {slide.mockup.type === "ai" && (
              <div className="w-full space-y-1 sm:space-y-2 px-0.5 sm:px-3 text-left">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#8FA28A]/10 to-[#C8A96B]/15 border border-[#8FA28A]/30 space-y-0.5">
                  <div className="flex items-center gap-1 text-[8.5px] sm:text-xs font-bold text-[#2F332E]">
                    <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8FA28A]" />
                    <span>AI Pricing & Occupancy Engine</span>
                  </div>
                  <p className="text-[7.5px] sm:text-[10px] text-gray-600 leading-tight line-clamp-2 sm:line-clamp-none">
                    Okupansi diproyeksikan <strong>95%</strong>. Rekomendasi kenaikan tarif Deluxe <strong>+8%</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1 sm:gap-2">
                  <div className="p-1 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#C7D3C0]/60 shadow-2xs">
                    <div className="text-[7px] sm:text-[8px] text-gray-400">Predictive Accuracy</div>
                    <div className="text-[9.5px] sm:text-sm font-black text-[#8FA28A]">94.8%</div>
                    <div className="text-[6.5px] sm:text-[8px] text-emerald-600 font-semibold">Gemini AI</div>
                  </div>
                  <div className="p-1 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-[#C7D3C0]/60 shadow-2xs">
                    <div className="text-[7px] sm:text-[8px] text-gray-400">Anomali Biaya</div>
                    <div className="text-[9.5px] sm:text-sm font-black text-[#2F332E]">Normal</div>
                    <div className="text-[6.5px] sm:text-[8px] text-gray-500">Beban aman</div>
                  </div>
                </div>
              </div>
            )}
          </>
      </div>

      {/* Bottom Subtle Status Bar */}
      <div className="flex items-center justify-between pt-1 sm:pt-2 border-t border-[#E8E2D5] text-[7.5px] sm:text-[9px] text-gray-400 shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active • 99.9%
        </span>
        <span>ARVENTA Cloud v0.1</span>
      </div>
    </div>
  );
}
