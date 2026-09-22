import { myRepositoriesPreview } from "@/lib/dashboard-preview";

const ownSlugs = new Set<string>(myRepositoriesPreview.map(repository => repository.slug));

export function isProtectedDemoRoute(pathname: string) {
  if (pathname === "/check-repository") return true;
  if (pathname === "/my-repositories" || pathname.startsWith("/my-repositories/")) return true;
  const [, section, id, extra] = pathname.split("/");
  if (extra || !id) return false;
  if (section === "repositories") return ownSlugs.has(id);
  if (section === "analyses") return id.endsWith("-demo") && ownSlugs.has(id.slice(0, -5));
  return false;
}

export function safeDemoReturnPath(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && isProtectedDemoRoute(value)
    ? value
    : "/my-repositories";
}
