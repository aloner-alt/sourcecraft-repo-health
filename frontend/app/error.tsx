"use client";

import { ErrorState } from "@/components/page-state";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="min-h-screen"><ErrorState reset={reset} /></div>; }
