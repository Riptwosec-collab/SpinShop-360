import { describe, expect, it } from 'vitest';
import { orderTimeline, prepareReorder, mapOrder } from '@/lib/services/order-display';
import { MOCK_PRODUCTS } from '@/lib/mock-data/products';
import type { Order } from '@/types/order';
const order = { status: 'pending', paymentMethod: 'credit_card', items: [] } as unknown as Order;
describe('truthful order timeline and current catalog reorder', () => {
 it('keeps unpaid orders at payment instead of claiming success', () => {
  expect(orderTimeline(order).find(s => s.current)?.key).toBe('payment');
  expect(orderTimeline(order).find(s => s.key === 'shipping')?.done).toBe(false);
 });
 it('does not show cancelled or refunded orders as delivered', () => {
  for(const status of ['cancelled','refunded'] as const) expect(orderTimeline({...order,status}).filter(s=>s.done)).toHaveLength(0);
 });
 it('skips the payment stage for cash on delivery', () => {
  expect(orderTimeline({...order,status:'processing',paymentMethod:'cod'}).find(s=>s.current)?.key).toBe('preparing');
 });
 it('uses current stock and prices and skips inactive variants on reorder', () => {
  const p = structuredClone(MOCK_PRODUCTS[0]);
  const v = p.variants[0]; v.price = 1234; v.stockQuantity = 2;
  const items = [{productId:p.id,variantId:v.id,quantity:5,unitPrice:1}] as Order['items'];
  const result = prepareReorder(items,[p]);
  expect(result.items[0].unitPrice).toBe(1234); expect(result.items[0].quantity).toBe(2); expect(result.adjusted).toBe(1);
  v.isActive = false;
  expect(prepareReorder(items,[p]).items).toEqual([]);
 });
 it('maps tracking and payment state from persisted order', () => {
  const mapped = mapOrder({ id:'id',order_number:'number',status:'shipped',payment_status:'paid',tracking_number:'TH123',tracking_carrier:'Carrier',order_items:[],shipping_address:{},created_at:'2026-09-25T00:00:00Z' });
  expect(mapped.trackingNumber).toBe('TH123'); expect(mapped.paymentStatus).toBe('paid');
 });
});
