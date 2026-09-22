import type { Metadata } from "next";
import { RegistrationPrompt } from "@/components/registration-prompt";
import { safeDemoReturnPath } from "@/lib/demo-access";

export const metadata: Metadata = { title: "Регистрация — SourceCraft Repo Health" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { next } = await searchParams;
  return <RegistrationPrompt nextPath={safeDemoReturnPath(next)} />;
}
