"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type TestPageShellProps = {
  children: ReactNode;
};

export function TestPageShell({ children }: TestPageShellProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="test-home-page min-h-screen overflow-x-hidden bg-background">
      {isLoading ? <TestPageSkeleton /> : children}
    </div>
  );
}

function TestPageSkeleton() {
  return (
    <main className="test-skeleton" aria-busy="true" aria-label="Загрузка тестовой страницы">
      <div aria-hidden="true">
        <section className="test-skeleton-hero">
          <div className="test-skeleton-copy">
            <Skeleton className="h-6 w-40 rounded-full" />
            <div className="mt-7 space-y-3">
              <Skeleton className="h-12 w-[92%]" />
              <Skeleton className="h-12 w-[68%]" />
            </div>
            <div className="mt-7 space-y-3">
              <Skeleton className="h-5 w-[88%]" />
              <Skeleton className="h-5 w-[76%]" />
              <Skeleton className="h-5 w-[48%]" />
            </div>
            <div className="mt-8 flex gap-3">
              <Skeleton className="h-11 w-60" />
              <Skeleton className="h-11 w-44" />
            </div>
            <Skeleton className="mt-5 h-4 w-36" />
            <Skeleton className="mt-8 h-3 w-[70%]" />
          </div>

          <div className="test-skeleton-score">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-6 h-20 w-40" />
            <Skeleton className="mt-5 h-7 w-16 rounded-full" />
            <Skeleton className="mt-5 h-1.5 w-full rounded-full" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[82%]" />
            </div>
            <div className="mt-7 grid grid-cols-3 gap-6 border-t border-border pt-5">
              {[0, 1, 2].map((item) => <div key={item}><Skeleton className="h-3 w-16" /><Skeleton className="mt-2 h-5 w-12" /></div>)}
            </div>
          </div>
        </section>

        <section className="test-skeleton-lower">
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => <SkeletonCard key={item} />)}
          </div>
          <Skeleton className="mt-16 h-4 w-32" />
          <Skeleton className="mt-3 h-9 w-[55%]" />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => <SkeletonCard key={item} tall />)}
          </div>
        </section>
      </div>
    </main>
  );
}

function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <div className={tall ? "test-skeleton-card min-h-44" : "test-skeleton-card"}>
      <Skeleton className="h-6 w-6" />
      <Skeleton className="mt-8 h-5 w-[58%]" />
      <Skeleton className="mt-4 h-4 w-[88%]" />
      <Skeleton className="mt-2 h-4 w-[66%]" />
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`test-skeleton-block rounded-md ${className}`} />;
}
