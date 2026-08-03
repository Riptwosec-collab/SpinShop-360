import { z } from "zod";

export const addressSchema = z.object({
  recipientName: z.string().min(2, "กรุณากรอกชื่อผู้รับ"),
  phone: z
    .string()
    .min(9, "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง")
    .regex(/^[0-9-+\s]+$/, "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง"),
  addressLine1: z.string().min(5, "กรุณากรอกที่อยู่"),
  addressLine2: z.string().optional(),
  subdistrict: z.string().min(1, "กรุณากรอกแขวง/ตำบล"),
  district: z.string().min(1, "กรุณากรอกเขต/อำเภอ"),
  province: z.string().min(1, "กรุณากรอกจังหวัด"),
  postalCode: z.string().regex(/^\d{5}$/, "รหัสไปรษณีย์ต้องมี 5 หลัก"),
});

export const buyerSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
  phone: z
    .string()
    .min(9, "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง")
    .regex(/^[0-9-+\s]+$/, "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง"),
});

export const checkoutSchema = z.object({
  buyer: buyerSchema,
  shippingAddress: addressSchema,
  shippingMethod: z.enum(["standard", "express"]),
  paymentMethod: z.enum(["promptpay", "credit_card", "debit_card", "bank_transfer", "cod"]),
  customerNote: z.string().max(500).optional(),
  wantsTaxInvoice: z.boolean().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
