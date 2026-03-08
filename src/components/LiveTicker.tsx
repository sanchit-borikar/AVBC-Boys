import { useSocketSimulator } from "@/hooks/useSocketSimulator";

export default function LiveTicker() {
  const { liveFeed } = useSocketSimulator();

  const getDot = (type: string) => {
    switch (type) {
      case "verified": return "🔵";
      case "flagged": return "🔴";
      case "blockchain": return "🟣";
      case "score_change": return "🔵";
      default: return "🔵";
    }
  };

  const tickerText = liveFeed.slice(0, 15).map((f) => `${getDot(f.type)} ${f.text}`).join(" · ");
  const doubled = tickerText + " · " + tickerText;

  return (
    <div className="ticker-bg text-primary-foreground h-9 flex items-center overflow-hidden z-50 relative">
      <div className="animate-ticker whitespace-nowrap flex items-center text-xs font-mono text-white tracking-wide">
        <span className="px-4">{doubled}</span>
      </div>
    </div>
  );
}
