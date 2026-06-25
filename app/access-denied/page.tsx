// app/not-access/page.tsx

import Link from "next/link";

export default function NotAccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">

        {/* Big 403 */}
        <h1 className="text-9xl font-extrabold text-gray-200 select-none leading-none">
          403
        </h1>

        {/* Icon */}
        <div className="mt-2 mb-6 flex justify-center">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2m-2 0H10M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
          </span>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-8">
          You don&apos;t have permission to access this page.
          Please contact your administrator or login with an authorized account.
        </p>

        <div className="flex gap-3 justify-center">
       
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}