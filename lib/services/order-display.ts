import type { Order, OrderItemSnapshot } from '@/types/order';
import type { Product } from '@/types/product';
import type { CartItem } from '@/types/cart';

export function orderTimeline(order: Order): {key:string;done:boolean;current:boolean}[] {
  const keys = order.paymentMethod === 'cod' ? ['received','preparing','shipping','delivered'] : ['received','payment','preparing','shipping','delivered'];
  const terminal = order.status === 'cancelled' || order.status === 'refunded';
  const active = ['completed','delivered'].includes(order.status) ? 'delivered' : order.status === 'shipped' ? 'shipping' : ['paid','processing','packed'].includes(order.status) ? 'preparing' : order.paymentMethod === 'cod' ? 'received' : 'payment';
  const index = keys.indexOf(active);
  return keys.map((key,i)=>({key,done:!terminal && (i<index || (active==='delivered' && i===index)),current:!terminal && i===index}));
}

export function prepareReorder(snapshots: OrderItemSnapshot[], products: Product[]): {items:Omit<CartItem,'id'>[];adjusted:number} {
  const items:Omit<CartItem,'id'>[]=[];let adjusted=0;
  for(const snapshot of snapshots){
    const product=products.find(p=>p.id===snapshot.productId && p.status==='active');
    const variant=product?.variants.find(v=>v.id===snapshot.variantId && v.isActive && v.stockQuantity>0);
    if(!product||!variant){adjusted++;continue;}
    const quantity=Math.min(snapshot.quantity,variant.stockQuantity);
    if(quantity!==snapshot.quantity || variant.price!==snapshot.unitPrice) adjusted++;
    items.push({productId:product.id,variantId:variant.id,productName:product.name,variantLabel:snapshot.variantName,slug:product.slug,imageUrl:variant.imageUrl||product.images[0]?.url||product.fallbackImageUrl,unitPrice:variant.price,compareAtPrice:variant.compareAtPrice,quantity,stockQuantity:variant.stockQuantity});
  }
  return {items,adjusted};
}

export function mapOrder(row: Record<string,unknown>): Order {
  const items=(row.order_items as Record<string,unknown>[]|undefined)||[];
  return {
    id:String(row.id),orderNumber:String(row.order_number),email:String(row.email||''),phone:String(row.phone||''),status:row.status as Order['status'],
    items:items.map(i=>({productId:String(i.product_id||''),variantId:String(i.variant_id||''),productName:String(i.product_name||''),sku:String(i.sku||''),variantName:String(i.variant_name||''),imageUrl:String(i.image_url||''),unitPrice:Number(i.unit_price),quantity:Number(i.quantity),lineTotal:Number(i.line_total)})),
    subtotal:Number(row.subtotal||0),discountAmount:Number(row.discount_amount||0),shippingFee:Number(row.shipping_fee||0),taxAmount:Number(row.tax_amount||0),grandTotal:Number(row.grand_total||0),couponCode:row.coupon_code as string|null,
    shippingAddress:row.shipping_address as Order['shippingAddress'],paymentMethod:row.payment_method as Order['paymentMethod'],shippingMethod:String(row.shipping_method||''),customerNote:row.customer_note as string|undefined,createdAt:String(row.created_at),
    paymentStatus:row.payment_status as string|undefined,trackingNumber:row.tracking_number as string|null,trackingCarrier:row.tracking_carrier as string|null,shippedAt:row.shipped_at as string|null,deliveredAt:row.delivered_at as string|null,
  };
}
