"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = Record<string, string | number>;

export function LineMetricChart({ data, lines }: { data: Point[]; lines: string[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="round" />
          <YAxis />
          <Tooltip />
          <Legend />
          {lines.map((line, index) => <Line key={line} type="monotone" dataKey={line} stroke={["#0f172a", "#2563eb", "#059669", "#d97706"][index % 4]} strokeWidth={2} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarMetricChart({ data, bars }: { data: Point[]; bars: string[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="round" />
          <YAxis />
          <Tooltip />
          <Legend />
          {bars.map((bar, index) => <Bar key={bar} dataKey={bar} fill={["#0f172a", "#2563eb", "#059669", "#d97706"][index % 4]} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieMetricChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={95} label>
            {data.map((_, index) => <Cell key={index} fill={["#0f172a", "#2563eb", "#059669", "#d97706", "#dc2626"][index % 5]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
