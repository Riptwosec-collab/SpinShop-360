import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProductReviews, getRelatedProducts } from "@/lib/services/products";
import { ProductViewer } from "@/components/product-viewer/product-viewer";
import { ProductInfoPanel } from "@/components/product/product-info-panel";
import { ProductTabs } from "@/components/product/product-tabs";
import { RelatedProducts } from "@/components/product/related-products";
import { APP_URL } from "@/lib/constants";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};

  const image = product.images[0]?.url ?? product.fallbackImageUrl;
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `${APP_URL}/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: [{ url: image }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      images: [image],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const [reviews, related] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => i.url),
    description: product.shortDescription,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    aggregateRating:
      product.reviewSummary.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.reviewSummary.average,
            reviewCount: product.reviewSummary.count,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      url: `${APP_URL}/products/${product.slug}`,
      priceCurrency: "THB",
      price: product.basePrice,
      availability:
        product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "หน้าแรก", item: APP_URL },
      { "@type": "ListItem", position: 2, name: product.category, item: `${APP_URL}/products?category=${product.categorySlug}` },
      { "@type": "ListItem", position: 3, name: product.name, item: `${APP_URL}/products/${product.slug}` },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductViewer product={product} />
        <ProductInfoPanel product={product} />
      </div>

      <ProductTabs product={product} reviews={reviews} />
      <RelatedProducts products={related} />
    </div>
  );
}
