import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface CallVolumeBarProps {
  data: { hour: string; count: number }[];
  loading?: boolean;
}

export function CallVolumeBar({ data, loading }: CallVolumeBarProps) {
  if (loading) {
    return (
      <div
        className="rounded-lg p-5"
        style={{
          backgroundColor: '#111318',
          border: '1px solid #242830',
          height: '320px',
        }}
      >
        <div className="skeleton-shimmer h-4 w-40 rounded mb-6" />
        <div className="flex items-end gap-2 h-[240px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer flex-1 rounded-t"
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: '#111318',
        border: '1px solid #242830',
        height: '320px',
      }}
    >
      <h3
        className="text-[14px] font-semibold mb-4"
        style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}
      >
        Call Volume by Hour
      </h3>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#242830"
            vertical={false}
          />
          <XAxis
            dataKey="hour"
            axisLine={{ stroke: '#242830' }}
            tickLine={false}
            tick={{
              fill: '#4E5464',
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fill: '#4E5464',
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1E26',
              border: '1px solid #242830',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: "'IBM Plex Mono', monospace",
              color: '#E8EAF0',
            }}
            formatter={(value: number) => [value, 'Calls']}
            cursor={{ fill: 'rgba(77, 158, 255, 0.05)' }}
          />
          <Bar
            dataKey="count"
            fill="#4D9EFF"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
