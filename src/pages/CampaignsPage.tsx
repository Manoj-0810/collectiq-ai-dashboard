import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Phone, ArrowRight, Calendar } from 'lucide-react';
import { fetchCampaigns } from '@/lib/supabase';
import { StatusChip } from '@/components/ui/StatusChip';
import { formatDate } from '@/lib/utils';
import type { Campaign } from '@/types';

export function CampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchCampaigns();
      setCampaigns(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6" style={{ color: '#E8EAF0' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>
            Campaigns
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#8A8F9E', fontFamily: "'DM Sans', sans-serif" }}>
            Manage your voice collection campaigns
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-md text-[13px] font-semibold transition-all hover:opacity-90"
          style={{ backgroundColor: '#00E5A0', color: '#000', fontFamily: "'DM Sans', sans-serif" }}
          onClick={() => navigate('/upload')}
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Campaigns List */}
      <div className="rounded-lg" style={{ backgroundColor: '#111318', border: '1px solid #242830' }}>
        <div
          className="flex items-center px-5 py-3"
          style={{ backgroundColor: '#1A1E26', borderBottom: '1px solid #242830' }}
        >
          {['Campaign', 'Accounts', 'Status', 'Created', ''].map((header, i) => (
            <div
              key={header}
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{
                color: '#4E5464',
                fontFamily: "'DM Sans', sans-serif",
                width: i === 0 ? '35%' : i === 4 ? '60px' : '20%',
              }}
            >
              {header}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-12 rounded" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <Phone className="w-10 h-10 mb-3" style={{ color: '#4E5464' }} />
            <p className="text-[14px] font-medium" style={{ color: '#8A8F9E' }}>No campaigns yet</p>
            <p className="text-[12px] mt-1" style={{ color: '#4E5464' }}>Upload a CSV to create your first campaign</p>
            <button
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-medium"
              style={{ backgroundColor: '#1A1E26', color: '#4D9EFF' }}
              onClick={() => navigate('/upload')}
            >
              <Plus className="w-3.5 h-3.5" />
              Create Campaign
            </button>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="flex items-center px-5 py-4 cursor-pointer transition-all duration-100"
              style={{ borderBottom: '1px solid #242830' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1A1E26'; e.currentTarget.style.borderLeft = '2px solid #4D9EFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderLeft = '2px solid transparent'; }}
              onClick={() => navigate(`/campaigns/${campaign.id}`)}
            >
              <div style={{ width: '35%' }}>
                <p className="text-[13px] font-medium" style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>{campaign.name}</p>
              </div>
              <div style={{ width: '20%', fontFamily: "'IBM Plex Mono', monospace", color: '#8A8F9E' }} className="text-[13px]">
                {campaign.total_accounts} accounts
              </div>
              <div style={{ width: '20%' }}>
                <StatusChip status={campaign.status} size="sm" />
              </div>
              <div className="flex items-center gap-1.5" style={{ width: '20%', fontFamily: "'IBM Plex Mono', monospace", color: '#4E5464' }}>
                <Calendar className="w-3 h-3" />
                <span className="text-[12px]">{formatDate(campaign.created_at)}</span>
              </div>
              <div style={{ width: '60px' }} className="flex justify-end">
                <ArrowRight className="w-4 h-4" style={{ color: '#4E5464' }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
