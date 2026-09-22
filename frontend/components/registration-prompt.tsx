"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoAccount } from "@/lib/demo-auth";

export function RegistrationPrompt({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const { status, setStatus } = useDemoAccount();
  const registered = status === "registered";
  const checkingRepository = nextPath === "/check-repository";

  const continueToSection = () => {
    if (!registered) setStatus("registered");
    router.replace(nextPath);
  };

  return <main className="mx-auto flex min-h-[75vh] max-w-2xl items-center px-5 py-12 sm:px-8">
    <section className="w-full rounded-2xl border border-border bg-card p-7 shadow-sm sm:p-10" aria-labelledby="registration-title">
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-accent text-primary"><LockKeyhole aria-hidden="true" size={24} /></span>
      <p className="mt-7 text-sm font-medium text-primary">Личный раздел</p>
      <h1 id="registration-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{registered ? "Демо-аккаунт включён" : "Зарегистрируйтесь, чтобы продолжить"}</h1>
      <p className="mt-4 leading-7 text-muted-foreground">{registered
        ? checkingRepository ? "Теперь можно открыть форму проверки репозитория." : "Теперь можно открыть список личных репозиториев и их обзоры."
        : checkingRepository ? "Пока вы не можете проверить свой репозиторий. Зарегистрируйтесь, чтобы разблокировать эту функцию." : "Пока вы не можете пользоваться личными репозиториями и обзорами. Зарегистрируйтесь, чтобы разблокировать эти функции."}</p>
      <div className="mt-6 rounded-xl border border-border bg-accent/50 p-4 text-sm leading-6 text-muted-foreground">
        Регистрация и вход через Я ID ещё не подключены. Для проверки интерфейса включите демо-аккаунт. Это не создаёт настоящую учётную запись и не подключает ваши репозитории.
      </div>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button size="lg" type="button" onClick={continueToSection} disabled={status === "loading"}>{registered ? "Перейти в раздел" : "Включить демо-аккаунт"}<ArrowRight aria-hidden="true" className="size-4" /></Button>
        <Button size="lg" variant="outline" render={<Link href="/" />}>На главную</Button>
      </div>
    </section>
  </main>;
}
