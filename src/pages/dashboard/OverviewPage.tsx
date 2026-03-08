import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocketSimulator } from "@/hooks/useSocketSimulator";
import { generateHourlyData } from "@/data/mockData";
import GradeBadge from "@/components/GradeBadge";
import StatusBadge from "@/components/StatusBadge";
import SectorIcon from "@/components/SectorIcon";
import SkeletonLoader from "@/components/SkeletonLoader";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, Activity, MapPin, CheckCircle2, Info, ArrowUpRight, ArrowDownRight, Database, Globe, Leaf, Scale, Building2 } from "lucide-react";

// Mock Data from user request
const mockViolations = 47;
const mockComplianceBreakdown = { compliant: 79, warning: 62, violation: 47 };
const mockSectors = {
  Industry: { co2e: 13695, who_breaches: 47, score: 58 },
  Transport: { co2e: 8420, who_breaches: 23, score: 71 },
  Energy: { co2e: 4200, who_breaches: 12, score: 64 }
};
const mockComparison = {
  Industry: { feb_co2e: 11200, mar_co2e: 13695, change: 22, direction: "up" },
  Transport: { feb_co2e: 7800, mar_co2e: 8420, change: 8, direction: "up" },
  Energy: { feb_co2e: 4330, mar_co2e: 4200, change: -3, direction: "down" }
};
const mockForecasts = [
  { city: "Delhi", state: "Delhi", sector: "Industrial", forecast_90d: 109, trend: "increasing", risk: "HIGH" },
  { city: "Mumbai", state: "Maharashtra", sector: "Transport", forecast_90d: 89, trend: "increasing", risk: "MEDIUM" },
  { city: "Chennai", state: "Tamil Nadu", sector: "Industrial", forecast_90d: 42, trend: "decreasing", risk: "LOW" }
];
const mockSources = [
  { name: "OpenAQ API", status: "live", time: "2s ago", count: 1247 },
  { name: "NASA GEOS-CF", status: "live", time: "1m ago", count: 89 },
  { name: "WAQI Air Quality", status: "live", time: "5m ago", count: 412 },
  { name: "data.gov.in", status: "live", time: "1h ago", count: 156 },
  { name: "IoT Industrial", status: "live", time: "5s ago", count: 2341 },
  { name: "IoT Transport", status: "live", time: "5s ago", count: 1876 },
  { name: "IoT Energy", status: "live", time: "5s ago", count: 1203 },
  { name: "Manual Reports", status: "manual", time: "today", count: 3 }
];
const emissionLiveFeedItems = [
  { id: "e1", time: "just now", text: "Delhi Industrial flagged — CO2e 13,695 ↑ WHO limit", type: "flagged" },
  { id: "e2", time: "2m ago", text: "Blockchain TX anchored — OUXORCLW... written", type: "blockchain" },
  { id: "e3", time: "5m ago", text: "Kolkata anomaly detected — 3x normal level", type: "flagged" },
  { id: "e4", time: "12m ago", text: "Mumbai Transport verified — Score 42 WARNING", type: "verified" },
  { id: "e5", time: "18m ago", text: "IPCC formula applied — PM2.5 × 110 = 13,695 CO2e", type: "system" },
  { id: "e6", time: "25m ago", text: "Chennai Energy compliant — Score 71 CLEAN", type: "verified" },
];

export default function OverviewPage() {
  const { user } = useAuth();
  const { alerts, liveFeed } = useSocketSimulator();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const hourlyData = generateHourlyData();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#22c55e"; // green
    if (score >= 40) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const kpis = [
    { icon: <Globe size={20} />, value: "188", label: "Cities Monitored", sub: "↑ Across 28 Indian states", borderColor: "border-l-[#2563eb]", numColor: "from-[#2563eb] to-[#0891b2]", iconBg: "bg-[#2563eb]/10 text-[#2563eb]", subColor: "text-success" },
    { icon: "⚠", value: String(alerts.filter((a) => a.status === "pending").length), label: "Active Flags Today", sub: `${alerts.filter((a) => a.severity === "critical").length} critical · ${alerts.filter((a) => a.severity === "high").length} high`, borderColor: "border-l-[#dc2626]", numColor: "from-[#dc2626] to-[#f87171]", iconBg: "bg-[#dc2626]/10 text-[#dc2626]", subColor: "text-muted-foreground" },
    { icon: "🔗", value: "3,241", label: "Blockchain Records", sub: "↑ 47 written today", borderColor: "border-l-[#7c3aed]", numColor: "from-[#7c3aed] to-[#c084fc]", iconBg: "bg-[#7c3aed]/10 text-[#7c3aed]", subColor: "text-muted-foreground" },
    { icon: "✓", value: "94.2%", label: "Data Verified Today", sub: "↑ 2.1% vs yesterday", borderColor: "border-l-[#059669]", numColor: "from-[#059669] to-[#34d399]", iconBg: "bg-[#059669]/10 text-[#059669]", subColor: "text-success" },
  ];

  const tabs = ["Active Sectors (3)", `Recent Flags (${alerts.length})`, "Latest Records (10)", "Resolved Today (8)"];

  const sectorNames = ["Industry", "Transport", "Energy"];

  if (loading) return <div className="space-y-4"><SkeletonLoader /><SkeletonLoader type="chart" /></div>;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* WHO/CPCB Violation Banner */}
      {mockViolations > 0 && (
        <div className="bg-[#fef2f2] border border-[#fecaca] border-l-4 border-l-[#ef4444] rounded-lg px-5 py-3 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-[#ef4444]" size={24} />
            <div>
              <p className="font-bold text-[#ef4444] text-sm">{mockViolations} ACTIVE WHO/CPCB VIOLATIONS DETECTED</p>
              <p className="text-[#6b7280] text-xs mt-0.5">Delhi, Kolkata, Ahmedabad + {mockViolations - 3} more cities</p>
            </div>
          </div>
          <button className="border border-[#ef4444] text-[#ef4444] bg-white rounded-md px-3.5 py-1.5 text-xs font-semibold hover:bg-red-50 transition-colors whitespace-nowrap">
            View All Violations
          </button>
        </div>
      )}

      {/* Header & Badges */}
      <div>
        <div className="flex items-center gap-3 flex-wrap mb-1">
          <h1 className="text-xl font-display font-bold text-foreground">Good Morning, {user?.orgName || "EcoFreight Ltd"} 👋</h1>
          <div className="flex gap-1.5">
            <span className="bg-teal-500 text-white rounded-full px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1"><Globe size={10} /> SDG 13 Climate Action</span>
            <span className="bg-blue-500 text-white rounded-full px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1"><Building2 size={10} /> SDG 9 Industry</span>
            <span className="bg-green-500 text-white rounded-full px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1"><Activity size={10} /> SDG 12 Consumption</span>
            <span className="bg-purple-500 text-white rounded-full px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1"><Scale size={10} /> SDG 16 Justice</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Here's your platform overview — 7 March 2026</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:-translate-y-1 transition-all duration-300 border-l-[4px] ${k.borderColor}`}>
            <div className="flex items-start justify-between relative">
              <div className="w-full">
                <p className="text-xs text-muted-foreground mb-1 font-semibold">{k.label}</p>
                <p className={`text-[28px] font-display font-extrabold bg-gradient-to-br ${k.numColor} bg-clip-text text-transparent leading-tight mt-1`}>{k.value}</p>
                <p className={`text-[10px] sm:text-[11px] mt-2 font-medium ${k.subColor}`}>{k.sub}</p>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center text-[16px] sm:text-[20px] ${k.iconBg}`}>
                {k.icon}
              </div>
            </div>
          </div>
        ))}

        {/* New Stat Card: Compliance Score Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:-translate-y-1 transition-all duration-300 border-l-[4px] border-l-[#f59e0b] col-span-2 md:col-span-1 xl:col-span-1">
          <p className="text-[11px] text-muted-foreground mb-1 font-bold uppercase tracking-wider">Avg Compliance Score</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-display font-black text-[#f59e0b] leading-none">52</span>
            <span className="text-xs font-bold text-slate-400 mb-1">/100</span>
          </div>
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22c55e]" /> Compliant</div>
              <span>{mockComplianceBreakdown.compliant}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Warning</div>
              <span>{mockComplianceBreakdown.warning}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Violation</div>
              <span>{mockComplianceBreakdown.violation}</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#f59e0b] rounded-full" style={{ width: '52%' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-dash-border overflow-x-auto no-scrollbar pb-1">
        {tabs.map((t, i) => (
          <div key={i} className={`pb-2 text-sm font-medium cursor-pointer transition-colors whitespace-nowrap ${activeTab === i ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setActiveTab(i)}>{t}</div>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left Column (Sector Cards, Comparisons, AI Forecasts) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Sector Cards Row */}
          <div className="grid sm:grid-cols-3 gap-4">
            {sectorNames.map((sectorName) => {
              const data = mockSectors[sectorName as keyof typeof mockSectors];
              const scoreColor = getScoreColor(data.score);

              return (
                <div key={sectorName} className="card-dashboard p-5 flex flex-col justify-between border-l-[4px]" style={{ borderLeftColor: scoreColor }}>
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <SectorIcon sector={sectorName} />
                      <span className="text-sm font-bold text-foreground">{sectorName} Sector</span>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Avg CO2e</p>
                        <p className="text-lg font-black text-slate-800">{data.co2e.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">μg/m³</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">WHO Breaches</p>
                        <p className="text-sm font-bold text-rose-500">{data.who_breaches} cities</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-500">Avg Score</span>
                      <span className="text-xs font-black" style={{ color: scoreColor }}>{data.score}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-500" style={{ width: `${data.score}%`, backgroundColor: scoreColor }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Monthly Comparison */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[15px] font-bold text-[#1e293b]">📊 Monthly Comparison — March vs February 2026</h3>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block">Auto-updated daily</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {sectorNames.map((sector) => {
                const comp = mockComparison[sector as keyof typeof mockComparison];
                const isUp = comp.direction === "up";
                return (
                  <div key={sector + 'comp'} className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4">
                      {sector === "Industry" ? "🏭" : sector === "Transport" ? "🚗" : "⚡"}
                      <span className="text-sm font-bold text-slate-800">{sector}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 mb-1">February</p>
                        <p className="text-xs font-bold text-slate-700">{comp.feb_co2e.toLocaleString()} μg/m³</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 mb-1">March</p>
                        <p className="text-xs font-bold text-slate-900">{comp.mar_co2e.toLocaleString()} μg/m³</p>
                      </div>
                    </div>
                    <div className={`mt-auto text-xs font-bold flex items-center gap-1 ${isUp ? "text-[#ef4444]" : "text-[#22c55e]"}`}>
                      {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {comp.change}% CO2e {isUp ? "increase" : "decrease"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Forecast Highlight Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">🤖 AI Forecast — Next 90 Days</h3>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                LSTM · 82.7% Accuracy
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {mockForecasts.map((forecast, i) => (
                <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                    <div className="w-32">
                      <p className="text-sm font-bold text-slate-900">{forecast.city}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{forecast.state}</p>
                    </div>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider self-start sm:self-auto">
                      {forecast.sector}
                    </span>
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">90-Day Forecast</p>
                    <div className="flex items-center justify-end sm:justify-start gap-1 font-mono font-bold text-slate-800 text-sm">
                      {forecast.forecast_90d} μg/m³
                      {forecast.trend === "increasing" ? <TrendingUp size={14} className="text-rose-500" /> : <TrendingDown size={14} className="text-emerald-500" />}
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${forecast.risk === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                      forecast.risk === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}>
                      {forecast.risk} RISK
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block">Trained on real OpenAQ data · IPCC AR6 standard · Updated daily</span>
              <a href="#" className="text-xs font-bold text-[#00d4aa] hover:underline">View full forecasts →</a>
            </div>
          </div>

          {/* Area Chart */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm mt-6">
            <h3 className="text-[14px] font-bold text-[#0f172a] mb-4">Live Sector Emission Feed — Last 24 Hours</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="gIndustry" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gTransport" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} /><stop offset="95%" stopColor="#0891b2" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gEnergy" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} /><stop offset="95%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient>
                </defs>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "10px 14px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  itemStyle={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  labelStyle={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "#0f172a" }}
                />
                <Legend />
                <Area type="monotone" dataKey="industry" stroke="#2563eb" fill="url(#gIndustry)" name="Industry" />
                <Area type="monotone" dataKey="transport" stroke="#0891b2" fill="url(#gTransport)" name="Transport" />
                <Area type="monotone" dataKey="energy" stroke="#7c3aed" fill="url(#gEnergy)" name="Energy" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (Activity Feed, Pipeline, IPCC Box) */}
        <div className="space-y-6">

          {/* Live Feed (Emission Focused) */}
          <div className="card-dashboard p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Recent Activity Feed</h3>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
                <span className="text-[10px] text-primary font-bold tracking-widest uppercase">Live</span>
              </div>
            </div>
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2 no-scrollbar">
              {emissionLiveFeedItems.map((f) => (
                <div key={f.id} className="flex items-start gap-3 animate-slide-in-top">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${f.type === "verified" ? "bg-[#10b981]" :
                    f.type === "flagged" ? "bg-[#ef4444]" :
                      f.type === "blockchain" ? "bg-[#8b5cf6]" : "bg-[#3b82f6]"
                    }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 leading-snug">{f.text}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{f.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Pipeline Status */}
          <div className="card-dashboard p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Data Pipeline Status</h3>
                <p className="text-[10px] text-slate-400 font-medium">8 sources active</p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold tracking-widest uppercase">All Systems Live</span>
              </div>
            </div>
            <div className="space-y-0.5">
              {mockSources.map((source, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 group">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${source.status === 'live' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="text-[13px] font-bold text-[#1e293b]">{source.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-medium text-[#94a3b8] w-14 text-right">
                      {source.status === 'live' ? `Live · ${source.time}` : `${source.time}`}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-[#64748b] bg-slate-50 px-1.5 py-0.5 rounded w-20 text-right group-hover:bg-slate-100 transition-colors">
                      {source.count.toLocaleString()} rec
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* IPCC Formula Info Box */}
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-emerald-100 group-hover:text-emerald-200 transition-colors">
              <Leaf size={80} />
            </div>
            <div className="relative z-10">
              <h4 className="text-sm font-bold text-emerald-900 mb-0.5">CO2e Conversion Standard</h4>
              <p className="text-[11px] font-semibold text-emerald-600 mb-3">IPCC AR6 2023</p>

              <div className="bg-white/60 rounded-lg p-3 mb-3 border border-emerald-100">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs text-emerald-800">
                  <span>PM2.5</span><span>× 110 = CO2e</span>
                  <span>NO2</span><span>× 298 = CO2e</span>
                  <span>SO2</span><span>× 132 = CO2e</span>
                  <span>CO</span><span>×   1 = CO2e</span>
                </div>
              </div>

              <div className="h-px w-full bg-emerald-200/50 mb-3" />

              <div className="space-y-1.5 font-medium text-xs text-emerald-800/80 mb-4">
                <p>Transport: 2.31 kg CO2 / litre fuel</p>
                <p>Industrial: 0.82 kg CO2 / kWh</p>
                <p>Energy: 0.45 kg CO2 / MWh</p>
              </div>

              <p className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest leading-relaxed">
                Standard used for all calculations in VayuDrishti
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
