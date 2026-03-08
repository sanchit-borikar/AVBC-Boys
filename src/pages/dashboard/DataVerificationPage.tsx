import { useState, useEffect } from "react";
import { useSocketSimulator } from "@/hooks/useSocketSimulator";
import StatusBadge from "@/components/StatusBadge";
import HashDisplay from "@/components/HashDisplay";
import SkeletonLoader from "@/components/SkeletonLoader";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { generateHourlyData } from "@/data/mockData";

export default function DataVerificationPage() {
  const { companies } = useSocketSimulator();
  const [loading, setLoading] = useState(true);
  const [sourceTab, setSourceTab] = useState(0);
  const hourlyData = generateHourlyData();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <SkeletonLoader type="table" />;

  const sources = ["🏭 IoT Sensors", "🛰 Satellite", "📡 OpenAQ"];

  const liveRows = companies.map((c) => ({
    time: c.lastVerified,
    entity: c.name,
    location: c.location,
    sector: c.sector,
    value: sourceTab === 0 ? c.iot : sourceTab === 1 ? c.satellite : c.openaq,
    status: c.status,
  }));

  const verifications = companies.filter((c) => c.discrepancy > 5).slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="text-xl font-display font-bold text-foreground">Data & Verification</h1>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Left - Live Data Feed */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card-dashboard p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Live Data Feed</h3>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
                <span className="text-[10px] text-primary font-medium">LIVE</span>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              {sources.map((s, i) => (
                <div key={i} className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${sourceTab === i ? "btn-primary-gradient" : "btn-secondary-outline"}`} style={{ cursor: "pointer" }} onClick={() => setSourceTab(i)}>{s}</div>
              ))}
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card"><tr className="border-b border-dash-border text-muted-foreground">
                  <th className="text-left py-2">Time</th><th className="text-left py-2">Entity</th><th className="text-left py-2">Sector</th><th className="text-left py-2">Value</th><th className="text-left py-2">Status</th>
                </tr></thead>
                <tbody>
                  {liveRows.map((r, i) => (
                    <tr key={i} className="border-b border-dash-border hover:bg-primary-light-bg transition-colors">
                      <td className="py-2 font-mono">{r.time}</td>
                      <td className="py-2 font-medium">{r.entity}</td>
                      <td className="py-2">{r.sector}</td>
                      <td className="py-2 font-mono">{r.value.toLocaleString()} kg</td>
                      <td className="py-2"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#0f172a] mb-4">24-Hour Multi-Source Comparison</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={hourlyData}>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "10px 14px", fontFamily: "'Plus Jakarta Sans', sans-serif" }} 
                  itemStyle={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} 
                  labelStyle={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "#0f172a" }}
                />
                <Legend />
                <Area type="monotone" dataKey="industry" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} name="IoT" />
                <Area type="monotone" dataKey="transport" stroke="#0891b2" fill="#0891b2" fillOpacity={0.15} name="Satellite" />
                <Area type="monotone" dataKey="energy" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.15} name="OpenAQ" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right - Verification Engine */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-dashboard p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Cross-Verification Engine</h3>
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-3">
              {verifications.map((c) => (
                <div key={c.id} className="border border-dash-border rounded-lg p-3">
                  <p className="text-sm font-semibold text-foreground">{c.name} <span className="text-xs text-muted-foreground">· {c.sector}</span></p>
                  <div className="space-y-1 mt-2 text-xs font-mono">
                    <div className="flex justify-between"><span className="text-muted-foreground">🏭 IoT:</span><span>{c.iot.toLocaleString()} kg</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">🛰 NASA:</span><span>{c.satellite.toLocaleString()} kg</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">📡 OpenAQ:</span><span>{c.openaq.toLocaleString()} kg</span></div>
                  </div>
                  <div className={`flex justify-between mt-2 text-xs font-semibold ${c.discrepancy > 20 ? "text-danger" : "text-foreground"}`}>
                    <span>Δ Discrepancy:</span><span>{c.discrepancy}%</span>
                  </div>
                  <div className={`mt-2 p-2 rounded-lg text-xs ${c.discrepancy > 20 ? "bg-danger-light border border-danger/20 text-danger" : "bg-success-light border border-success/20 text-success"}`}>
                    {c.discrepancy > 20 ? "⚠ FLAGGED — Exceeds 20% threshold" : "✓ VERIFIED — Within threshold"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Decision Flow */}
          <div className="card-dashboard p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Decision Flow</h3>
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono">
              <div className="px-2 py-1 bg-primary-light-bg text-primary rounded">IoT</div>
              <span>→</span>
              <div className="px-2 py-1 bg-primary-light-bg text-primary rounded">NASA</div>
              <span>→</span>
              <div className="px-2 py-1 bg-primary text-primary-foreground rounded font-semibold">Cross-Verify</div>
              <span>→</span>
              <div className="flex flex-col items-center gap-1">
                <div className="px-2 py-0.5 bg-danger-light text-danger rounded">FLAG 🚨</div>
                <div className="px-2 py-0.5 bg-success-light text-success rounded">AUDIT ✓</div>
              </div>
            </div>
          </div>

          {/* GHG Calculator */}
          <div className="card-dashboard p-5 border-t-[3px] border-t-warning">
            <h3 className="text-sm font-semibold text-foreground mb-1">⚗️ GHG Protocol Calculator</h3>
            <p className="text-[10px] text-muted-foreground mb-3">Convert raw readings to standardized CO₂e</p>
            <div className="flex gap-2 mb-3">
              <input type="number" className="flex-1 px-3 py-2 border border-input rounded-lg text-sm outline-none" placeholder="Value" />
              <select className="px-2 py-2 border border-input rounded-lg text-xs outline-none bg-card">
                <option>ppm</option><option>ppb</option><option>μg·m⁻³</option><option>mg·m⁻³</option>
              </select>
            </div>
            <div className="bg-warning btn-primary-gradient w-full py-2 text-center text-xs font-semibold" style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}>Calculate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
