import { connection } from "next/server";
import { RankingClient } from "@/components/ranking-client";
import { getRanking } from "@/lib/api";

export default async function RankingPage() {
  await connection();
  const ranking = await getRanking();
  return <RankingClient initialRepositories={ranking.items} />;
}
