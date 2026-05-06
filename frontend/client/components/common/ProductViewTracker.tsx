"use client";

import * as React from "react";

import { recordProductView } from "@/features/product/product.api";
import { PRODUCT_VIEWER_ID_STORAGE_KEY } from "@/lib/constants";

export interface ProductViewTrackerProps {
  productId: string;
}

/**
 * POST /products/:id/views on each visit: runs when the component mounts and whenever `productId`
 * changes (no ref gate — a previous `sentRef` blocked new requests after navigating to another product).
 * Provides a stable `viewerId` in localStorage for backend dedupe when PRODUCT_VIEW_PREVENT_DUPLICATE is enabled.
 */
export function ProductViewTracker({ productId }: ProductViewTrackerProps) {
  React.useEffect(() => {
    let viewerId: string | undefined;
    try {
      let id = localStorage.getItem(PRODUCT_VIEWER_ID_STORAGE_KEY);
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(PRODUCT_VIEWER_ID_STORAGE_KEY, id);
      }
      viewerId = id;
    } catch {
      viewerId = undefined;
    }

    recordProductView(productId, viewerId ? { viewerId } : undefined);
  }, [productId]);

  return null;
}
