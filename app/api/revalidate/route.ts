import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get('slug');
  const categorySlug = request.nextUrl.searchParams.get('category');
  const subCategorySlug = request.nextUrl.searchParams.get('sub_category');

  try {
    if (slug) {
      revalidatePath(`/product-detail/${slug}`);
    }
    if (categorySlug && subCategorySlug && slug) {
      revalidatePath(`/${categorySlug}/${subCategorySlug}/${slug}`);
    }
    if (categorySlug && subCategorySlug) {
      revalidatePath(`/${categorySlug}/${subCategorySlug}`);
    }
    if (categorySlug) {
      revalidatePath(`/${categorySlug}`);
    }

    return NextResponse.json({ revalidated: true, slug, categorySlug, subCategorySlug });
  } catch (err) {
    return NextResponse.json({ error: 'Revalidation failed', detail: String(err) }, { status: 500 });
  }
}
