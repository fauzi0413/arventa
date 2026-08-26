/**
 * ARVENTRA Transactional Email Service (Resend REST API)
 * Zero external package dependency — 100% Vercel & Next.js Serverless compatible!
 */

const RESEND_API_URL = "https://api.resend.com/emails";

function getSender() {
  return process.env.EMAIL_FROM || "ARVENTRA Platform <onboarding@resend.dev>";
}

function getApiKey() {
  return process.env.RESEND_API_KEY || null;
}

/**
 * Base email layout wrapper with ARVENTRA branding
 */
function createEmailWrapper(contentHtml: string, previewText: string = "") {
  return `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ARVENTRA</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #F7F9F6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div>` : ""}
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E1ECE0; border-radius: 20px; padding: 32px 28px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); color: #2F332E;">
          
          <!-- Logo & Brand Header -->
          <div style="text-align: center; margin-bottom: 28px; border-bottom: 1px solid #F0F5EF; padding-bottom: 20px;">
            <div style="display: inline-block; width: 44px; height: 44px; background-color: #5B7555; color: #ffffff; border-radius: 12px; font-weight: 900; font-size: 22px; line-height: 44px; text-align: center; margin-bottom: 8px;">
              A
            </div>
            <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #2F332E;">ARVENTRA</h1>
            <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: 700; color: #6B8065; text-transform: uppercase; letter-spacing: 1px;">Platform Manajemen Properti &amp; SaaS</p>
          </div>

          <!-- Body Content -->
          ${contentHtml}

          <!-- Footer -->
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #F0F5EF; text-align: center; color: #888888; font-size: 11px; line-height: 1.5;">
            <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} ARVENTRA Property Management Platform. All rights reserved.</p>
            <p style="margin: 0;">Email ini dikirim secara otomatis. Mohon tidak membalas langsung email ini.</p>
          </div>

        </div>
      </body>
    </html>
  `;
}

/**
 * Generic Resend API Email Dispatcher
 */
async function dispatchEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn(`⚠️ [RESEND] RESEND_API_KEY belum diatur di .env. Email ke '${to}' dilewati.`);
    return false;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: getSender(),
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json();
      console.error("❌ Gagal mengirim email via Resend:", errJson);
      return false;
    }

    console.log(`✅ [RESEND] Email '${subject}' berhasil dikirim ke: ${to}`);
    return true;
  } catch (err) {
    console.error("❌ Error dispatching email via Resend:", err);
    return false;
  }
}

// ============================================================================
// 1. TEMPLATE: VERIFIKASI EMAIL AKUN BARU
// ============================================================================
export async function sendVerificationEmail({
  to,
  fullName,
  verificationLink,
}: {
  to: string;
  fullName: string;
  verificationLink: string;
}) {
  const htmlContent = `
    <h2 style="font-size: 18px; font-weight: 800; color: #2F332E; margin: 0 0 12px 0;">Verifikasi Alamat Email Anda</h2>
    <p style="font-size: 14px; color: #4A5049; margin: 0 0 16px 0;">Halo <strong>${fullName}</strong>,</p>
    <p style="font-size: 14px; color: #4A5049; line-height: 1.6; margin: 0 0 24px 0;">
      Terima kasih telah mendaftar di ARVENTRA. Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda dan mengaktifkan akun Anda:
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${verificationLink}" style="background-color: #6B8065; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(107,128,101,0.25);">
        Verifikasi Email Akun Saya &rarr;
      </a>
    </div>

    <p style="font-size: 12px; color: #7A8279; line-height: 1.5; margin: 24px 0 0 0;">
      Jika tombol di atas tidak dapat diklik, salin dan tempel tautan berikut ke peramban Anda:<br />
      <a href="${verificationLink}" style="color: #5B7555; word-break: break-all;">${verificationLink}</a>
    </p>
    <p style="font-size: 12px; color: #999999; margin: 12px 0 0 0;">Tautan ini berlaku selama 24 jam.</p>
  `;

  return dispatchEmail({
    to,
    subject: "Verifikasi Email Akun ARVENTRA Anda",
    html: createEmailWrapper(htmlContent, "Konfirmasi alamat email Anda untuk mengaktifkan akun ARVENTRA."),
  });
}

// ============================================================================
// 2. TEMPLATE: RESET PASSWORD / LUPA PASSWORD
// ============================================================================
export async function sendPasswordResetEmail({
  to,
  fullName,
  resetLink,
}: {
  to: string;
  fullName: string;
  resetLink: string;
}) {
  const htmlContent = `
    <h2 style="font-size: 18px; font-weight: 800; color: #2F332E; margin: 0 0 12px 0;">Permintaan Atur Ulang Password</h2>
    <p style="font-size: 14px; color: #4A5049; margin: 0 0 16px 0;">Halo <strong>${fullName}</strong>,</p>
    <p style="font-size: 14px; color: #4A5049; line-height: 1.6; margin: 0 0 24px 0;">
      Kami menerima permintaan untuk mengatur ulang kata sandi (password) akun ARVENTRA Anda. Klik tombol di bawah ini untuk membuat password baru:
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetLink}" style="background-color: #2F332E; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(47,51,46,0.2);">
        Atur Ulang Password Saya &rarr;
      </a>
    </div>

    <p style="font-size: 12px; color: #7A8279; line-height: 1.5; margin: 24px 0 0 0;">
      Jika Anda tidak pernah meminta perubahan password, abaikan pesan ini. Kata sandi Anda akan tetap aman.
    </p>
    <p style="font-size: 12px; color: #999999; margin: 12px 0 0 0;">Tautan ini berlaku selama 60 menit demi keamanan akun Anda.</p>
  `;

  return dispatchEmail({
    to,
    subject: "Instruksi Atur Ulang Password ARVENTRA",
    html: createEmailWrapper(htmlContent, "Petunjuk mengatur ulang kata sandi akun ARVENTRA Anda."),
  });
}

// ============================================================================
// 3. TEMPLATE: TAGIHAN INVOICE SEWA PROPERTI / PENYETORAN
// ============================================================================
export async function sendInvoicePaymentEmail({
  to,
  tenantName,
  invoiceNumber,
  unitNumber,
  amount,
  dueDate,
  paymentUrl,
}: {
  to: string;
  tenantName: string;
  invoiceNumber: string;
  unitNumber: string;
  amount: string;
  dueDate: string;
  paymentUrl: string;
}) {
  const htmlContent = `
    <h2 style="font-size: 18px; font-weight: 800; color: #2F332E; margin: 0 0 12px 0;">Tagihan Pembayaran Sewa Baru</h2>
    <p style="font-size: 14px; color: #4A5049; margin: 0 0 16px 0;">Yth. Bpk/Ibu <strong>${tenantName}</strong>,</p>
    <p style="font-size: 14px; color: #4A5049; line-height: 1.6; margin: 0 0 20px 0;">
      Invoice tagihan sewa unit properti Anda telah terbit. Berikut rincian ringkas pembayaran Anda:
    </p>

    <!-- Invoice Details Table Box -->
    <div style="background-color: #F9FAF8; border: 1px solid #E1ECE0; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #7A8279; font-weight: 600;">Nomor Invoice:</td>
          <td style="padding: 6px 0; color: #2F332E; font-weight: 800; text-align: right;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #7A8279; font-weight: 600;">Unit Kamar/Properti:</td>
          <td style="padding: 6px 0; color: #2F332E; font-weight: 800; text-align: right;">${unitNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #7A8279; font-weight: 600;">Jatuh Tempo:</td>
          <td style="padding: 6px 0; color: #C53030; font-weight: 800; text-align: right;">${dueDate}</td>
        </tr>
        <tr style="border-top: 1px dashed #D5E2D3;">
          <td style="padding: 10px 0 0 0; color: #2F332E; font-weight: 800; font-size: 14px;">Total Tagihan:</td>
          <td style="padding: 10px 0 0 0; color: #5B7555; font-weight: 900; font-size: 16px; text-align: right;">${amount}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${paymentUrl}" style="background-color: #6B8065; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(107,128,101,0.25);">
        Bayar Invoice Sekarang &rarr;
      </a>
    </div>

    <p style="font-size: 12px; color: #7A8279; line-height: 1.5; margin: 20px 0 0 0;">
      Harap melakukan konfirmasi atau pembayaran sebelum tanggal jatuh tempo untuk menghindari pengenaan denda keterlambatan sewa.
    </p>
  `;

  return dispatchEmail({
    to,
    subject: `[Tagihan ARVENTRA] Invoice ${invoiceNumber} Unit ${unitNumber}`,
    html: createEmailWrapper(htmlContent, `Tagihan pembayaran sewa sebesar ${amount} untuk Unit ${unitNumber}.`),
  });
}

// ============================================================================
// 4. TEMPLATE: KONFIRMASI PEMBAYARAN / RESI LUNAS
// ============================================================================
export async function sendPaymentReceiptEmail({
  to,
  tenantName,
  invoiceNumber,
  amountPaid,
  paymentMethod,
  paidAt,
}: {
  to: string;
  tenantName: string;
  invoiceNumber: string;
  amountPaid: string;
  paymentMethod: string;
  paidAt: string;
}) {
  const htmlContent = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="background-color: #DEF7EC; color: #03543F; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
        &check; Pembayaran Lunas
      </span>
    </div>

    <h2 style="font-size: 18px; font-weight: 800; color: #2F332E; margin: 0 0 12px 0; text-align: center;">Bukti Pembayaran Diterima</h2>
    <p style="font-size: 14px; color: #4A5049; margin: 0 0 16px 0;">Yth. <strong>${tenantName}</strong>,</p>
    <p style="font-size: 14px; color: #4A5049; line-height: 1.6; margin: 0 0 20px 0;">
      Terima kasih! Kami telah menerima pembayaran tagihan sewa Anda dengan rincian penerimaan sebagai berikut:
    </p>

    <!-- Receipt Table Box -->
    <div style="background-color: #F9FAF8; border: 1px solid #E1ECE0; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #7A8279; font-weight: 600;">No. Referensi Invoice:</td>
          <td style="padding: 6px 0; color: #2F332E; font-weight: 800; text-align: right;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #7A8279; font-weight: 600;">Metode Pembayaran:</td>
          <td style="padding: 6px 0; color: #2F332E; font-weight: 800; text-align: right;">${paymentMethod}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #7A8279; font-weight: 600;">Waktu Transaksi:</td>
          <td style="padding: 6px 0; color: #2F332E; font-weight: 800; text-align: right;">${paidAt}</td>
        </tr>
        <tr style="border-top: 1px dashed #D5E2D3;">
          <td style="padding: 10px 0 0 0; color: #2F332E; font-weight: 800; font-size: 14px;">Total Dibayarkan:</td>
          <td style="padding: 10px 0 0 0; color: #046C4E; font-weight: 900; font-size: 16px; text-align: right;">${amountPaid}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 12px; color: #7A8279; line-height: 1.5; margin: 20px 0 0 0; text-align: center;">
      Simpan resi digital ini sebagai bukti sah transaksi pembayaran sewa Anda.
    </p>
  `;

  return dispatchEmail({
    to,
    subject: `[Kuitansi Lunas] Pembayaran Invoice ${invoiceNumber} Berhasil`,
    html: createEmailWrapper(htmlContent, `Bukti pembayaran lunas seharga ${amountPaid} untuk invoice ${invoiceNumber}.`),
  });
}

// ============================================================================
// 5. TEMPLATE: UNDANGAN ANGGOTA TIM / STAF / HOUSEKEEPING
// ============================================================================
export async function sendUserInvitationEmail({
  to,
  inviterName,
  roleName,
  inviteLink,
}: {
  to: string;
  inviterName: string;
  roleName: string;
  inviteLink: string;
}) {
  const htmlContent = `
    <h2 style="font-size: 18px; font-weight: 800; color: #2F332E; margin: 0 0 12px 0;">Undangan Bergabung di ARVENTRA</h2>
    <p style="font-size: 14px; color: #4A5049; margin: 0 0 16px 0;">Halo,</p>
    <p style="font-size: 14px; color: #4A5049; line-height: 1.6; margin: 0 0 24px 0;">
      <strong>${inviterName}</strong> mengundang Anda untuk bergabung ke dalam platform ARVENTRA sebagai <strong>${roleName}</strong>. Klik tombol di bawah ini untuk menerima undangan dan mengatur sandi akun Anda:
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${inviteLink}" style="background-color: #6B8065; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(107,128,101,0.25);">
        Terima Undangan &amp; Mendaftar &rarr;
      </a>
    </div>

    <p style="font-size: 12px; color: #7A8279; line-height: 1.5; margin: 24px 0 0 0;">
      Jika Anda tidak merasa mengenal pengundang, Anda dapat mengabaikan surel ini.
    </p>
  `;

  return dispatchEmail({
    to,
    subject: `Undangan Bergabung sebagai ${roleName} di ARVENTRA`,
    html: createEmailWrapper(htmlContent, `${inviterName} mengundang Anda bergabung sebagai ${roleName} di platform ARVENTRA.`),
  });
}
