"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoAccount } from "@/lib/demo-auth";

export function CheckRepositoryButton({ className }: { className?: string }) {
  const { status } = useDemoAccount();
  const href = status === "registered" ? "/check-repository" : "/register?next=%2Fcheck-repository";

  return <Button className={className} size="lg" render={<Link href={href} />}>
    Проверить свой репозиторий <ArrowRight className="size-4" />
  </Button>;
}
