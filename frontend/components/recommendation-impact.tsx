export function RecommendationImpact({ gain }: { gain: number | null }) {
  const available = gain !== null && Number.isFinite(gain) && gain >= 0 && gain <= 100;
  return <span className="recommendation-impact"><span>Ожидаемый прирост Repo Health Score</span><strong>{available ? `≈ +${gain.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} пт.` : "Пока не рассчитан"}</strong></span>;
}
