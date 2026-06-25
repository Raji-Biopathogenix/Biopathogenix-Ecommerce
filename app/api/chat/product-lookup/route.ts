import { NextResponse } from "next/server";

const DEFAULT_BACKEND_BASE = "http://127.0.0.1:8000/api";
const MIN_MATCH_SCORE = 140;
const MIN_DOCUMENT_MATCH_SCORE = 120;
const MIN_TAB_MATCH_SCORE = 170;
// const MAX_PRODUCTS = 250;
// const LOOKUP_REQUEST_TIMEOUT_MS = 2200;
const LOOKUP_REQUEST_TIMEOUT_MS = 5000;
const INTENT_STOP_WORDS = new Set([
  "a",
  "an",
  "am",
  "any",
  "are",
  "buy",
  "can",
  "could",
  "do",
  "for",
  "find",
  "from",
  "get",
  "give",
  "have",
  "help",
  "i",
  "im",
  "in",
  "is",
  "item",
  "items",
  "kit",
  "kits",
  "looking",
  "me",
  "my",
  "need",
  "of",
  "please",
  "product",
  "products",
  "reagent",
  "reagents",
  "search",
  "searching",
  "show",
  "sub",
  "subcategory",
  "subcategories",
  "tab",
  "tabs",
  "the",
  "to",
  "want",
  "with",
  "category",
  "categories",
]);

type ProductRecord = {
  id?: number;
  name?: string;
  slug?: string;
  parent_category_slug?: string;
  sub_category_slug?: string;
  category_slug?: string;
};

type DocumentRecord = {
  id?: number;
  title?: string;
  file_url?: string | null;
  section?: string;
  sku_code?: string;
};

type ProductLookupPayload = {
  query?: string;
};

type HeaderSubCategoryRecord = {
  name?: string;
  slug?: string;
};

type HeaderCategoryRecord = {
  name?: string;
  slug?: string;
  sub_categories?: HeaderSubCategoryRecord[];
};

type HeaderMenuRecord = {
  category?: HeaderCategoryRecord;
};

type TabMatch = {
  targetType: "category" | "subcategory";
  href: string;
  score: number;
  categoryName: string;
  categorySlug: string;
  subCategoryName?: string;
  subCategorySlug?: string;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function toSlug(value: string) {
  return normalize(value).replace(/\s+/g, "-");
}

function toTokens(value: string) {
  return normalize(value).split(" ").filter(Boolean);
}

function getLookupTokens(query: string) {
  const baseTokens = toTokens(query).filter((token) => token.length > 1);
  const cleaned = baseTokens.filter((token) => !INTENT_STOP_WORDS.has(token));
  return cleaned.length > 0 ? cleaned : baseTokens;
}

function getLookupQuery(query: string) {
  const tokens = getLookupTokens(query);
  return tokens.join(" ").trim() || normalize(query);
}

function getFileName(fileUrl: string) {
  try {
    const url = new URL(fileUrl);
    return url.pathname.split("/").pop() ?? "";
  } catch {
    return fileUrl.split("/").pop() ?? "";
  }
}

function getFileSlug(fileUrl: string) {
  const fileName = getFileName(fileUrl).replace(/\.[a-z0-9]+$/i, "");
  return toSlug(fileName);
}

function isDocumentIntent(query: string) {
  return /(document|documents|doc|docs|sds|ifu|manual|pdf|certificate|coa|msds|sheet)/i.test(query);
}

function encodePathSegment(value: string) {
  return encodeURIComponent(value);
}

function toProductHref(product: ProductRecord) {
  if (!product.slug) return null;
  if (product.parent_category_slug && product.sub_category_slug) {
    return `/${encodePathSegment(product.parent_category_slug)}/${encodePathSegment(product.sub_category_slug)}/${encodePathSegment(product.slug)}`;
  }
  return `/product-detail/${encodePathSegment(product.slug)}`;
}

function extractProducts(payload: unknown): ProductRecord[] {
  if (!payload || typeof payload !== "object") return [];

  const data = payload as {
    items?: unknown;
    result?: unknown;
  };

  if (Array.isArray(data.items)) {
    return data.items as ProductRecord[];
  }

  if (data.result && typeof data.result === "object") {
    const result = data.result as { data?: unknown };
    if (Array.isArray(result.data)) {
      return result.data as ProductRecord[];
    }
  }

  if (Array.isArray(data.result)) {
    return data.result as ProductRecord[];
  }

  return [];
}

function extractDocuments(payload: unknown): DocumentRecord[] {
  if (!payload || typeof payload !== "object") return [];

  const data = payload as {
    result?: unknown;
    documents?: unknown;
  };

  if (Array.isArray(data.documents)) {
    return data.documents as DocumentRecord[];
  }

  if (data.result && typeof data.result === "object") {
    const result = data.result as {
      data?: { documents?: unknown };
      documents?: unknown;
    };

    if (result.data && typeof result.data === "object" && Array.isArray(result.data.documents)) {
      return result.data.documents as DocumentRecord[];
    }

    if (Array.isArray(result.documents)) {
      return result.documents as DocumentRecord[];
    }
  }

  return [];
}

function scoreProduct(product: ProductRecord, query: string) {
  const name = normalize(product.name ?? "");
  const slug = normalize(product.slug ?? "");
  const queryNorm = getLookupQuery(query);
  const querySlug = toSlug(queryNorm || query);
  const tokens = getLookupTokens(query);

  let score = 0;

  if (!name && !slug) return 0;
  if (queryNorm && (name === queryNorm || slug === querySlug)) score += 300;
  if (queryNorm && (name.includes(queryNorm) || slug.includes(queryNorm) || slug.includes(querySlug))) score += 180;

  const tokenMatches = tokens.filter((token) => name.includes(token) || slug.includes(token)).length;
  score += tokenMatches * 20;

  if (tokens.length > 1 && tokenMatches === tokens.length) {
    score += 120;
  }

  return score;
}

function scoreTabLabel(label: string, query: string) {
  const labelNorm = normalize(label);
  const queryNorm = getLookupQuery(query);
  const queryTokens = getLookupTokens(query);

  let score = 0;

  if (!labelNorm || !queryNorm) return 0;
  if (labelNorm === queryNorm) score += 320;
  if (labelNorm.includes(queryNorm)) score += 200;
  if (labelNorm.startsWith(queryNorm)) score += 80;

  const labelTokens = labelNorm.split(" ");
  const tokenMatches = queryTokens.filter((token) => labelNorm.includes(token)).length;
  score += tokenMatches * 24;

  if (queryTokens.length > 1 && tokenMatches === queryTokens.length) {
    score += 120;
  }

  // bonus when every query token matches the start of a label token (e.g. "valid" → "validation")
  const prefixMatches = queryTokens.filter((token) =>
    labelTokens.some((lt) => lt.startsWith(token))
  ).length;
  if (prefixMatches === queryTokens.length) score += 60;

  return score;
}

function scoreDocument(document: DocumentRecord, product: ProductRecord, query: string) {
  if (!document.file_url) return 0;

  const queryNorm = getLookupQuery(query);
  const querySlug = toSlug(queryNorm || query);
  const queryTokens = getLookupTokens(query);

  const titleNorm = normalize(document.title ?? "");
  const sectionNorm = normalize(document.section ?? "");
  const fileSlugNorm = normalize(getFileSlug(document.file_url));
  const productNameNorm = normalize(product.name ?? "");
  const productSlugNorm = normalize(product.slug ?? "");

  let score = 0;

  if (
    titleNorm === queryNorm ||
    fileSlugNorm === querySlug ||
    sectionNorm === queryNorm
  ) {
    score += 280;
  }

  if (
    titleNorm.includes(queryNorm) ||
    fileSlugNorm.includes(queryNorm) ||
    fileSlugNorm.includes(querySlug) ||
    sectionNorm.includes(queryNorm)
  ) {
    score += 160;
  }

  const tokenMatches = queryTokens.filter((token) => {
    return (
      titleNorm.includes(token) ||
      fileSlugNorm.includes(token) ||
      sectionNorm.includes(token) ||
      productNameNorm.includes(token) ||
      productSlugNorm.includes(token)
    );
  }).length;
  score += tokenMatches * 22;

  if (queryTokens.includes("sds") && sectionNorm.includes("sds")) score += 120;
  if (queryTokens.includes("ifu") && sectionNorm.includes("ifu")) score += 120;

  return score;
}

async function fetchProducts(backendBase: string, query: string) {
  // OLD CODE — called heavy list endpoint, returned full product data (images, variants, SKUs) — slow, caused timeout
  // const withSearchUrl = `${backendBase}/v1/products/?page_size=${MAX_PRODUCTS}&search=${encodeURIComponent(query)}`;
  // const fallbackUrl = `${backendBase}/v1/products/?page_size=${MAX_PRODUCTS}`;
  // const first = await fetchWithTimeout(withSearchUrl, { cache: "no-store" });
  // if (first?.ok) {
  //   const firstData = await first.json();
  //   const firstProducts = extractProducts(firstData);
  //   if (firstProducts.length > 0) return firstProducts; // stopped here — MRSA never found if other products returned first
  // }
  // const second = await fetchWithTimeout(fallbackUrl, { cache: "no-store" });
  // if (!second?.ok) return [];
  // const secondData = await second.json();
  // return extractProducts(secondData);

  // NEW CODE — uses lightweight chat-lookup endpoint (name + slug only), runs both in parallel and merges
  const searchUrl = `${backendBase}/v1/products/chat-lookup/?search=${encodeURIComponent(query)}`;
  const fallbackUrl = `${backendBase}/v1/products/chat-lookup/`;

  const [first, second] = await Promise.all([
    fetchWithTimeout(searchUrl, { cache: "no-store" }),
    fetchWithTimeout(fallbackUrl, { cache: "no-store" }),
  ]);

  const searchProducts = first?.ok ? extractProducts(await first.json()) : [];
  const allProducts = second?.ok ? extractProducts(await second.json()) : [];

  const seen = new Set<string>();
  const merged: ProductRecord[] = [];
  for (const p of [...searchProducts, ...allProducts]) {
    const key = String(p.id ?? p.slug ?? "");
    if (key && !seen.has(key)) {
      seen.add(key);
      merged.push(p);
    }
  }
  return merged;
}

async function fetchDocumentsForProduct(backendBase: string, productSlug: string) {
  const url = `${backendBase}/v1/product_detail?slug=${encodeURIComponent(productSlug)}`;
  const response = await fetchWithTimeout(url, { cache: "no-store" });
  if (!response?.ok) return [];

  const payload = await response.json();
  return extractDocuments(payload);
}

function extractHeaderMenus(payload: unknown): HeaderMenuRecord[] {
  if (!payload || typeof payload !== "object") return [];

  const data = payload as {
    result?: { data?: unknown };
    data?: unknown;
    items?: unknown;
  };

  if (data.result && typeof data.result === "object") {
    const result = data.result as { data?: unknown };
    if (Array.isArray(result.data)) {
      return result.data as HeaderMenuRecord[];
    }
  }

  if (Array.isArray(data.data)) {
    return data.data as HeaderMenuRecord[];
  }

  if (Array.isArray(data.items)) {
    return data.items as HeaderMenuRecord[];
  }

  return [];
}

async function fetchHeaderMenus(backendBase: string) {
  const url = `${backendBase}/v1/headermenu/`;
  const response = await fetchWithTimeout(url, { cache: "no-store" });
  if (!response?.ok) return [];

  const payload = await response.json();
  return extractHeaderMenus(payload);
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOOKUP_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function findBestTabMatch(menus: HeaderMenuRecord[], query: string): TabMatch | null {
  const candidates: TabMatch[] = [];

  for (const menu of menus) {
    const category = menu.category;
    if (!category?.slug) continue;

    const categoryName = category.name ?? category.slug;
    const categorySlug = category.slug;
    const categoryHref = `/${encodePathSegment(categorySlug)}`;
    const categoryScore = Math.max(
      scoreTabLabel(categoryName, query),
      scoreTabLabel(categorySlug, query)
    );

    if (categoryScore > 0) {
      candidates.push({
        targetType: "category",
        href: categoryHref,
        score: categoryScore,
        categoryName,
        categorySlug,
      });
    }

    for (const subCategory of category.sub_categories ?? []) {
      if (!subCategory?.slug) continue;

      const subCategoryName = subCategory.name ?? subCategory.slug;
      const subCategorySlug = subCategory.slug;
      const subCategoryHref = `/${encodePathSegment(categorySlug)}/${encodePathSegment(subCategorySlug)}`;
      const subCategoryScore = Math.max(
        scoreTabLabel(subCategoryName, query),
        scoreTabLabel(subCategorySlug, query),
        scoreTabLabel(`${categoryName} ${subCategoryName}`, query),
        scoreTabLabel(`${categorySlug} ${subCategorySlug}`, query)
      );

      if (subCategoryScore > 0) {
        candidates.push({
          targetType: "subcategory",
          href: subCategoryHref,
          score: subCategoryScore,
          categoryName,
          categorySlug,
          subCategoryName,
          subCategorySlug,
        });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] ?? null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProductLookupPayload;
    const query = (body.query ?? "").trim();

    if (!query) {
      return NextResponse.json({ matched: false }, { status: 400 });
    }

    const backendBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BACKEND_BASE).replace(/\/+$/, "");
    const lookupQuery = getLookupQuery(query);
    const [products, menus] = await Promise.all([
      fetchProducts(backendBase, lookupQuery || query),
      fetchHeaderMenus(backendBase),
    ]);

    const ranked = products
      .map((product) => ({ product, score: scoreProduct(product, lookupQuery || query) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    const bestTabMatch = findBestTabMatch(menus, lookupQuery || query);

    if (isDocumentIntent(query)) {
      const topProducts = ranked
        .map((entry) => entry.product)
        .filter((product): product is ProductRecord & { slug: string } => Boolean(product.slug))
        .slice(0, 5);

      const documentCandidates: Array<{
        product: ProductRecord;
        document: DocumentRecord;
        score: number;
      }> = [];

      const productDocuments = await Promise.all(
        topProducts.map(async (product) => ({
          product,
          documents: await fetchDocumentsForProduct(backendBase, product.slug),
        }))
      );

      for (const { product, documents } of productDocuments) {
        for (const document of documents) {
          const score = scoreDocument(document, product, lookupQuery || query);
          if (score > 0) {
            documentCandidates.push({ product, document, score });
          }
        }
      }

      documentCandidates.sort((a, b) => b.score - a.score);
      const bestDocument = documentCandidates[0];

      if (bestDocument && bestDocument.score >= MIN_DOCUMENT_MATCH_SCORE && bestDocument.document.file_url) {
        return NextResponse.json({
          matched: true,
          targetType: "document",
          href: bestDocument.document.file_url,
          product: {
            id: bestDocument.product.id ?? null,
            name: bestDocument.product.name ?? null,
            slug: bestDocument.product.slug ?? null,
          },
          document: {
            id: bestDocument.document.id ?? null,
            title: bestDocument.document.title ?? null,
            section: bestDocument.document.section ?? null,
          },
        });
      }
    }

    const bestEntry = ranked[0];
    const bestProductScore = bestEntry?.score ?? 0;

    if (
      bestTabMatch &&
      bestTabMatch.score >= MIN_TAB_MATCH_SCORE &&
      (bestProductScore < MIN_MATCH_SCORE || bestTabMatch.score >= bestProductScore + 40)
    ) {
      return NextResponse.json({
        matched: true,
        targetType: bestTabMatch.targetType,
        href: bestTabMatch.href,
        category: {
          name: bestTabMatch.categoryName,
          slug: bestTabMatch.categorySlug,
        },
        subCategory: bestTabMatch.subCategorySlug
          ? {
              name: bestTabMatch.subCategoryName ?? null,
              slug: bestTabMatch.subCategorySlug,
            }
          : null,
      });
    }

    if (!bestEntry || bestEntry.score < MIN_MATCH_SCORE) {
      return NextResponse.json({ matched: false });
    }

    const best = bestEntry.product;
    const href = best ? toProductHref(best) : null;

    if (!best || !href) {
      return NextResponse.json({ matched: false });
    }

    return NextResponse.json({
      matched: true,
      targetType: "product",
      href,
      product: {
        id: best.id ?? null,
        name: best.name ?? null,
        slug: best.slug ?? null,
      },
    });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ matched: false, error: "Product lookup failed", detail }, { status: 500 });
  }
}
