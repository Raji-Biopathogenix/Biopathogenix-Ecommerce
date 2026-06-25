'use client';
import { usePathname, useParams, useSearchParams } from "next/navigation"
import Link from "next/link";
import PaginationButton from "@/components/common/PaginationButton";

export default function Pagination({
  currentPage,
  totalPages,
  count,
  slug,
  orderBy,
  search_text,
  category,
  labelVal ="Products",
}: { currentPage: number; totalPages: number; count: number; slug?: string ;orderBy?:string; search_text?: string,category?: string,labelVal?:string }) {

  const pathname = usePathname()      
  // const params = useParams()          
  const searchParams = useSearchParams()

  // console.log(pathname)
  // console.log(params.slug)
  // console.log(searchParams.get("page"))

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (orderBy) params.set('orderBy', orderBy);
    if (search_text) params.set('search_text', search_text);
    if (category) params.set('category', category);
    return `${pathname}?${params.toString()}`;
  };

  return (
    <>
      <div className="flex items-center justify-center gap-1 mt-10">

        <PaginationButton
          href={buildHref(1)}
          disabled={currentPage === 1}
        >
          «
        </PaginationButton>

        <PaginationButton
          href={buildHref(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ‹
        </PaginationButton>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Link
            key={page}
            href={buildHref(page)}
            className={`px-3 py-1 border rounded text-sm ${currentPage === page
                ? "bg-[#0A2E59] text-white border-[#0A2E59]"
                : "hover:bg-gray-100 text-gray-700"
              }`}

              
          >
            {page}
          </Link>
        ))}

        <PaginationButton
          href={buildHref(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          ›
        </PaginationButton>

        <PaginationButton
          href={buildHref(totalPages)}
          disabled={currentPage === totalPages}
        >
          »
        </PaginationButton>

      </div>

      <p className="text-center text-sm text-gray-500 mt-3">
        Page {currentPage} of {totalPages} — {count} {labelVal}
      </p>

    </>
  );
}   