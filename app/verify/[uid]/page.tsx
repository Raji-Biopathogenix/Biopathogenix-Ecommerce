import { API_BASE_URL } from "@/config/env";
import VerificationMail from '@/components/Verification/verify_mail';

export interface VerificationStatus {
  status: string
  message: string
  result: {
    is_verified?: boolean
    first_name?: string
    last_name?: string
    status?: boolean
  } | null
}




async function verifyUser(uid: string): Promise<VerificationStatus | null> {
  const res = await fetch(`${API_BASE_URL}/v1/verify-user/?uid=${uid}`, {
    // next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const response: VerificationStatus = await res.json();
  return response ?? null;
}


export default async function CategoryPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const response = await verifyUser(uid);
  const message =
    response?.message ??
    "We could not validate this verification link right now. Please try again or contact support.";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8  min-h-screen">
      <VerificationMail resMsg={message} resultData={response?.result ?? undefined} />
    </div>
  );
}
