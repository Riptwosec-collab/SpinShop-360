export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface EmailAdapter {
  send(input: SendEmailInput): Promise<{ ok: boolean; message: string }>;
}

class MockEmailAdapter implements EmailAdapter {
  async send(input: SendEmailInput) {
    // eslint-disable-next-line no-console
    console.info("[email:mock] would send email", { to: input.to, subject: input.subject });
    return { ok: true, message: "ส่งอีเมลสำเร็จ (จำลอง — ไม่มีการส่งอีเมลจริง)" };
  }
}

class ResendEmailAdapter implements EmailAdapter {
  constructor(private apiKey: string, private fromAddress: string) {}

  async send(input: SendEmailInput) {
    try {
      // Lazy import so the `resend` package is never pulled into a Client
      // Component bundle by mistake.
      const { Resend } = await import("resend");
      const resend = new Resend(this.apiKey);
      const { error } = await resend.emails.send({
        from: this.fromAddress,
        to: input.to,
        subject: input.subject,
        html: input.html,
      });
      if (error) return { ok: false, message: error.message };
      return { ok: true, message: "ส่งอีเมลสำเร็จ" };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "ส่งอีเมลไม่สำเร็จ" };
    }
  }
}

export function getActiveEmailAdapter(): EmailAdapter {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "SpinShop 360 <orders@spinshop360.local>";
  if (apiKey) return new ResendEmailAdapter(apiKey, from);
  return new MockEmailAdapter();
}

export function orderConfirmationEmail(params: {
  orderNumber: string;
  itemsHtml: string;
  grandTotal: string;
}): SendEmailInput["html"] {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#111827;">ขอบคุณสำหรับคำสั่งซื้อ!</h2>
      <p>เลขที่คำสั่งซื้อของคุณคือ <strong>${params.orderNumber}</strong></p>
      <div style="border-top:1px solid #e5e7eb; margin: 16px 0; padding-top: 16px;">${params.itemsHtml}</div>
      <p style="font-size: 18px; font-weight: 600;">ยอดชำระทั้งหมด: ${params.grandTotal}</p>
      <p style="color:#6b7280; font-size: 13px;">อีเมลนี้ส่งจาก SpinShop 360 โดยอัตโนมัติ</p>
    </div>
  `;
}

export function passwordResetEmail(resetUrl: string): SendEmailInput["html"] {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#111827;">รีเซ็ตรหัสผ่านของคุณ</h2>
      <p>คลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์หมดอายุใน 60 นาที)</p>
      <a href="${resetUrl}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;margin-top:12px;">
        ตั้งรหัสผ่านใหม่
      </a>
      <p style="color:#6b7280; font-size: 13px; margin-top:16px;">หากคุณไม่ได้ร้องขอ กรุณาเพิกเฉยต่ออีเมลนี้</p>
    </div>
  `;
}
