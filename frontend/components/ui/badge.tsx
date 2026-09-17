import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap", { variants: { variant: { default: "border-primary/30 bg-primary/15 text-primary", secondary: "border-border bg-secondary text-secondary-foreground", warning: "border-amber-300/25 bg-amber-300/10 text-amber-800" } }, defaultVariants: { variant: "default" } });
function Badge({ className, variant, ...props }: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) { return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />; }

export { Badge, badgeVariants };
