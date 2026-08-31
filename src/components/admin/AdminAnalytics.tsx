import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Users, TrendingUp, TrendingDown, BarChart3, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type DateRange = "7" | "30" | "90";

const AdminAnalytics = () => {
  const [pageViews, setPageViews] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [avgSession, setAvgSession] = useState("0m 0s");
  const [dailyData, setDailyData] = useState<{ date: string; views: number }[]>([]);
  const [range, setRange] = useState<DateRange>("7");

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const fetchAnalytics = async () => {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(range));

    const { data } = await supabase
      .from("page_views")
      .select("*")
      .gte("created_at", daysAgo.toISOString());

    if (data) {
      setPageViews(data.length);
      const uniqueIds = new Set(data.map((v) => v.visitor_id).filter(Boolean));
      setUniqueVisitors(uniqueIds.size);

      const totalDuration = data.reduce((sum, v) => sum + (v.session_duration || 0), 0);
      const avg = data.length > 0 ? totalDuration / data.length : 0;
      const mins = Math.floor(avg / 60);
      const secs = Math.floor(avg % 60);
      setAvgSession(`${mins}m ${secs}s`);

      // Group by date
      const grouped: Record<string, number> = {};
      data.forEach((v) => {
        const date = new Date(v.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        grouped[date] = (grouped[date] || 0) + 1;
      });
      setDailyData(Object.entries(grouped).map(([date, views]) => ({ date, views })));
    }
  };

  const stats = [
    { label: "Page Views", value: pageViews.toLocaleString(), icon: Eye, trend: null },
    { label: "Unique Visitors", value: uniqueVisitors.toLocaleString(), icon: Users, trend: null },
    { label: "Avg. Session", value: avgSession, icon: TrendingUp, trend: null },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-light">Performance Analytics</h2>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Track your website's performance and visitor engagement
          </p>
        </div>
        <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-card">
          <Calendar size={14} className="text-muted-foreground" />
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as DateRange)}
            className="bg-transparent font-body text-xs text-foreground outline-none cursor-pointer"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="border border-border rounded-lg p-5 bg-card"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-accent" />
                  <span className="font-body text-sm text-muted-foreground">{stat.label}</span>
                </div>
              </div>
              <p className="font-display text-3xl font-light text-foreground">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="border border-border rounded-lg p-6 bg-card">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={16} className="text-accent" />
          <h3 className="font-body text-sm font-medium text-foreground">Daily Traffic</h3>
        </div>
        <div className="h-64">
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(30,10%,62%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(30,10%,62%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(25,12%,13%)",
                    border: "1px solid hsl(25,10%,22%)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "hsl(35,15%,93%)",
                  }}
                />
                <Bar dataKey="views" fill="hsl(28,40%,50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="font-body text-sm text-muted-foreground">No data yet. Views will appear as visitors browse your site.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
