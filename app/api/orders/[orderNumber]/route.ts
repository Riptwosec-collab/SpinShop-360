import type { NextRequest } from 'next/server';
import { authorizeOrder, paymentDatabase, paymentResponse } from '@/lib/payments/server';
import { ORDER_CUSTOMER_SELECT } from '@/lib/order-projection';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, { params }: { params: { orderNumber: string } }) {
  const db = paymentDatabase();
  if (!db) return paymentResponse({ok:false,code:'unavailable'},503);
  const {data:order,error} = await db.from('orders').select(ORDER_CUSTOMER_SELECT).eq('order_number',params.orderNumber).maybeSingle();
  if(error) return paymentResponse({ok:false,code:'load_failed'},503);
  if(!order || !await authorizeOrder(request,{id:order.id,user_id:order.user_id},db)) return paymentResponse({ok:false,code:'not_found'},404);
  return paymentResponse({ok:true,order});
}
