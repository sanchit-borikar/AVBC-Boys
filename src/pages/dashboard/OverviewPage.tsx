import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocketSimulator } from "@/hooks/useSocketSimulator";
import { generateHourlyData } from "@/data/mockData";
import GradeBadge from "@/components/GradeBadge";
import StatusBadge from "@/components/StatusBadge";
import SectorIcon from "@/components/SectorIcon";
import SkeletonLoader from "@/components/SkeletonLoader";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function OverviewPage() {
  const { user } = useAuth();
  const { companies, alerts, liveFeed } = useSocketSimulator();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const hourlyData = generateHourlyData();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const kpis = [
    { icon: "🏭", value: "847", label: "Companies Tracked", sub: "↑ 12 registered this week", borderColor: "border-l-[#2563eb]", numColor: "from-[#2563eb] to-[#0891b2]", iconBg: "bg-[#2563eb]/10 text-[#2563eb]", subColor: "text-success" },
    { icon: "⚠", value: String(alerts.filter((a) => a.status === "pending").length), label: "Active Flags Today", sub: `${alerts.filter((a) => a.severity === "critical").length} critical · ${alerts.filter((a) => a.severity === "high").length} high`, borderColor: "border-l-[#dc2626]", numColor: "from-[#dc2626] to-[#f87171]", iconBg: "bg-[#dc2626]/10 text-[#dc2626]", subColor: "text-muted-foreground" },
    { icon: "🔗", value: "3,241", label: "Blockchain Records", sub: "↑ 47 written today", borderColor: "border-l-[#7c3aed]", numColor: "from-[#7c3aed] to-[#c084fc]", iconBg: "bg-[#7c3aed]/10 text-[#7c3aed]", subColor: "text-muted-foreground" },
    { icon: "✓", value: "94.2%", label: "Data Verified Today", sub: "↑ 2.1% vs yesterday", borderColor: "border-l-[#059669]", numColor: "from-[#059669] to-[#34d399]", iconBg: "bg-[#059669]/10 text-[#059669]", subColor: "text-success" },
  ];

  const tabs = ["Active Sectors (3)", `Recent Flags (${alerts.length})`, "Latest Records (10)", "Resolved Today (8)"];

  const sectorCards = [
    { icon: "🏭", name: "Industry Sector", count: 312, avgScore: 58, grade: "C", flagged: 8, color: "border-l-primary" },
    { icon: "🚗", name: "Transport Sector", count: 287, avgScore: 71, grade: "B", flagged: 3, color: "border-l-cyan" },
    { icon: "⚡", name: "Energy Sector", count: 248, avgScore: 64, grade: "C", flagged: 12, color: "border-l-purple" },
  ];

  if (loading) return <div className="space-y-4"><SkeletonLoader /><SkeletonLoader type="chart" /></div>;

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-xl font-display font-bold text-foreground">Good Morning, {user?.orgName} 👋</h1>
        <p className="text-sm text-muted-foreground">Here's your platform overview — 7 March 2026</p>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:-translate-y-1 transition-all duration-300 border-l-[3px] ${k.borderColor}`}>
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                <p className={`text-[32px] font-display font-extrabold bg-gradient-to-br ${k.numColor} bg-clip-text text-transparent leading-none mt-1`}>{k.value}</p>
                <p className={`text-[11px] mt-2 ${k.subColor}`}>{k.sub}</p>
              </div>
              <div className={`w-[40px] h-[40px] rounded-full flex items-center justify-center text-[20px] ${k.iconBg}`}>
                {k.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-dash-border">
        {tabs.map((t, i) => (
          <div key={i} className={`pb-2 text-sm font-medium cursor-pointer transition-colors ${activeTab === i ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setActiveTab(i)}>{t}</div>
        ))}
      </div>

      {/* Sector cards + Activity Feed */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid sm:grid-cols-3 gap-4">
          {sectorCards.map((s, i) => (
            <div key={i} className={`card-dashboard p-5 border-l-4 ${s.color}`}>
              <div className="flex items-center gap-2 mb-3">
                <SectorIcon sector={s.name.split(" ")[0]} />
                <span className="text-sm font-semibold text-foreground">{s.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.count} companies tracked</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">Avg score: {s.avgScore}</span>
                <GradeBadge score={s.avgScore} size="sm" />
              </div>
              <span className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.flagged > 5 ? "bg-danger-light text-danger" : "bg-warning-light text-warning"}`}>{s.flagged} flagged</span>
            </div>
          ))}
        </div>

        {/* Live Feed */}
        <div className="card-dashboard p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Activity Feed</h3>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
              <span className="text-[10px] text-primary font-medium">LIVE</span>
            </div>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {liveFeed.slice(0, 8).map((f) => (
              <div key={f.id} className="flex items-start gap-2 animate-slide-in-top">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${f.type === "verified" ? "bg-success" : f.type === "flagged" ? "bg-danger" : f.type === "blockchain" ? "bg-purple" : "bg-primary"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{f.text}</p>
                  <p className="text-[10px] text-muted-foreground">{f.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Area Chart */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm">
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
  );
}
