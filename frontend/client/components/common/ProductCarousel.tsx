"use client";

import { useRef, useState, useEffect } from "react";
import { ProductCard } from "@/components/common/ProductCard";
import type { HomepageProduct } from "@/features/homepage/homepage.types";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { ChevronLeft, ChevronRight } from "lucide-react";

import "swiper/css";

interface ProductCarouselProps {
  products: HomepageProduct[];
  placeholderImage: string;
  isLoading?: boolean;
}

const SKELETON_COUNT = 6; // max visible at xl breakpoint

/** Skeleton card width matches Swiper breakpoints (1.2 → 2 → 3 → 4 → 5 → 6 per view) */
const skeletonCardClass =
  "min-w-0 shrink-0 basis-[calc((100%-12px)/1.2)] min-[480px]:basis-[calc((100%-14px)/2)] sm:basis-[calc((100%-32px)/3)] md:basis-[calc((100%-48px)/4)] lg:basis-[calc((100%-80px)/5)] xl:basis-[calc((100%-120px)/6)]";

function CarouselSkeleton() {
  return (
    <div className="flex overflow-hidden py-2 gap-3 min-[480px]:gap-[14px] sm:gap-4 md:gap-4 lg:gap-5 xl:gap-6">
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <div key={i} className={skeletonCardClass}>
          <div className="aspect-square w-full rounded-xl bg-muted/70" />
          <div className="mt-3 h-3 w-[80%] rounded bg-muted/70" />
          <div className="mt-2 h-3 w-1/2 rounded bg-muted/70" />
        </div>
      ))}
    </div>
  );
}

const breakpoints = {
  // 1.2 cards peeking on small mobile
  320: { slidesPerView: 1.2, spaceBetween: 12 },
  // 2 cards on small
  480: { slidesPerView: 2, spaceBetween: 14 },
  // 3 on tablet
  640: { slidesPerView: 3, spaceBetween: 16 },
  // 4 on md
  768: { slidesPerView: 4, spaceBetween: 16 },
  // 5 on lg
  1024: { slidesPerView: 5, spaceBetween: 20 },
  // 6 in view on xl
  1280: { slidesPerView: 6, spaceBetween: 24 },
};

export function ProductCarousel({
  products,
  placeholderImage,
  isLoading = false,
}: ProductCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer Swiper render to next frame so slide width is set before first paint (avoids image flash)
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Skeleton when API is still loading or before Swiper has mounted
  if (isLoading || !mounted) {
    return <CarouselSkeleton />;
  }

  if (products.length === 0) return null;

  return (
    <div className="relative group">
      <Swiper
        spaceBetween={24}
        slidesPerView={1.2}
        breakpoints={breakpoints}
        className="py-2 px-1"
        onSwiper={swiper => {
          swiperRef.current = swiper;
          setIsBeginning(swiper.isBeginning);
          setIsEnd(swiper.isEnd);
        }}
        onSlideChange={swiper => {
          setIsBeginning(swiper.isBeginning);
          setIsEnd(swiper.isEnd);
        }}
      >
        {products.map(product => (
          <SwiperSlide key={product._id} className="!h-auto">
            <ProductCard
              product={{
                ...product,
                thumbnail: product.thumbnail || placeholderImage,
              }}
              className="h-full"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <button
        type="button"
        onClick={() => swiperRef.current?.slidePrev()}
        disabled={isBeginning}
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-2 rounded-full border border-border bg-card p-2 shadow-md transition-opacity hover:scale-105 disabled:pointer-events-none disabled:opacity-40 md:-translate-x-4"
        aria-label="Xem trước"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => swiperRef.current?.slideNext()}
        disabled={isEnd}
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-2 rounded-full border border-border bg-card p-2 shadow-md transition-opacity hover:scale-105 disabled:pointer-events-none disabled:opacity-40 md:translate-x-4"
        aria-label="Xem tiếp"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
