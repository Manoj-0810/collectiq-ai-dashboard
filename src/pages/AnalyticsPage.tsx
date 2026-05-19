import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, IndianRupee, Phone } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { CallVolumeBar } from '@/components/charts/CallVolumeBar';
import { OutcomeDonut } from '@/components/charts/OutcomeDonut';
import {
  fetchDashboardMetrics,
  fetchCallVolumeByHour,
  fetchOutcomeBreakdown,
  fetchCampaigns,
} from '@/lib/supabase';
import type { Campaign } from '@/types';

export function AnalyticsPage() {
  const [metrics, setMetrics] = useState({
    totalCalls: 0,
    completedCalls: 0,
    ptpCount: 0,
    ptpAmount: 0,
    connectRate: 0,
    ptpRate: 0,
  });
  const [volumeData, setVolumeData] = useState<{ hour: string; count: number }[]>([]);
  const [outcomeData, setOutcomeData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [dashboardMetrics, volume, outcomes, campaignList] = await Promise.all([
        fetchDashboardMetrics(),
        fetchCallVolumeByHour(),
        fetchOutcomeBreakdown(),
        fetchCampaigns(),
      ]);

      setMetrics(dashboardMetrics);
      setVolumeData(volume);
      setOutcomeData(outcomes);
      setCampaigns(campaignList);
      setLoading(false);
    }

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-[22px] font-bold"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--ui-font)' }}
        >
          Analytics
        </h1>
        <p
          className="text-[13px] mt-0.5"
          style={{ color: 'var(--text-secondary)', fontFamily: 'var(--ui-font)' }}
        >
          Deep dive into your collections performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Calls"
          value={metrics.totalCalls.toString()}
          delta={`${metrics.completedCalls} completed`}
          deltaPositive={true}
          icon={Phone}
          loading={loading}
        />
        <MetricCard
          label="PTP Rate"
          value={`${metrics.ptpRate}%`}
          delta={`${metrics.ptpCount} promises`}
          deltaPositive={metrics.ptpRate > 20}
          icon={TrendingUp}
          loading={loading}
        />
        
        <MetricCard
          label="Total PTP Amount"
          value={`₹${metrics.ptpAmount.toLocaleString('en-IN')}`}
          delta={`${metrics.ptpCount} PTPs`}
          deltaPositive={true}
          icon={IndianRupee}
          loading={loading}
        />

        
        <MetricCard
          label="Connect Rate"
          value={`${metrics.connectRate}%`}
          delta={`${metrics.totalCalls - metrics.completedCalls} pending`}
          deltaPositive={metrics.connectRate > 50}
          icon={BarChart3}
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <CallVolumeBar data={volumeData} loading={loading} />
        </div>
        <div className="col-span-2">
          <OutcomeDonut data={outcomeData} loading={loading} />
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div
        className="rounded-lg"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
        }}
      >
        <div
          className="px-5 py-4"
          style={{ borderBottom: '1px solid var(--bg-border)' }}
        >
          <h3
            className="text-[14px] font-semibold"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--ui-font)' }}
          >
            Campaign Performance
          </h3>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-12 rounded" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <BarChart3 className="w-10 h-10 mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              No campaign data yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  {['Campaign', 'Accounts', 'Status', 'Created'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-3"
                      style={{ color: 'var(--text-muted)', fontFamily: 'var(--ui-font)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign, i) => (
                  <tr
                    key={campaign.id}
                    style={{
                      borderBottom: i < campaigns.length - 1 ? '1px solid var(--bg-border)' : 'none',
                    }}
                  >
                    <td
                      className="px-5 py-3 text-[13px] font-medium"
                      style={{ color: 'var(--text-primary)', fontFamily: 'var(--ui-font)' }}
                    >
                      {campaign.name}
                    </td>
                    <td
                      className="px-5 py-3 text-[13px]"
                      style={{ fontFamily: 'var(--mono-font)', color: 'var(--text-secondary)' }}
                    >
                      {campaign.total_accounts}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize"
                        style={{
                          backgroundColor:
                            campaign.status === 'running'
                              ? 'rgba(0, 229, 160, 0.15)'
                              : campaign.status === 'paused'
                              ? 'rgba(245, 166, 35, 0.15)'
                              : campaign.status === 'completed'
                              ? 'rgba(138, 143, 158, 0.15)'
                              : 'rgba(78, 84, 100, 0.15)',
                          color:
                            campaign.status === 'running'
                              ? 'var(--accent-green)'
                              : campaign.status === 'paused'
                              ? 'var(--accent-amber)'
                              : campaign.status === 'completed'
                              ? 'var(--text-secondary)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3 text-[12px]"
                      style={{ fontFamily: 'var(--mono-font)', color: 'var(--text-muted)' }}
                    >
                      {new Date(campaign.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
