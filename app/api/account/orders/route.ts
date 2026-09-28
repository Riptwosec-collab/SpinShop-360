import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ORDER_CUSTOMER_SELECT } from '@/lib/order-projection';
export const dynamic='force-dynamic';
export async function GET(){
 const client=createSupabaseServerClient() as SupabaseClient|null;
 if(!client)return NextResponse.json({ok:false,code:'unavailable'},{status:503});
 const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({ok:false,code:'unauthorized'},{status:401});
 const {data,error}=await client.from('orders').select(ORDER_CUSTOMER_SELECT).eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
 return NextResponse.json(error?{ok:false,code:'load_failed'}:{ok:true,orders:data},{status:error?503:200,headers:{'Cache-Control':'private, no-store'}});
}
