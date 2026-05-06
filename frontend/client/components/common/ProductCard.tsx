import { PLACEHOLDER_IMAGE, ROUTES } from "@/lib/constants";
import type { Product, ProductCardHomepage } from "@/types/product";
import Image from "next/image";
import Link from "next/link";

function getDisplayProps(product: Product | ProductCardHomepage) {
  const isFullProduct = "images" in product && Array.isArray(product.images);
  const isSoldOut = "out_of_stock" in product ? product.out_of_stock : false;

  return {
    id: "id" in product ? product.id : product._id,
    name: product.name,
    slug: product.slug,
    thumbnail:
      isFullProduct && product.images?.length
        ? product.images[0]
        : "thumbnail" in product
          ? product.thumbnail
          : PLACEHOLDER_IMAGE,
    price: "price" in product ? product.price : null,
    isPreorder: product.product_type === "preorder",
    isSoldOut,
  };
}

interface ProductCardProps {
  product: Product | ProductCardHomepage;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { name, slug, thumbnail, price, isPreorder, isSoldOut } =
    getDisplayProps(product);

  return (
    <article
      className={`min-w-0 w-full rounded-xl bg-card border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className ?? ""} ${isSoldOut ? "opacity-65" : ""}`}
    >
      <Link
        href={`${ROUTES.PRODUCT}/${slug}`}
        className="group/card block w-full min-w-0"
      >
        <div className="relative w-full min-h-0 aspect-square overflow-hidden bg-muted">
          <Image
            src={thumbnail || PLACEHOLDER_IMAGE}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            className={`object-cover transition-transform duration-300 ease-out group-hover/card:scale-105 ${isSoldOut ? "opacity-80" : ""}`}
          />
          {isSoldOut && (
            <span className="absolute top-2 left-2 rounded-md border border-destructive/80 bg-destructive/90 px-2 py-1 text-xs font-bold uppercase tracking-wide text-destructive-foreground">
              Hết hàng
            </span>
          )}
          {!isSoldOut && isPreorder && (
            <span className="absolute top-2 left-2 rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-foreground">
              Pre-order
            </span>
          )}
        </div>
        <div className="p-3">
          <h2 className="text-sm font-medium text-foreground line-clamp-2">
            {name}
          </h2>
          <p
            className={`mt-1 text-sm font-semibold ${isSoldOut ? "text-muted-foreground" : "text-primary-bold"}`}
          >
            {price != null && price > 0
              ? `${price.toLocaleString("vi-VN")}₫`
              : "Liên hệ"}
          </p>
        </div>
      </Link>
    </article>
  );
}
