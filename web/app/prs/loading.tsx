export default function Loading() {
  return (
    <main
      className="min-h-screen bg-[#f6f8fa] text-[#1f2328]"
      style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}
    >
      <div className="max-w-[900px] mx-auto px-5 py-7">
        <div className="mb-4">
          <div className="h-9 w-16 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="flex gap-2 mb-6">
          {[1, 2].map((i) => (
            <div key={i} className="flex-1 h-20 rounded-[10px] bg-gray-200 animate-pulse" />
          ))}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm h-32 animate-pulse" />
      </div>
    </main>
  );
}
