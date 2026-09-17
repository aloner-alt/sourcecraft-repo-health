"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RepositoryInput() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  return <section className="mt-7 rounded-xl border border-border bg-card p-5 sm:p-6">
    <form onSubmit={event => {
      event.preventDefault();
      try {
        const parsed = new URL(url.trim());
        if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname === "/") throw new Error("invalid");
        setMessage("Ссылка имеет корректный формат. Реальная проверка пока недоступна: backend не подключён. Данные никуда не отправлены.");
      } catch { setMessage("Укажите полную ссылку на репозиторий, начиная с https://. Не вставляйте токены или пароли."); }
    }}>
      <label className="text-sm font-medium" htmlFor="repository-url">Ссылка на репозиторий</label>
      <input className="mt-3 block h-12 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-base text-foreground" id="repository-url" type="url" required value={url} onChange={event => { setUrl(event.target.value); setMessage(""); }} placeholder="https://…/owner/repository" autoComplete="off" aria-describedby="repository-input-note repository-input-message" />
      <p id="repository-input-note" className="mt-3 text-sm leading-6 text-muted-foreground">Пока это предварительная форма, а не работающий анализ. Для закрытых репозиториев потребуется авторизация. Не добавляйте секреты в ссылку.</p>
      <Button className="mt-5" size="lg" type="submit">Проверить формат ссылки</Button>
      <p id="repository-input-message" role="status" className="mt-4 text-sm leading-6">{message}</p>
    </form>
    <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5"><Button variant="outline" render={<Link href="/repositories/api-gateway" />}>Посмотреть демо-результат</Button></div>
  </section>;
}
