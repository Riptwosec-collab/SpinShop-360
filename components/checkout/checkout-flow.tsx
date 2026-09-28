"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Localized } from "@/lib/i18n/localized";
import { useTranslation } from "@/lib/i18n/locale-provider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Landmark, QrCode, Truck, Loader2 } from "lucide-react";
import { checkoutSchema, type CheckoutFormValues } from "@/lib/validators/checkout";
import { useCartStore } from "@/lib/stores/cart-store";
import { useToastStore } from "@/lib/stores/toast-store";
import { createOrder } from "@/lib/services/orders";
import { formatCurrency, cn } from "@/lib/utils";
import { DEFAULT_SHIPPING_FEE, USE_MOCK_DATA } from "@/lib/constants";
import { track } from "@/lib/analytics";
import { loadCheckoutSession, saveCheckoutSession, discardRejectedCheckout, type CheckoutSession } from "@/lib/services/checkout-session";
import { OmiseCardForm } from "@/components/checkout/omise-card-form";

const USE_OMISE_CARD_FLOW =
  !!process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const STEPS = ["ข้อมูลผู้ซื้อ", "ที่อยู่จัดส่ง", "ชำระเงิน", "ตรวจสอบคำสั่งซื้อ"] as const;

const PAYMENT_OPTIONS: { value: CheckoutFormValues["paymentMethod"]; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "promptpay", label: "พร้อมเพย์ (PromptPay QR)", icon: QrCode },
  { value: "credit_card", label: "บัตรเครดิต", icon: CreditCard },
  { value: "debit_card", label: "บัตรเดบิต", icon: CreditCard },
  { value: "bank_transfer", label: "โอนเงินผ่านธนาคาร", icon: Landmark },
  { value: "cod", label: "เก็บเงินปลายทาง", icon: Truck },
];

export function CheckoutFlow() {
  const router = useRouter();
  const { locale } = useTranslation();
  const en = locale === "en";
  const [pending, setPending] = useState<CheckoutSession | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(USE_MOCK_DATA);
  const paymentLock = useRef(false);
  const [paymentQr, setPaymentQr] = useState<string|null>(null);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const discount = useCartStore((s) => s.discount);
  const couponCode = useCartStore((s) => s.couponCode);
  const clearCart = useCartStore((s) => s.clearCart);
  const pushToast = useToastStore((s) => s.push);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [omiseCardToken, setOmiseCardToken] = useState<string | null>(null);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    try { setPending(loadCheckoutSession()); setRecoveryReady(true); }
    catch { pushToast(en ? "Checkout recovery is unavailable. Please enable browser storage." : "ไม่สามารถกู้คืนคำสั่งซื้อได้ กรุณาเปิดใช้งานพื้นที่เก็บข้อมูลของเบราว์เซอร์", "error"); }
  }, [en, pushToast]);

  useEffect(() => {
    if (items.length > 0) {
      track("begin_checkout", { itemCount: items.length, subtotal });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingMethod: "standard",
      paymentMethod: "promptpay",
    },
  });

  const shippingMethod = watch("shippingMethod");
  const paymentMethod = watch("paymentMethod");
  const shippingFee = shippingMethod === "express" ? DEFAULT_SHIPPING_FEE * 2 : subtotal >= 1500 ? 0 : DEFAULT_SHIPPING_FEE;
  const total = Math.max(0, subtotal + shippingFee - discount);

  const stepFields: Record<number, (keyof CheckoutFormValues | `buyer.${string}` | `shippingAddress.${string}`)[]> = {
    0: ["buyer.email", "buyer.phone"],
    1: [
      "shippingAddress.recipientName",
      "shippingAddress.phone",
      "shippingAddress.addressLine1",
      "shippingAddress.subdistrict",
      "shippingAddress.district",
      "shippingAddress.province",
      "shippingAddress.postalCode",
    ],
    2: ["paymentMethod", "shippingMethod"],
  };

  async function goNext() {
    const fields = stepFields[step];
    const valid = fields ? await trigger(fields as never) : true;
    if (!valid) return;

    if (
      step === 2 &&
      USE_OMISE_CARD_FLOW &&
      !USE_MOCK_DATA &&
      (watch("paymentMethod") === "credit_card" || watch("paymentMethod") === "debit_card") &&
      !omiseCardToken
    ) {
      pushToast("กรุณายืนยันข้อมูลบัตรก่อนดำเนินการต่อ", "error");
      return;
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function onSubmit(values: CheckoutFormValues) {
    if (submitting) return;
    if (items.length === 0) {
      pushToast("ตะกร้าสินค้าว่างเปล่า", "error");
      return;
    }
    setSubmitting(true);

    if (USE_MOCK_DATA) {
      const result = await createOrder({
        email: values.buyer.email,
        phone: values.buyer.phone,
        items,
        shippingAddress: values.shippingAddress,
        paymentMethod: values.paymentMethod,
        shippingMethod: values.shippingMethod,
        couponCode,
        discount,
        customerNote: values.customerNote,
      });
      setSubmitting(false);

      if (!result.ok || !result.order) {
        pushToast(result.message, "error");
        return;
      }

      pushToast("สั่งซื้อสำเร็จ (ชำระเงินแบบจำลอง)", "success");
      track("purchase", { orderNumber: result.order.orderNumber, grandTotal: result.order.grandTotal, itemCount: items.length });
      clearCart();
      router.push(`/order-success/${result.order.orderNumber}`);
      return;
    }

    try {
      // Write before sending anything: a reload after a lost response must replay
      // this exact request, never reserve another order or another payment.
      const session: CheckoutSession = pending ?? { key: crypto.randomUUID(), request: {
        email: values.buyer.email, phone: values.buyer.phone, items,
        shippingAddress: values.shippingAddress, paymentMethod: values.paymentMethod,
        shippingMethod: values.shippingMethod, couponCode, customerNote: values.customerNote,
      } };
      saveCheckoutSession(session);
      setPending(session);
      await recoverOrder(session);
    } catch { connectionError(); }
    finally { setSubmitting(false); }
  }

  function connectionError() {
    pushToast(en ? "Connection interrupted. Resume this checkout to use the same order." : "การเชื่อมต่อขัดข้อง กรุณาดำเนินการต่อจากคำสั่งซื้อเดิม", "error");
  }

  async function recoverOrder(session: CheckoutSession) {
    const response = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": session.key },
      body: JSON.stringify(session.request),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      if (response.status === 400 && result.code === "ORDER_CREATE_FAILED") {
        discardRejectedCheckout(session.key);
        setPending(null);
      }
      pushToast(en ? "Could not create the order. Check your items or contact support before starting another checkout." : "สร้างคำสั่งซื้อไม่สำเร็จ กรุณาตรวจสอบสินค้าหรือติดต่อร้านก่อนสร้างคำสั่งซื้อใหม่", "error");
      return;
    }
    const saved = { ...session, order: result.order };
    saveCheckoutSession(saved);
    setPending(saved);
    // Stop here. The customer must explicitly confirm the authoritative amount
    // below; a stale cart price can never trigger a higher unconfirmed charge.
  }

  function consumeOrderedCart(session: CheckoutSession) {
    if (session.cartConsumed) return;
    const cart = useCartStore.getState();
    for (const ordered of session.request.items) {
      const current = cart.items.find(item => item.id === ordered.id);
      if (!current) continue;
      if (current.quantity <= ordered.quantity) cart.removeItem(current.id);
      else cart.updateQuantity(current.id, current.quantity - ordered.quantity);
    }
    cart.clearCoupon();
    const saved = { ...session, cartConsumed: true };
    saveCheckoutSession(saved);
    setPending(saved);
  }

  async function confirmPayment() {
    if (!pending || paymentLock.current) return;
    paymentLock.current = true;
    setSubmitting(true);
    try {
      if (!pending.order) { await recoverOrder(pending); return; }
      // Ensure recovery remains durable before contacting the gateway.
      saveCheckoutSession(pending);
      const order = pending.order;
      const method = pending.request.paymentMethod;
      const isCard = USE_OMISE_CARD_FLOW && ["credit_card", "debit_card"].includes(method);
      if (isCard && !omiseCardToken) return;
      if (method !== "cod") {
        const response = await fetch(isCard ? "/api/payments/omise/charge-card" : "/api/payments/create", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isCard ? { orderId: order.id, token: omiseCardToken } : { orderId: order.id }),
        });
        const result = await response.json();
        if (!response.ok || !result.ok) {
          pushToast(en ? "Payment could not be confirmed. Check the saved order status before retrying." : "ยังยืนยันการชำระเงินไม่ได้ กรุณาตรวจสอบสถานะคำสั่งซื้อเดิมก่อนลองใหม่", "error");
          return;
        }
        consumeOrderedCart(pending);
        const redirect = result.redirectUrl ?? result.authorizeUri;
        if (redirect) { window.location.assign(redirect); return; }
        if (result.qrCodeData) { setPaymentQr(result.qrCodeData); return; }
      } else { consumeOrderedCart(pending); }
      router.push(`/order-success/${encodeURIComponent(order.orderNumber)}`);
    } catch { connectionError(); }
    finally { paymentLock.current = false; setSubmitting(false); }
  }

  if (!recoveryReady) return <p role="status">{en ? "Checking saved checkout. If this message remains, enable browser storage and reload, or contact support about your pending order." : "กำลังตรวจสอบคำสั่งซื้อเดิม หากข้อความนี้ค้างอยู่ กรุณาเปิดพื้นที่เก็บข้อมูลเบราว์เซอร์แล้วรีเฟรช หรือติดต่อร้านเกี่ยวกับออเดอร์ที่ค้างอยู่"}</p>;
  if (pending) {
    const needsCard = USE_OMISE_CARD_FLOW && ["credit_card", "debit_card"].includes(pending.request.paymentMethod);
    return <section className="mx-auto max-w-xl space-y-5 rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-xl font-semibold">{en ? "Confirm your order total" : "ยืนยันยอดคำสั่งซื้อ"}</h2>
      <p className="text-sm text-muted">{en ? "This checkout is saved. Reloading or returning from payment will resume the same order." : "บันทึกคำสั่งซื้อนี้แล้ว เมื่อรีเฟรชหรือกลับจากหน้าชำระเงิน ระบบจะใช้ออเดอร์เดิม"}</p>
      {pending.order ? <>
        <p>{en ? "Order" : "คำสั่งซื้อ"}: {pending.order.orderNumber}</p>
        <p className="text-2xl font-semibold" data-testid="server-order-total">{formatCurrency(pending.order.grandTotal)}</p>
        <p className="text-sm">{en ? "Final total including current prices, shipping and eligible discounts. Confirm this amount to continue." : "ยอดจริงรวมราคาปัจจุบัน ค่าจัดส่ง และส่วนลดที่ใช้ได้ กรุณายืนยันยอดนี้ก่อนดำเนินการต่อ"}</p>
        <Link href={`/order-success/${encodeURIComponent(pending.order.orderNumber)}`} className="block text-primary underline">{en ? "View order and payment status" : "ดูคำสั่งซื้อและสถานะการชำระเงิน"}</Link>
        {needsCard && !omiseCardToken && <OmiseCardForm onToken={setOmiseCardToken} disabled={submitting}/>}
      </> : <p role="status">{en ? "Recover the saved request to check whether your order was created." : "เรียกคืนคำขอเดิมเพื่อตรวจสอบว่าคำสั่งซื้อถูกสร้างแล้วหรือไม่"}</p>}
      {paymentQr && <a href={paymentQr} target="_blank" rel="noopener noreferrer" className="block text-primary underline">{en ? "Open payment QR code" : "เปิด QR สำหรับชำระเงิน"}</a>}
      <button type="button" disabled={submitting || !!pending.order && needsCard && !omiseCardToken} onClick={() => void confirmPayment()} className="primary-button disabled:opacity-50">
        {submitting ? (en ? "Please wait…" : "กรุณารอสักครู่…") : !pending.order ? (en ? "Recover saved order" : "เรียกคืนคำสั่งซื้อเดิม") : `${en ? "Confirm" : "ยืนยันยอด"} ${formatCurrency(pending.order.grandTotal)}`}
      </button>
    </section>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted">ตะกร้าสินค้าว่างเปล่า ไม่สามารถดำเนินการชำระเงินได้</p>
      </div>
    );
  }

  return (
    <Localized><div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <form onSubmit={(event) => {
        event.preventDefault();
        if (step < STEPS.length - 1) { void goNext(); return; }
        void handleSubmit(onSubmit)(event);
      }} className="lg:col-span-2">
        <ol className="mb-8 flex items-center gap-2" aria-label="ขั้นตอนการชำระเงิน">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium",
                  i < step && "border-success bg-success/15 text-success",
                  i === step && "border-primary bg-primary/15 text-primary",
                  i > step && "border-border text-muted"
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("hidden text-xs sm:inline", i === step ? "text-foreground" : "text-muted")}>
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="h-px w-4 bg-border sm:w-8" />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 text-base font-semibold text-foreground">ข้อมูลผู้ซื้อ</legend>
            <Field label="อีเมล" error={errors.buyer?.email?.message}>
              <input {...register("buyer.email")} type="email" className="input" placeholder="you@example.com" />
            </Field>
            <Field label="เบอร์โทรศัพท์" error={errors.buyer?.phone?.message}>
              <input {...register("buyer.phone")} className="input" placeholder="08X-XXX-XXXX" />
            </Field>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-2 text-base font-semibold text-foreground">ที่อยู่จัดส่ง</legend>
            <Field label="ชื่อผู้รับ" error={errors.shippingAddress?.recipientName?.message}>
              <input {...register("shippingAddress.recipientName")} className="input" />
            </Field>
            <Field label="เบอร์โทรศัพท์ผู้รับ" error={errors.shippingAddress?.phone?.message}>
              <input {...register("shippingAddress.phone")} className="input" />
            </Field>
            <Field label="ที่อยู่" error={errors.shippingAddress?.addressLine1?.message}>
              <input {...register("shippingAddress.addressLine1")} className="input" placeholder="บ้านเลขที่ ถนน ซอย" />
            </Field>
            <Field label="ที่อยู่เพิ่มเติม (ถ้ามี)">
              <input {...register("shippingAddress.addressLine2")} className="input" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="แขวง/ตำบล" error={errors.shippingAddress?.subdistrict?.message}>
                <input {...register("shippingAddress.subdistrict")} className="input" />
              </Field>
              <Field label="เขต/อำเภอ" error={errors.shippingAddress?.district?.message}>
                <input {...register("shippingAddress.district")} className="input" />
              </Field>
              <Field label="จังหวัด" error={errors.shippingAddress?.province?.message}>
                <input {...register("shippingAddress.province")} className="input" />
              </Field>
              <Field label="รหัสไปรษณีย์" error={errors.shippingAddress?.postalCode?.message}>
                <input {...register("shippingAddress.postalCode")} className="input" inputMode="numeric" />
              </Field>
            </div>
            <Field label="หมายเหตุคำสั่งซื้อ (ถ้ามี)">
              <textarea {...register("customerNote")} className="input min-h-20" />
            </Field>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="flex flex-col gap-6">
            <div>
              <legend className="mb-2 text-base font-semibold text-foreground">วิธีจัดส่ง</legend>
              <div className="flex flex-col gap-2">
                <RadioCard
                  name="shippingMethod"
                  value="standard"
                  register={register}
                  checked={shippingMethod === "standard"}
                  label="จัดส่งมาตรฐาน (2-4 วันทำการ)"
                  sublabel={subtotal >= 1500 ? "ฟรี" : formatCurrency(DEFAULT_SHIPPING_FEE)}
                />
                <RadioCard
                  name="shippingMethod"
                  value="express"
                  register={register}
                  checked={shippingMethod === "express"}
                  label="จัดส่งด่วน (1-2 วันทำการ)"
                  sublabel={formatCurrency(DEFAULT_SHIPPING_FEE * 2)}
                />
              </div>
            </div>

            <div>
              <legend className="mb-2 text-base font-semibold text-foreground">วิธีชำระเงิน</legend>
              <div className="flex flex-col gap-2">
                {PAYMENT_OPTIONS.filter(option => USE_MOCK_DATA || option.value !== "bank_transfer").map((opt) => (
                  <RadioCard
                    key={opt.value}
                    name="paymentMethod"
                    value={opt.value}
                    register={register}
                    checked={paymentMethod === opt.value}
                    label={opt.label}
                    icon={opt.icon}
                  />
                ))}
              </div>

              {USE_OMISE_CARD_FLOW && (paymentMethod === "credit_card" || paymentMethod === "debit_card") && !USE_MOCK_DATA && (
                <div className="mt-3">
                  <OmiseCardForm onToken={setOmiseCardToken} />
                  {omiseCardToken && (
                    <p className="mt-2 text-xs font-medium text-success">ยืนยันบัตรสำเร็จ พร้อมดำเนินการต่อ</p>
                  )}
                </div>
              )}

              <p className="mt-2 text-xs text-muted">
                {USE_MOCK_DATA
                  ? "โหมดพัฒนา: ระบบจะจำลองการชำระเงินสำเร็จโดยไม่มีการตัดเงินจริง"
                  : "ข้อมูลการชำระเงินจะถูกดำเนินการผ่านผู้ให้บริการที่ตั้งค่าไว้จริง"}
              </p>
            </div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset>
            <legend className="mb-2 text-base font-semibold text-foreground">ตรวจสอบคำสั่งซื้อ</legend>
            <div className="rounded-xl border border-border bg-surface p-4 text-sm">
              <p className="mb-1 font-medium text-foreground">อีเมล: {watch("buyer.email")}</p>
              <p className="mb-1 text-muted">โทร: {watch("buyer.phone")}</p>
              <p className="mb-1 text-muted">
                จัดส่งไปที่: {watch("shippingAddress.recipientName")}, {watch("shippingAddress.addressLine1")}, {watch("shippingAddress.subdistrict")} {watch("shippingAddress.district")} {watch("shippingAddress.province")} {watch("shippingAddress.postalCode")}
              </p>
              <p className="text-muted">
                ชำระเงินโดย: {PAYMENT_OPTIONS.find((p) => p.value === paymentMethod)?.label}
              </p>
            </div>
          </fieldset>
        )}

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="focus-ring rounded-lg border border-border px-4 py-2.5 text-sm text-foreground disabled:opacity-30"
          >
            ย้อนกลับ
          </button>
          {step < STEPS.length - 1 ? (
            <button
              key="next-step"
              type="button"
              onClick={goNext}
              className="focus-ring rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              ถัดไป
            </button>
          ) : (
            <button
              key="confirm-order"
              type="submit"
              disabled={submitting}
              className="focus-ring flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "กำลังดำเนินการ..." : "ยืนยันการสั่งซื้อ"}
            </button>
          )}
        </div>
      </form>

      <aside className="sticky top-20 h-fit rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-base font-semibold text-foreground">สรุปคำสั่งซื้อ</h2>
        <ul className="mb-4 flex max-h-64 flex-col gap-3 overflow-auto">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2 text-xs">
              <span className="line-clamp-1 text-muted">
                {item.productName} x{item.quantity}
              </span>
              <span className="shrink-0 font-medium">{formatCurrency(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">ยอดรวมสินค้า</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">ค่าจัดส่ง</dt>
            <dd>{shippingFee === 0 ? "ฟรี" : formatCurrency(shippingFee)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-success">
              <dt>ส่วนลด{couponCode ? ` (${couponCode})` : ""}</dt>
              <dd>-{formatCurrency(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
            <dt>ยอดชำระทั้งหมด</dt>
            <dd>{formatCurrency(total)}</dd>
          </div>
        </dl>
      </aside>
    </div></Localized>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Localized><label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </label></Localized>
  );
}

function RadioCard({
  name,
  value,
  register,
  checked,
  label,
  sublabel,
  icon: Icon,
}: {
  name: "shippingMethod" | "paymentMethod";
  value: string;
  register: ReturnType<typeof useForm<CheckoutFormValues>>["register"];
  checked: boolean;
  label: string;
  sublabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Localized><label
      className={cn(
        "focus-ring flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
        checked ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-primary/30"
      )}
    >
      <input type="radio" value={value} {...register(name)} className="sr-only" />
      {Icon && <Icon className="h-4 w-4 text-primary" />}
      <span className="flex-1 text-sm text-foreground">{label}</span>
      {sublabel && <span className="text-xs text-muted">{sublabel}</span>}
    </label></Localized>
  );
}
