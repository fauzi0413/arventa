import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Daftar Akun — ARVENTA Admin Platform",
  description: "Buat akun ARVENTA baru untuk mulai mengelola properti Anda secara digital.",
};

export default function RegisterPage() {
  return (
    <div className="rounded-3xl border border-[#E1ECE0] bg-white p-6 sm:p-8 space-y-6 shadow-xl text-[#2F332E]">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-black text-[#2F332E] tracking-tight">
          Daftar Akun Baru ARVENTRA
        </h2>
        <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
          Daftarkan akun baru untuk mengelola properti, unit, dan operasional Anda
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
