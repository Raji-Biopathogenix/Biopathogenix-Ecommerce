import { API_BASE_URL } from "@/config/env";

export type NavigationItem = {
  id: number;
  title: string;
  url: string;
  order: number;
  open_in_new_tab?: boolean;
};

export type NavigationGroup = {
  id: number;
  title: string;
  slug: string;
  order: number;
  items: NavigationItem[];
};

export const NAVIGATION_FALLBACK: NavigationGroup[] = [
  {
    id: 1,
    title: "Services",
    slug: "services",
    order: 1,
    items: [
      {
        id: 11,
        title: "Validation Services",
        url: "/services/validation-services",
        order: 1,
        open_in_new_tab: false,
      },
      {
        id: 12,
        title: "Custom Kit Development",
        url: "/services/custom-kit-development",
        order: 2,
        open_in_new_tab: false,
      },
      {
        id: 13,
        title: "Assay Development",
        url: "/services/assay-development",
        order: 3,
        open_in_new_tab: false,
      },
    ],
  },
  {
    id: 2,
    title: "Resources",
    slug: "resources",
    order: 2,
    items: [
      {
        id: 21,
        title: "Blog / Learning Center",
        url: "/resources/blog-learning-center",
        order: 1,
        open_in_new_tab: false,
      },
      {
        id: 22,
        title: "Product Sheets (PDF Hub)",
        url: "/resources/product-sheets",
        order: 2,
        open_in_new_tab: false,
      },
      {
        id: 23,
        title: "Protocols & Guides",
        url: "/resources/protocols-guides",
        order: 3,
        open_in_new_tab: false,
      },
      {
        id: 24,
        title: "FAQs",
        url: "/resources/faqs",
        order: 4,
        open_in_new_tab: false,
      },
      {
        id: 25,
        title: "Webinars / Events / Training",
        url: "/resources/webinars-events-training",
        order: 5,
        open_in_new_tab: false,
      },
    ],
  },
  {
    id: 3,
    title: "About",
    slug: "about",
    order: 3,
    items: [
      {
        id: 31,
        title: "Our Story",
        url: "/about/our-story",
        order: 1,
        open_in_new_tab: false,
      },
      {
        id: 32,
        title: "Manufacturing & Quality",
        url: "/about/manufacturing-quality",
        order: 2,
        open_in_new_tab: false,
      },
      {
        id: 33,
        title: "Leadership / PR",
        url: "/about/leadership-pr",
        order: 3,
        open_in_new_tab: false,
      },
      {
        id: 34,
        title: "Careers",
        url: "/about/careers",
        order: 4,
        open_in_new_tab: false,
      },
      {
        id: 35,
        title: "Contact",
        url: "/contact",
        order: 5,
        open_in_new_tab: false,
      },
    ],
  },
];

export async function fetchNavigationMenu(): Promise<NavigationGroup[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/navigation/`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return NAVIGATION_FALLBACK;
    }

    const payload = (await response.json()) as NavigationGroup[];
    return Array.isArray(payload) && payload.length ? payload : NAVIGATION_FALLBACK;
  } catch {
    return NAVIGATION_FALLBACK;
  }
}
