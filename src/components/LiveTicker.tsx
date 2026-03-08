import { useSocketSimulator } from "@/hooks/useSocketSimulator";

export default function LiveTicker() {
  const { liveFeed } = useSocketSimulator();

  const emissionTickerItems = [
    { text: "Delhi Industrial — CO2e 13,695 μg/m³ — VIOLATION", type: "flagged" },
    { text: "Blockchain TX OUXORCLW... anchored — Score 25", type: "blockchain" },
    { text: "Kolkata anomaly detected — 3x normal level", type: "flagged" },
    { text: "47 active WHO violations across 188 cities", type: "verified" },
    { text: "LSTM forecast: Delhi PM2.5 reaches 109 μg/m³ in 90d", type: "score_change" },
    { text: "Mumbai Transport verified — Score 42 WARNING", type: "score_change" },
    { text: "3,241 records anchored on Algorand blockchain", type: "blockchain" },
    { text: "Chennai Energy compliant — Score 71 CLEAN", type: "verified" },
    { text: "OpenAQ: 1,247 readings ingested in last hour", type: "verified" },
    { text: "NASA GEOS-CF: Satellite data verified ✓", type: "verified" },
  ];

  const getDot = (type: string) => {
    switch (type) {
      case "verified": return "🔵";
      case "flagged": return "🔴";
      case "blockchain": return "🟣";
      case "score_change": return "🔵";
      default: return "🔵";
    }
  };

  const tickerText = emissionTickerItems.map((f) => `${getDot(f.type)} ${f.text}`).join(" · ");
  const doubled = tickerText + " · " + tickerText;

  return (
    <div className="ticker-bg text-primary-foreground h-9 flex items-center overflow-hidden z-50 relative">
      <div className="animate-ticker whitespace-nowrap flex items-center text-xs font-mono text-white tracking-wide">
        <span className="px-4">{doubled}</span>
      </div>
    </div>
  );
}
