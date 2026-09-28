"use client";
import { useEffect,useState } from 'react';
import Link from 'next/link';
import { getMockOrder } from '@/lib/services/orders';
import { clearCheckoutSession } from "@/lib/services/checkout-session";
import { mapOrder } from '@/lib/services/order-display';
import { OrderTimeline,ReorderButton } from '@/components/orders/order-timeline';
import { USE_MOCK_DATA,ORDER_STATUS_LABEL } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n/locale-provider';
import { translateText } from '@/lib/i18n/translate';
import type { Order } from '@/types/order';
import { formatCurrency } from '@/lib/utils';
export default function OrderSuccessPage({params}:{params:{orderNumber:string}}){
 const {locale}=useTranslation();const en=locale==='en';const [order,setOrder]=useState<Order|null|undefined>();const [failed,setFailed]=useState(false);const [revision,setRevision]=useState(0);
 useEffect(()=>{let live=true;setFailed(false);setOrder(undefined);
  if(USE_MOCK_DATA){try{setOrder(getMockOrder(params.orderNumber));}catch{setOrder(null);}return;}
  fetch(`/api/orders/${encodeURIComponent(params.orderNumber)}`,{cache:'no-store'}).then(async response=>{const data=await response.json();if(!response.ok||!data.ok)throw Error();if(live){const mapped=mapOrder(data.order);setOrder(mapped);if(mapped.paymentStatus==='paid'||mapped.paymentMethod==='cod'||['cancelled','refunded','delivered','completed'].includes(mapped.status))clearCheckoutSession(mapped.orderNumber);}}).catch(()=>{if(live){setOrder(null);setFailed(true);}});return()=>{live=false;};
 },[params.orderNumber,revision]);
 if(order===undefined)return <p role="status" className="p-12 text-center">{en?'Loading order…':'กำลังโหลดคำสั่งซื้อ…'}</p>;
 if(!order)return <div className="p-12 text-center"><p>{en?'Order unavailable. Sign in with the account that placed it, or open this page in the browser used at checkout.':'ไม่พบคำสั่งซื้อ กรุณาเข้าสู่ระบบด้วยบัญชีที่สั่งซื้อ หรือเปิดจากเบราว์เซอร์ที่ใช้สั่งซื้อ'}</p>{failed&&<button onClick={()=>setRevision(n=>n+1)} className="primary-button mt-4">{en?'Retry':'ลองใหม่'}</button>}<Link href="/login" className="ml-4 text-primary">{en?'Sign in':'เข้าสู่ระบบ'}</Link></div>;
 const paid=order.paymentStatus==='paid'||['paid','processing','packed','shipped','delivered','completed'].includes(order.status)&&order.paymentMethod!=='cod';
 return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
  <div className="text-center"><h1 className="text-2xl font-semibold">{USE_MOCK_DATA?(en?'Order placed!':'สั่งซื้อสำเร็จ!'):(en?'Your order':'คำสั่งซื้อของคุณ')}</h1><p className="mt-2 text-muted">{en?'Order number':'เลขที่คำสั่งซื้อ'}: {order.orderNumber}</p><p className="mt-2 text-sm">{translateText(ORDER_STATUS_LABEL[order.status]||order.status,locale)}</p>
   {USE_MOCK_DATA?<p className="mt-2 text-xs text-muted">{en?'Demo order — no payment was taken.':'ออเดอร์ตัวอย่าง — ไม่มีการตัดเงินจริง'}</p>:!paid&&order.paymentMethod!=='cod'&& !['cancelled','refunded'].includes(order.status)?<p role="status" className="mt-3 text-sm text-primary">{en?'Payment has not been confirmed. Refresh after completing payment.':'ยังไม่ยืนยันการชำระเงิน กรุณารีเฟรชหลังชำระเงินแล้ว'}</p>:null}
  </div>
  <OrderTimeline order={order}/>
  <div className="rounded-2xl border border-border bg-surface p-5"><ul className="divide-y divide-border">{order.items.map(item=><li key={item.variantId} className="flex justify-between gap-3 py-3 text-sm"><span>{item.productName} × {item.quantity}</span><span className="shrink-0">{formatCurrency(item.lineTotal)}</span></li>)}</ul><dl className="space-y-2 border-t border-border py-4 text-sm">{[[en?'Subtotal':'ยอดรวมสินค้า',order.subtotal],[en?'Shipping':'ค่าจัดส่ง',order.shippingFee],[en?'Discount':'ส่วนลด',-order.discountAmount],[en?'Total':'ยอดชำระทั้งหมด',order.grandTotal]].map(([label,value])=><div key={label} className="flex justify-between"><dt>{label}</dt><dd>{formatCurrency(Number(value))}</dd></div>)}</dl>
   <p className="text-sm text-muted">{en?'Deliver to':'จัดส่งไปที่'}: {order.shippingAddress.recipientName}, {order.shippingAddress.addressLine1} {order.shippingAddress.subdistrict} {order.shippingAddress.district} {order.shippingAddress.province} {order.shippingAddress.postalCode}</p>
  </div>
  <div className="mt-5 flex flex-wrap gap-3"><ReorderButton order={order}/><button className="focus-ring rounded-xl border border-border px-4 py-2" onClick={()=>setRevision(n=>n+1)}>{en?'Refresh status':'รีเฟรชสถานะ'}</button><Link className="focus-ring rounded-xl border border-border px-4 py-2" href="/account">{en?'My orders':'ดูคำสั่งซื้อของฉัน'}</Link><Link className="focus-ring rounded-xl border border-border px-4 py-2" href="/products">{en?'Continue shopping':'เลือกซื้อสินค้าต่อ'}</Link></div>
 </div>;
}
