import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, TrendingUp, IndianRupee, BarChart3, ArrowRight } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { CallVolumeBar } from '@/components/charts/CallVolumeBar';
import { OutcomeDonut } from '@/components/charts/OutcomeDonut';
import { StatusChip } from '@/components/ui/StatusChip';
import {
  fetchDashboardMetrics,
  fetchCallVolumeByHour,
  fetchOutcomeBreakdown,
  fetchCampaigns,
} from '@/lib/supabase';
import { formatINR } from '@/lib/utils';
import type { Campaign } from '@/types';

export function DashboardPage() {
  const navigate = useNavigate();
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
      try {
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
      } catch (e) {
        console.error('Dashboard data load error:', e);
      }
      setLoading(false);
    }

    loadData();

    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6" style={{ color: '#E8EAF0' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[22px] font-bold"
            style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}
          >
            Dashboard
          </h1>
          <p
            className="text-[13px] mt-0.5"
            style={{ color: '#8A8F9E', fontFamily: "'DM Sans', sans-serif" }}
          >
            Real-time overview of your collections operations
          </p>
        </div>
        <div
          className="text-[12px] px-3 py-1.5 rounded-md flex items-center gap-2"
          style={{
            backgroundColor: '#111318',
            border: '1px solid #242830',
            color: '#8A8F9E',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#00E5A0' }}
          />
          Live
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Total Calls Today"
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
          label="PTP Amount Committed"
          value={formatINR(metrics.ptpAmount)}
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

      {/* Active Campaigns */}
      <div
        className="rounded-lg"
        style={{
          backgroundColor: '#111318',
          border: '1px solid #242830',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #242830' }}
        >
          <h3
            className="text-[14px] font-semibold"
            style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}
          >
            Active Campaigns
          </h3>
          <button
            className="text-[12px] font-medium flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ color: '#4D9EFF' }}
            onClick={() => navigate('/campaigns')}
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-12 rounded" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <p className="text-[13px]" style={{ color: '#4E5464' }}>
              No campaigns yet
            </p>
            <button
              className="text-[12px] font-medium mt-2 flex items-center gap-1"
              style={{ color: '#4D9EFF' }}
              onClick={() => navigate('/upload')}
            >
              Upload your first CSV <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div
              className="flex items-center px-5 py-2.5"
              style={{ backgroundColor: '#1A1E26' }}
            >
              {['Campaign', 'Total Accounts', 'Completed', 'PTP Rate', 'Status', ''].map((header, i) => (
                <div
                  key={header}
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{
                    color: '#4E5464',
                    fontFamily: "'DM Sans', sans-serif",
                    width: i === 0 ? '30%' : i === 5 ? '60px' : '18%',
                  }}
                >
                  {header}
                </div>
              ))}
            </div>

            {/* Rows */}
            {campaigns.slice(0, 5).map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center px-5 py-3 cursor-pointer transition-colors"
                style={{ borderBottom: '1px solid #242830' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1A1E26';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
              >
                <div style={{ width: '30%' }}>
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {campaign.name}
                  </span>
                </div>
                <div
                  style={{
                    width: '18%',
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: '#8A8F9E',
                  }}
                  className="text-[13px]"
                >
                  {campaign.total_accounts}
                </div>
                <div
                  style={{
                    width: '18%',
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: '#8A8F9E',
                  }}
                  className="text-[13px]"
                >
                  —
                </div>
                <div
                  style={{
                    width: '18%',
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: '#00E5A0',
                  }}
                  className="text-[13px] font-medium"
                >
                  —
                </div>
                <div style={{ width: '18%' }}>
                  <StatusChip status={campaign.status} size="sm" />
                </div>
                <div style={{ width: '60px' }} className="flex justify-end">
                  <ArrowRight className="w-4 h-4" style={{ color: '#8A8F9E' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
