"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main
      className="min-h-screen bg-[#f6f8fa] flex items-center justify-center"
      style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}
    >
      <div className="text-center text-sm text-gray-500">
        <p className="mb-3 text-red-500 font-medium">Failed to load PR data</p>
        <button
          onClick={reset}
          className="text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
