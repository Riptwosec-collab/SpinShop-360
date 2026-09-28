"use client";
import { useEffect,useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useWishlistStore } from '@/lib/stores/wishlist-store';
import { USE_MOCK_DATA } from '@/lib/constants';
import { mapOrder } from '@/lib/services/order-display';
import { OrderTimeline,ReorderButton } from '@/components/orders/order-timeline';
import { useTranslation } from '@/lib/i18n/locale-provider';
import { Localized } from '@/lib/i18n/localized';
import type { Order } from '@/types/order';
import { formatCurrency } from '@/lib/utils';
const tabs=['profile','orders','wishlist','addresses','reviews','coupons'] as const;
export default function AccountPage(){
 const {locale,t}=useTranslation();const en=locale==='en';const router=useRouter();
 const {user,initialized,logout}=useAuthStore();const wishlistCount=useWishlistStore(s=>s.count());
 const userId=user?.id;
 const [tab,setTab]=useState<typeof tabs[number]>('profile');const [orders,setOrders]=useState<Order[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(false);
 const [revision,setRevision]=useState(0);const [logoutError,setLogoutError]=useState(false);
 useEffect(()=>{
   if(!initialized)return;let live=true;setLoading(true);setError(false);
   if(USE_MOCK_DATA){try{const saved=JSON.parse(localStorage.getItem('spinshop360-orders')||'[]');setOrders(Array.isArray(saved)?saved:[]);}catch{setOrders([]);}setLoading(false);return;}
   if(!userId){setOrders([]);setLoading(false);return;}
   fetch('/api/account/orders',{cache:'no-store'}).then(async response=>{const data=await response.json();if(!response.ok||!data.ok)throw Error();if(live)setOrders(data.orders.map(mapOrder));}).catch(()=>{if(live)setError(true);}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;};
 },[initialized,userId,revision]);
 async function signOut(){const result=await logout();if(result.ok){router.push('/');router.refresh();}else setLogoutError(true);}
 const names={profile:t.account.profile,orders:t.account.orders,wishlist:t.common.wishlist,addresses:t.account.addresses,reviews:t.account.myReviews,coupons:t.account.myCoupons};
 if(!initialized)return <p role="status" className="p-12 text-center">{en?'Loading account…':'กำลังโหลดบัญชี…'}</p>;
 if(!user)return <div className="p-12 text-center"><p>{en?'Sign in to view your account.':'กรุณาเข้าสู่ระบบเพื่อดูข้อมูลบัญชี'}</p><Link className="primary-button mt-4 inline-flex" href="/login">{en?'Sign in':'เข้าสู่ระบบ'}</Link></div>;
 return <Localized><div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
  <h1 className="mb-6 text-2xl font-semibold">{t.account.title}</h1>
  <div className="flex flex-col gap-6 lg:flex-row"><nav aria-label={en?'Account sections':'เมนูบัญชี'} className="flex gap-1 overflow-x-auto lg:w-52 lg:shrink-0 lg:flex-col">{tabs.map(key=><button key={key} onClick={()=>setTab(key)} aria-current={tab===key?'page':undefined} className={`focus-ring shrink-0 rounded-xl px-3 py-2.5 text-left text-sm ${tab===key?'bg-primary/15 text-primary':'text-muted'}`}>{names[key]}</button>)}<button onClick={signOut} className="focus-ring shrink-0 rounded-xl px-3 py-2.5 text-left text-sm text-danger">{en?'Sign out':'ออกจากระบบ'}</button></nav>
  <div className="min-w-0 flex-1 rounded-2xl border border-border bg-surface p-5">{logoutError&&<p role="alert" className="text-danger">{en?'Could not sign out. Please retry.':'ออกจากระบบไม่สำเร็จ กรุณาลองใหม่'}</p>}
    {tab==='profile'&&<dl className="space-y-4"><div><dt className="text-sm text-muted">{en?'Name':'ชื่อ'}</dt><dd>{user.fullName}</dd></div><div><dt className="text-sm text-muted">{en?'Email':'อีเมล'}</dt><dd className="break-all">{user.email}</dd></div></dl>}
    {tab==='orders'&&<><h2 className="mb-4 font-semibold">{en?'Order history':'ประวัติคำสั่งซื้อ'}</h2>{loading?<p role="status">{en?'Loading orders…':'กำลังโหลดคำสั่งซื้อ…'}</p>:error?<div role="alert"><p>{en?'Could not load orders.':'โหลดคำสั่งซื้อไม่สำเร็จ'}</p><button className="primary-button mt-3" onClick={()=>setRevision(n=>n+1)}>{en?'Retry':'ลองใหม่'}</button></div>:orders.length===0?<p className="text-muted">{en?'No orders yet.':'ยังไม่มีคำสั่งซื้อ'}</p>:<ul className="space-y-4">{orders.map(order=><li key={order.id} className="rounded-xl border border-border p-4"><Link className="font-medium text-primary" href={`/order-success/${encodeURIComponent(order.orderNumber)}`}>{order.orderNumber}</Link><p className="mt-1 text-sm text-muted">{new Date(order.createdAt).toLocaleString(en?'en-GB':'th-TH')} · {formatCurrency(order.grandTotal)}</p><OrderTimeline order={order}/><ReorderButton order={order}/></li>)}</ul>}{USE_MOCK_DATA&&<p className="mt-4 text-xs text-muted">{en?'Demo orders are saved in this browser only.':'ออเดอร์ตัวอย่างบันทึกเฉพาะในเบราว์เซอร์นี้'}</p>}</>}
    {tab==='wishlist'&&<p>{en?`${wishlistCount} saved products`:`สินค้าในรายการโปรด ${wishlistCount} รายการ`} · <Link href="/wishlist" className="text-primary">{en?'View wishlist':'ดูรายการโปรด'}</Link></p>}
    {tab==='addresses'&&<div><h2 className="font-semibold">{names.addresses}</h2><p className="mt-3 text-muted">{en?'Delivery addresses are shown in each order. You can enter a different address at checkout.':'ดูที่อยู่จัดส่งได้ในแต่ละคำสั่งซื้อ และระบุที่อยู่ใหม่ได้ในขั้นตอนชำระเงิน'}</p></div>}
    {tab==='reviews'&&<div><h2 className="font-semibold">{names.reviews}</h2><p className="mt-3 text-muted">{en?'Visit the product page to view reviews and product information.':'ดูรีวิวและข้อมูลสินค้าได้ที่หน้าสินค้า'}</p><Link className="mt-3 inline-block text-primary" href="/products">{en?'Browse products':'ดูสินค้า'}</Link></div>}
    {tab==='coupons'&&<div><h2 className="font-semibold">{names.coupons}</h2><p className="mt-3 text-muted">{en?'Apply your coupon at checkout to verify its current conditions.':'กรอกรหัสคูปองในหน้าชำระเงินเพื่อตรวจสอบเงื่อนไขปัจจุบัน'}</p></div>}
  </div></div>
 </div></Localized>;
}
