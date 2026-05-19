import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface OutcomeDonutProps {
  data: { name: string; value: number; color: string }[];
  loading?: boolean;
}

export function OutcomeDonut({ data, loading }: OutcomeDonutProps) {
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
        <div className="skeleton-shimmer h-4 w-32 rounded mb-6" />
        <div className="flex items-center justify-center h-[240px]">
          <div className="skeleton-shimmer w-48 h-48 rounded-full" />
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

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
        Outcome Breakdown
      </h3>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative" style={{ width: '180px', height: '180px', flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className="text-[20px] font-semibold"
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#E8EAF0' }}
            >
              {total}
            </span>
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ color: '#4E5464', fontFamily: "'DM Sans', sans-serif" }}
            >
              Total
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 flex-1">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span
                  className="text-[12px]"
                  style={{ color: '#8A8F9E', fontFamily: "'DM Sans', sans-serif" }}
                >
                  {item.name}
                </span>
              </div>
              <span
                className="text-[12px] font-medium"
                style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#E8EAF0' }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
