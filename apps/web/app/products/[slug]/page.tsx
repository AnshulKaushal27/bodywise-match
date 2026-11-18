import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_CATALOGUE_SEED } from "@bodywise/shared";
import { ProductDetailClient } from "./ProductDetailClient";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return DEMO_CATALOGUE_SEED.map((product) => ({
    slug: product.slug,
  }));
}

export function generateMetadata({ params }: ProductPageProps): Metadata {
  const product = DEMO_CATALOGUE_SEED.find((p) => p.slug === params.slug);
  if (!product) {
    return {
      title: "Product Not Found | Bodywise Match",
      description: "The requested Be Bodywise product record was not found.",
    };
  }

  return {
    title: `${product.official_name} (${product.format}) | Bodywise Match`,
    description: product.official_description,
  };
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const product = DEMO_CATALOGUE_SEED.find((p) => p.slug === params.slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
