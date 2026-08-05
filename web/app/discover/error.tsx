"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-[#f6f8fa] flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-sm mb-3">Failed to load opportunities</div>
        <button onClick={reset} className="text-[12px] text-blue-600 hover:underline">
          Try again
        </button>
      </div>
    </main>
  );
}
