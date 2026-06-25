import { fetchJson } from "@/lib/api";

export type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  featured_image_url: string;
  images: Array<{
    id: number;
    image_url: string;
    alt_text: string;
    order: number;
    show_in_gallery: boolean;
  }>;
  image_alt: string;
  published_at: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type BlogPostListResponse = {
  status: string;
  message: string;
  result: {
    data: BlogPost[];
  };
};

type BlogPostDetailResponse = {
  status: string;
  message: string;
  result: {
    data: BlogPost;
  };
};

export async function getBlogPosts() {
  const response = await fetchJson<BlogPostListResponse>("/v1/blog-posts/", {
    next: { revalidate: 300 },
  });
  return response.result.data;
}

export async function getBlogPost(slug: string) {
  const response = await fetchJson<BlogPostDetailResponse>(`/v1/blog-posts/${encodeURIComponent(slug)}/`, {
    next: { revalidate: 300 },
  });
  return response.result.data;
}
