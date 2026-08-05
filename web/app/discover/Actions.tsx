"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface Props {
  action: "scan" | "favorite" | "skip";
  oppId?: string;
  repo?: string;
  isFav?: boolean;
  label?: string;
}

export default function OpportunityActions({ action, oppId, repo, isFav, label }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handle() {
    if (action === "scan") {
      await fetch("/api/scan", { method: "POST" });
      startTransition(() => router.refresh());
      return;
    }
    await fetch("/api/opportunity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: oppId, repo, action }),
    });
    startTransition(() => router.refresh());
  }

  if (action === "scan") {
    return (
      <button
        onClick={handle}
        disabled={pending}
        className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
      >
        {pending ? "Scanning..." : label || "Scan Now"}
      </button>
    );
  }

  if (action === "favorite") {
    return (
      <button
        onClick={handle}
        disabled={pending}
        title={isFav ? "Remove from favorites" : "Add to favorites"}
        className={`text-[14px] leading-none transition-colors ${isFav ? "text-yellow-400 hover:text-gray-400" : "text-gray-300 hover:text-yellow-400"}`}
      >
        {isFav ? "★" : "☆"}
      </button>
    );
  }

  if (action === "skip") {
    return (
      <button
        onClick={handle}
        disabled={pending}
        title="Skip this opportunity"
        className="text-[10px] text-gray-400 hover:text-red-500 transition-colors font-medium shrink-0"
      >
        {pending ? "..." : "skip"}
      </button>
    );
  }

  return null;
}
