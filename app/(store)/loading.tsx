export default function Loading() {
  return <div role="status" aria-label="กำลังโหลดสินค้า" className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6">
    <span className="sr-only">กำลังโหลดสินค้า / Loading products</span>
    <div className="skeleton h-10 w-60" /><div className="skeleton h-5 w-72 max-w-full" />
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="premium-panel space-y-4 p-3"><div className="skeleton aspect-square" /><div className="skeleton h-5 w-3/4" /><div className="skeleton h-10" /></div>)}</div>
  </div>;
}
