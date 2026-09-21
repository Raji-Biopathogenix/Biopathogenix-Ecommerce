import LoginForm from "@/components/my-account/LoginForm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
 
export default async function MyAccountPage({ searchParams }: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  // Only allow internal order destinations after sign-in.
  const returnTo = typeof next === "string" && /^\/orders\/\d+\/(packing-slip|edit)$/.test(next)
    ? next : undefined;
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  // ✅ If logged in → show dashboard but KEEP URL as /my-account
  if (token && !returnTo) {
    redirect("/my-account/dashboard");
  }

  // ❌ Not logged in → show login
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm returnTo={returnTo} />
    </div>
  );
}
