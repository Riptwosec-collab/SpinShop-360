"use client";

import { useState } from 'react';
import type { Order } from '@/types/order';
import { orderTimeline,prepareReorder } from '@/lib/services/order-display';
import { getProductsByIds } from '@/lib/services/products';
import { useCartStore } from '@/lib/stores/cart-store';
import { useTranslation } from '@/lib/i18n/locale-provider';
const labels: Record<string,[string,string]>={received:['รับคำสั่งซื้อ','Order received'],payment:['รอชำระเงิน','Awaiting payment'],preparing:['เตรียมสินค้า','Preparing'],shipping:['จัดส่งแล้ว','Shipped'],delivered:['จัดส่งสำเร็จ','Delivered'],cancelled:['ยกเลิกคำสั่งซื้อ','Order cancelled'],refunded:['คืนเงินแล้ว','Refunded']};
export function OrderTimeline({order}:{order:Order}){
 const {locale}=useTranslation();const index=locale==='en'?1:0;
 return <section aria-label={index?'Order progress':'ความคืบหน้าคำสั่งซื้อ'} className="my-5 rounded-xl border border-border p-4">
   {(order.status==='cancelled'||order.status==='refunded')&&<p className="mb-3 text-danger">{labels[order.status][index]}</p>}
   <ol className="grid gap-3 sm:grid-cols-5">{orderTimeline(order).map((step,i)=><li key={step.key} aria-current={step.current?'step':undefined} className={`flex items-center gap-2 text-sm ${step.current||step.done?'text-primary':'text-muted'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${step.done?'bg-primary/15':'border-border'}`}>{step.done?'✓':i+1}</span>{labels[step.key][index]}</li>)}</ol>
   {order.trackingNumber&&<p className="mt-4 break-all text-sm">{index?'Tracking number':'เลขพัสดุ'}: <strong>{order.trackingNumber}</strong>{order.trackingCarrier&&` · ${order.trackingCarrier}`}</p>}
   {order.shippedAt&&<p className="mt-1 text-xs text-muted">{index?'Shipped':'จัดส่งเมื่อ'}: {new Date(order.shippedAt).toLocaleString(index?'en-GB':'th-TH')}</p>}
 </section>;
}
export function ReorderButton({order}:{order:Order}){
 const {locale}=useTranslation();const en=locale==='en';const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 async function reorder(){setBusy(true);setMessage('');try{
   const products=await getProductsByIds([...new Set(order.items.map(i=>i.productId))]);
   const prepared=prepareReorder(order.items,products);let added=0;
   for(const item of prepared.items) if(useCartStore.getState().addItem(item).ok)added++;
   if(added){setMessage(en?`Added ${added} items using current prices and stock.`:`เพิ่ม ${added} รายการตามราคาและสต๊อกปัจจุบันแล้ว`);useCartStore.getState().openDrawer();}
   else setMessage(en?'These items are unavailable or already at the stock limit in your cart.':'สินค้าไม่พร้อมจำหน่าย หรือจำนวนในตะกร้าครบตามสต๊อกแล้ว');
 }catch{setMessage(en?'Could not check stock. Please retry.':'ตรวจสอบสต๊อกไม่สำเร็จ กรุณาลองใหม่');}finally{setBusy(false);}}
 return <div><button className="primary-button" disabled={busy} onClick={reorder}>{busy?(en?'Checking stock…':'กำลังตรวจสต๊อก…'):(en?'Buy again':'ซื้อซ้ำ')}</button>{message&&<p role="status" className="mt-2 text-sm text-muted">{message}</p>}</div>;
}
