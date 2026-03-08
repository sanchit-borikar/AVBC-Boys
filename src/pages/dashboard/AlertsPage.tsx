import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocketSimulator } from "@/hooks/useSocketSimulator";
import { gradeDistribution } from "@/data/mockData";
import StatusBadge from "@/components/StatusBadge";
import HashDisplay from "@/components/HashDisplay";
import ScoreRing from "@/components/ScoreRing";
import GradeBadge from "@/components/GradeBadge";
import { Lock } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";

export default function AlertsPage() {
  const { user } = useAuth();
  const { alerts, companies, blockchainRecords } = useSocketSimulator();
  const [activeTab, setActiveTab] = useState(0);
  const [localAlerts, setLocalAlerts] = useState(alerts);
  const [selectedCompany, setSelectedCompany] = useState(companies[0]?.id);
  const [pdfState, setPdfState] = useState<"idle" | "loading" | "done">("idle");

  if (user?.role !== "regulator") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center card-dashboard p-10 max-w-sm">
          <Lock size={64} className="text-primary mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Regulator Access Required</h2>
          <p className="text-sm text-muted-foreground">This section requires Regulator credentials.</p>
        </div>
      </div>
    );
  }

  const tabs = [`🔴 Live Alerts (${localAlerts.filter((a) => a.status === "pending").length})`, "📊 Compliance Scores", `🗂 Flagged Records (${localAlerts.length})`, "🔗 Blockchain Audit"];

  const severityColors: Record<string, string> = { critical: "border-l-danger", high: "border-l-orange", medium: "border-l-warning" };
  const severityLabels: Record<string, string> = { critical: "⚠ CRITICAL DISCREPANCY", high: "⚠ HIGH DISCREPANCY", medium: "⚡ EMISSION SPIKE" };

  const handleWarn = (id: number) => {
    setLocalAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: "warning_sent" } : a));
    toast.success("Warning sent successfully");
  };

  const handlePdf = () => {
    setPdfState("loading");
    setTimeout(() => setPdfState("done"), 1500);
  };

  const sc = companies.find((c) => c.id === selectedCompany) || companies[0];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-foreground">Alert & Compliance Center</h1>
        <div className="flex gap-2">
          <div className="btn-primary-gradient px-4 py-2 text-xs font-semibold">Generate Global Report</div>
          <div className="btn-secondary-outline px-4 py-2 text-xs font-semibold">Export CSV</div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-dash-border overflow-x-auto">
        {tabs.map((t, i) => (
          <div key={i} className={`pb-2 text-sm font-medium cursor-pointer whitespace-nowrap ${activeTab === i ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`} onClick={() => setActiveTab(i)}>{t}</div>
        ))}
      </div>

      {/* Tab 0: Live Alerts */}
      {activeTab === 0 && (
        <div className="space-y-4">
          {localAlerts.map((a) => (
            <div key={a.id} className={`card-dashboard p-5 border-l-4 ${severityColors[a.severity] || ""}`}>
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs font-bold uppercase ${a.severity === "critical" ? "text-danger" : a.severity === "high" ? "text-orange" : "text-warning"}`}>{severityLabels[a.severity]}</span>
                <span className="text-xs text-muted-foreground">{a.time}</span>
              </div>
              <h3 className="text-base font-display font-bold text-foreground">{a.company}</h3>
              <p className="text-xs text-muted-foreground mb-3">{a.sector} 🏭</p>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div><span className="text-muted-foreground">IoT Reading:</span> <span className="font-mono">{a.iot.toLocaleString()} kg CO₂e</span></div>
                <div><span className="text-muted-foreground">Satellite:</span> <span className="font-mono">{a.satellite.toLocaleString()} kg CO₂e</span></div>
                <div><span className="text-muted-foreground">Discrepancy:</span> <span className="font-mono font-bold text-danger">{a.discrepancy}%</span></div>
                <div><span className="text-muted-foreground">Threshold:</span> <span className="font-mono">20.0%</span></div>
              </div>
              <HashDisplay hash={a.hash} />
              {a.status === "pending" ? (
                <div className="flex gap-2 mt-3">
                  <div className="px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer text-white transition-all duration-300 hover:scale-105 hover:shadow-lg group" style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }} onClick={() => handleWarn(a.id)}>
                    <span className="group-hover:hidden">Send Warning →</span>
                    <span className="hidden group-hover:inline">Confirm Warning</span>
                  </div>
                  <div className="btn-secondary-outline px-4 py-2 text-xs font-semibold">View Full Profile →</div>
                </div>
              ) : (
                <div className="mt-3"><StatusBadge status={a.status} /></div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 1: Compliance Scores */}
      {activeTab === 1 && (
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 card-dashboard p-5">
            <label className="block text-sm font-medium text-foreground mb-2">Search Company</label>
            <select className="w-full px-3 py-2 border border-input rounded-lg text-sm mb-4 outline-none bg-card" value={selectedCompany} onChange={(e) => setSelectedCompany(Number(e.target.value))}>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex flex-col items-center gap-4">
              <ScoreRing score={sc.score} size={150} />
              <GradeBadge score={sc.score} size="lg" showLabel />
              <div className="w-full space-y-2 mt-2">
                {Object.entries(sc.scores).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24 capitalize">{k}</span>
                    <div className="flex-1 h-[8px] bg-[#f1f5f9] rounded-[4px] overflow-hidden">
                      <div className="h-full rounded-[4px]" style={{ width: `${(v / 25) * 100}%`, backgroundColor: (v / 25) * 100 < 50 ? "#dc2626" : (v / 25) * 100 < 75 ? "#d97706" : "#059669", animation: "progressFill 0.8s ease-out forwards" }} />
                    </div>
                    <span className="text-xs font-mono w-8">{v}</span>
                  </div>
                ))}
              </div>
              <div className="btn-primary-gradient px-6 py-2 text-xs font-semibold mt-2" onClick={handlePdf}>
                {pdfState === "idle" ? "Generate PDF Report" : pdfState === "loading" ? "Preparing..." : "✓ Download Ready"}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#0f172a] mb-4">Grade Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={gradeDistribution} dataKey="count" nameKey="grade" cx="50%" cy="50%" outerRadius={80} label={({ grade, count }) => `${grade}: ${count}`}>
                  {gradeDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", padding: "10px 14px", fontFamily: "'Plus Jakarta Sans', sans-serif" }} 
                  itemStyle={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} 
                  labelStyle={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "#0f172a" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Flagged Records */}
      {activeTab === 2 && (
        <div className="card-dashboard p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-dash-border text-muted-foreground">
                <th className="text-left py-2">Company</th><th className="text-left py-2">Type</th><th className="text-left py-2">Discrepancy</th><th className="text-left py-2">Severity</th><th className="text-left py-2">Status</th><th className="text-left py-2">Action</th>
              </tr></thead>
              <tbody>
                {localAlerts.map((a) => (
                  <tr key={a.id} className="border-b border-dash-border hover:bg-primary-light-bg">
                    <td className="py-2 font-medium">{a.company}</td>
                    <td className="py-2">{a.type}</td>
                    <td className="py-2 font-mono text-danger font-semibold">{a.discrepancy}%</td>
                    <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.severity === "critical" ? "bg-danger-light text-danger" : a.severity === "high" ? "bg-warning-light text-orange" : "bg-warning-light text-warning"}`}>{a.severity.toUpperCase()}</span></td>
                    <td className="py-2"><StatusBadge status={a.status} /></td>
                    <td className="py-2">
                      {a.status === "pending" && <span className="text-primary cursor-pointer hover:underline" onClick={() => handleWarn(a.id)}>Warn</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Blockchain */}
      {activeTab === 3 && (
        <div className="card-dashboard p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Immutable Records on Polygon Network</h3>
            <span className="text-xs text-primary cursor-pointer hover:underline">View Contract on Polygonscan ↗</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-dash-border text-muted-foreground">
                <th className="text-left py-2">Hash</th><th className="text-left py-2">Company</th><th className="text-left py-2">Timestamp</th><th className="text-left py-2">IPFS CID</th><th className="text-left py-2">Status</th>
              </tr></thead>
              <tbody>
                {blockchainRecords.slice(0, 10).map((r) => (
                  <tr key={r.id} className="border-b border-dash-border hover:bg-primary-light-bg">
                    <td className="py-2"><HashDisplay hash={r.hash} /></td>
                    <td className="py-2 font-medium">{r.company}</td>
                    <td className="py-2 font-mono">{r.timestamp}</td>
                    <td className="py-2"><HashDisplay hash={r.ipfs} /></td>
                    <td className="py-2"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
