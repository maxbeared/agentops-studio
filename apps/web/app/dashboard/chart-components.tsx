'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RunData {
  date: string;
  success: number;
  failed: number;
  total: number;
}

interface ExecutionTrendChartProps {
  data: RunData[];
  t: (key: string) => string;
}

export function ExecutionTrendChart({ data, t }: ExecutionTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f1f5f9',
          }}
        />
        <Area
          type="monotone"
          dataKey="success"
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorSuccess)"
          name={t('runs.chartLegend.success')}
        />
        <Area
          type="monotone"
          dataKey="failed"
          stroke="#ef4444"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorFailed)"
          name={t('runs.chartLegend.failed')}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default ExecutionTrendChart;
