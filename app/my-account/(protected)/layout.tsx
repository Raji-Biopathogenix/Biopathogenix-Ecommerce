import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SidebarNav from "./SidebarNav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/my-account");
  }

  return (
    <main className="bg-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-[#0B3C5D] mb-12">
          My Account
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Sidebar */}
          <aside className="space-y-3 text-sm font-medium">
            <SidebarNav />
          </aside>

          {/* Page Content */}
          <section className="md:col-span-3 text-[#0B3C5D]">
            {children}
          </section>

        </div>
      </div>
    </main>
  );
}
