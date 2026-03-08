import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { useSocketSimulator } from "@/hooks/useSocketSimulator";
import { getGradeColor } from "@/data/mockData";
import GradeBadge from "@/components/GradeBadge";
import StatusBadge from "@/components/StatusBadge";
import SectorIcon from "@/components/SectorIcon";
import TrendArrow from "@/components/TrendArrow";
import "leaflet/dist/leaflet.css";

export default function LiveMapPage() {
  const { companies } = useSocketSimulator();
  const navigate = useNavigate();
  const [sectorFilter, setSectorFilter] = useState("All");
  const [lastUpdate, setLastUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setLastUpdate((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { setLastUpdate(0); }, [companies]);

  const filtered = sectorFilter === "All" ? companies : companies.filter((c) => c.sector === sectorFilter);
  const topPolluters = [...companies].sort((a, b) => b.emissions - a.emissions).slice(0, 5);
  const mostImproved = [...companies].filter((c) => c.trend === "down").sort((a, b) => b.trendPct - a.trendPct).slice(0, 5);

  return (
    <div className="flex flex-col lg:flex-row gap-0 -m-4 lg:-m-6 h-[calc(100vh-136px)]">
      {/* Map area */}
      <div className="flex-1 flex flex-col">
        {/* Controls */}
        <div className="bg-card border-b border-dash-border px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2">
            {["All", "Industry", "Transport", "Energy"].map((s) => (
              <div key={s} className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${sectorFilter === s ? "btn-primary-gradient" : "btn-secondary-outline"}`} style={{ cursor: "pointer" }} onClick={() => setSectorFilter(s)}>
                {s === "Industry" ? "🏭 " : s === "Transport" ? "🚗 " : s === "Energy" ? "⚡ " : ""}{s}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
            <span className="text-xs text-muted-foreground">Live · Last update: {lastUpdate}s ago</span>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer center={[20.5, 78.9]} zoom={5} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true} zoomControl={false}>
            <ZoomControl position="bottomright" />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CartoDB</a>' />
            {filtered.map((c) => (
              <CircleMarker key={c.id} center={[c.lat, c.lng]} radius={Math.max(8, Math.log(c.emissions) * 3)} fillColor={getGradeColor(c.grade)} color={getGradeColor(c.grade)} fillOpacity={0.7} weight={1} className="animate-pulse-ring-map">
                <Popup>
                  <div className="p-3 min-w-[240px]">
                    <div className="flex items-center gap-2 mb-2">
                      <SectorIcon sector={c.sector} />
                      <span className="font-display font-bold text-sm text-foreground">{c.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{c.sector} · {c.location}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-muted-foreground">Grade:</span>
                      <GradeBadge score={c.score} size="sm" />
                      <span className="text-xs font-semibold">{c.score}/100</span>
                    </div>
                    <div className="space-y-1 text-xs mb-3">
                      <div className="flex justify-between"><span className="text-muted-foreground">IoT Reading:</span><span className="font-mono">{c.iot.toLocaleString()} kg CO₂e</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Satellite:</span><span className="font-mono">{c.satellite.toLocaleString()} kg CO₂e</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Discrepancy:</span><span className={`font-mono font-semibold ${c.discrepancy > 20 ? "text-danger" : ""}`}>{c.discrepancy}% {c.discrepancy > 20 ? "⚠" : ""}</span></div>
                    </div>
                    <div className="mb-3"><StatusBadge status={c.status} /></div>
                    <p className="text-[10px] text-muted-foreground mb-2">Last verified: {c.lastVerified}</p>
                    <div className="text-xs text-primary font-semibold cursor-pointer hover:underline" onClick={() => navigate(`/dashboard/profiles/${c.id}`)}>View Full Profile →</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-4 z-[1000] border border-dash-border">
            {[{ g: "A", c: "#059669" }, { g: "B", c: "#0891b2" }, { g: "C", c: "#d97706" }, { g: "D", c: "#ea580c" }, { g: "F", c: "#dc2626" }].map((l) => (
              <div key={l.g} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.c }} />
                <span className="text-[10px] font-semibold">{l.g}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden lg:block w-80 bg-card border-l border-dash-border overflow-y-auto p-4 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Top Polluters</h3>
          <div className="space-y-2">
            {topPolluters.map((c, i) => (
              <div key={c.id} className="card-dashboard p-3 cursor-pointer" onClick={() => navigate(`/dashboard/profiles/${c.id}`)}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary w-4">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                    <div className="flex items-center gap-1">
                      <SectorIcon sector={c.sector} size={12} />
                      <span className="text-[10px] text-muted-foreground">{c.emissions.toLocaleString()} kg</span>
                    </div>
                  </div>
                  <GradeBadge score={c.score} size="sm" />
                </div>
                <TrendArrow trend={c.trend} pct={c.trendPct} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Most Improved Today</h3>
          <div className="space-y-2">
            {mostImproved.map((c, i) => (
              <div key={c.id} className="card-dashboard p-3 cursor-pointer" onClick={() => navigate(`/dashboard/profiles/${c.id}`)}>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                  </div>
                  <TrendArrow trend={c.trend} pct={c.trendPct} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
