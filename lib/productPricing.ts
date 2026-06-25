type CustomPriceData = {
  price?: number | string | null;
} | null | undefined;

type ProductPricingSource = {
  price?: number | string | null;
  compare_price?: number | string | null;
  discount_value?: number | string | null;
  prd_customization_prices?: CustomPriceData;
};

export type ProductPricingData = {
  effectivePrice: number;
  originalPrice: number | null;
  discountPercent: number;
};

function normalizePrice(value?: number | string | null): number | null {
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
}

export function getProductPricingData(product: ProductPricingSource): ProductPricingData {
  const customPrice = normalizePrice(product.prd_customization_prices?.price);
  const basePrice = customPrice && customPrice > 0
    ? customPrice
    : (normalizePrice(product.price) ?? 0);
  const comparePrice = normalizePrice(product.compare_price);
  const discountValue = normalizePrice(product.discount_value) ?? 0;

  let effectivePrice = basePrice;
  let originalPrice: number | null = comparePrice && comparePrice > basePrice ? comparePrice : null;

  if (discountValue > 0) {
    originalPrice = basePrice;
    effectivePrice = Math.max(0, basePrice * (100 - discountValue) / 100);
  }

  if (originalPrice !== null && effectivePrice >= originalPrice) {
    originalPrice = null;
  }

  const roundedEffective = Number(effectivePrice.toFixed(2));
  const roundedOriginal = originalPrice !== null ? Number(originalPrice.toFixed(2)) : null;
  const discountPercent = roundedOriginal && roundedOriginal > roundedEffective
    ? Math.round(((roundedOriginal - roundedEffective) / roundedOriginal) * 100)
    : 0;

  return {
    effectivePrice: roundedEffective,
    originalPrice: roundedOriginal,
    discountPercent,
  };
}

export function getEffectiveProductPrice(product: ProductPricingSource): number {
  return getProductPricingData(product).effectivePrice;
}
