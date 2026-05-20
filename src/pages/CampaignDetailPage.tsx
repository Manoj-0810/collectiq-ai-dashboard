
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Download, Search, Phone, Edit2, Check, X, TrendingUp, AlertCircle } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { CallTable } from '@/components/ui/CallTable';
import { StatusChip } from '@/components/ui/StatusChip';
import {
  fetchCampaign,
  fetchCalls,
  fetchCampaignMetrics,
  updateCampaignStatus,
  updateCampaignName,
  supabase,
  triggerCall,
} from '@/lib/supabase';
import { simulateCallCompletion } from '@/lib/bolna';
import { formatDate } from '@/lib/utils';
import type { Campaign, CallWithBorrower, CampaignMetrics } from '@/types';

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [calls, setCalls] = useState<CallWithBorrower[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [filters, setFilters] = useState({ outcome: 'all', status: 'all', search: '' });
  const [isRunning, setIsRunning] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscriptionRef = useRef<unknown>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToast({ message, visible: true });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ message: '', visible: false });
    }, 4000);
  }, []);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [campaignData, callsData, metricsData] = await Promise.all([
      fetchCampaign(id),
      fetchCalls(id, filters),
      fetchCampaignMetrics(id),
    ]);
    setCampaign(campaignData);
    setCalls(callsData);
    setMetrics(metricsData);
    setLoading(false);
  }, [id, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`campaign-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calls', filter: `campaign_id=eq.${id}` },
        (payload: any) => {
          loadData();
          if (payload.eventType === 'UPDATE') {
            const newCall = payload.new as any;
            if (newCall.outcome === 'ptp_confirmed') {
              showToast('PTP confirmed');
            } else if (newCall.status === 'completed') {
              showToast('Call completed');
            }
          }
        }
      )
      .subscribe();
    subscriptionRef.current = channel;
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [id, loadData, showToast]);

  const handleNameSave = async () => {
    if (!campaign || !editName.trim()) return;
    const success = await updateCampaignName(campaign.id, editName.trim());
    if (success) {
      setCampaign({ ...campaign, name: editName.trim() });
    }
    setIsEditingName(false);
  };

  const handleRunCampaign = async () => {
    if (!campaign || campaign.status === 'completed') return;
    setIsRunning(true);
    await updateCampaignStatus(campaign.id, 'running');
    setCampaign({ ...campaign, status: 'running' });
    const queuedCalls = calls.filter((c) => c.status === 'queued');
    for (const call of queuedCalls.slice(0, 5)) {
      if (call.borrower) {
        const result = await triggerCall(call.id);
        if (result.success && result.bolnaCallId) {
          await supabase.from('calls').update({
            bolna_call_id: result.bolnaCallId,
            status: 'calling',
            started_at: new Date().toISOString(),
          }).eq('id', call.id);
          simulateCallCompletion(call.id);
        } else {
          const mockBolnaCallId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await supabase.from('calls').update({
            bolna_call_id: mockBolnaCallId,
            status: 'calling',
            started_at: new Date().toISOString(),
          }).eq('id', call.id);
          simulateCallCompletion(call.id);
        }
      }
    }
    setIsRunning(false);
    showToast(`Started calling ${queuedCalls.length} accounts`);
    loadData();
  };

  const handlePauseCampaign = async () => {
    if (!campaign) return;
    await updateCampaignStatus(campaign.id, 'paused');
    setCampaign({ ...campaign, status: 'paused' });
    showToast('Campaign paused');
  };

  const handleExport = () => {
    if (calls.length === 0) return;
    const headers = ['Name', 'Phone', 'Loan Account', 'Overdue', 'Bucket', 'Language', 'Status', 'Outcome', 'PTP Date', 'PTP Amount', 'Duration'];
    const rows = calls.map((call) => [
      call.borrower?.name || '', call.borrower?.phone || '', call.borrower?.loan_account || '',
      String(call.borrower?.overdue_amount || ''), call.borrower?.bucket || '', call.borrower?.language || '',
      call.status, call.outcome || '', call.ptp_date || '', String(call.ptp_amount || ''), String(call.duration_seconds || ''),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign?.name || 'campaign'}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ptpRate = metrics && metrics.completed_calls > 0 ? Math.round((metrics.ptp_count / metrics.completed_calls) * 100) : 0;
  const queuedCount = calls.filter((c) => c.status === 'queued').length;
  const completedCount = calls.filter((c) => c.status === 'completed').length;

  if (!campaign && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle className="w-10 h-10 mb-3" style={{ color: '#FF4757' }} />
        <p className="text-[14px] font-medium" style={{ color: '#8A8F9E' }}>Campaign not found</p>
        <button className="mt-4 flex items-center gap-2 text-[12px] font-medium" style={{ color: '#4D9EFF' }} onClick={() => navigate('/campaigns')}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to campaigns
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative" style={{ color: '#E8EAF0' }}>
      {/* Toast */}
      {toast.visible && (
        <div
          className="fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg z-50 transition-all"
          style={{ backgroundColor: '#1A1E26', border: '1px solid #242830' }}
        >
          <p className="text-[12px] font-medium" style={{ color: '#E8EAF0' }}>{toast.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-md transition-colors" style={{ backgroundColor: '#111318' }} onClick={() => navigate('/campaigns')}>
            <ArrowLeft className="w-4 h-4" style={{ color: '#8A8F9E' }} />
          </button>
          <div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-[20px] font-bold px-3 py-1 rounded-md outline-none"
                  style={{ backgroundColor: '#1A1E26', border: '1px solid #4D9EFF', color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}
                  autoFocus
                />
                <button className="p-1.5 rounded" style={{ backgroundColor: '#00E5A0' }} onClick={handleNameSave}>
                  <Check className="w-3.5 h-3.5 text-black" />
                </button>
                <button className="p-1.5 rounded" style={{ backgroundColor: '#FF4757' }} onClick={() => setIsEditingName(false)}>
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold" style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>{campaign?.name || 'Campaign'}</h1>
                <button className="p-1 rounded opacity-0 hover:opacity-100 transition-opacity" onClick={() => { setEditName(campaign?.name || ''); setIsEditingName(true); }}>
                  <Edit2 className="w-3.5 h-3.5" style={{ color: '#4E5464' }} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              {campaign && <StatusChip status={campaign.status} size="sm" />}
              <span className="text-[12px]" style={{ color: '#4E5464', fontFamily: "'IBM Plex Mono', monospace" }}>
                Created {campaign ? formatDate(campaign.created_at) : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campaign?.status === 'running' ? (
            <button className="flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: 'rgba(245, 166, 35, 0.15)', color: '#F5A623', fontFamily: "'DM Sans', sans-serif" }}
              onClick={handlePauseCampaign}>
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
          ) : campaign?.status !== 'completed' ? (
            <button className="flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: '#00E5A0', color: '#000', fontFamily: "'DM Sans', sans-serif" }}
              onClick={handleRunCampaign} disabled={isRunning}>
              <Play className="w-3.5 h-3.5" /> {isRunning ? 'Starting...' : 'Run Campaign'}
            </button>
          ) : null}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Accounts" value={campaign?.total_accounts?.toString() || '0'} icon={Phone} loading={loading} />
        <MetricCard label="Queued" value={queuedCount.toString()} icon={Phone} loading={loading} />
        <MetricCard label="Completed" value={completedCount.toString()} delta={`${metrics?.avg_duration_seconds ? Math.round(metrics.avg_duration_seconds) : 0}s avg`} deltaPositive={true} icon={TrendingUp} loading={loading} />
        <MetricCard label="PTP Rate" value={`${ptpRate}%`} delta={metrics ? `${metrics.ptp_count} PTPs` : ''} deltaPositive={ptpRate > 20} icon={TrendingUp} loading={loading} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md flex-1 max-w-xs" style={{ backgroundColor: '#111318', border: '1px solid #242830' }}>
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4E5464' }} />
          <input type="text" placeholder="Search by name or phone..." value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="bg-transparent outline-none text-[12px] w-full" style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }} />
        </div>
        <select value={filters.outcome} onChange={(e) => setFilters({ ...filters, outcome: e.target.value })}
          className="px-3 py-2 rounded-md text-[12px] outline-none cursor-pointer"
          style={{ backgroundColor: '#111318', border: '1px solid #242830', color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>
          <option value="all">All Outcomes</option>
          <option value="ptp_confirmed">PTP Confirmed</option>
          <option value="disputed">Disputed</option>
          <option value="callback_requested">Callback Requested</option>
          <option value="escalate">Escalated</option>
          <option value="no_answer">No Answer</option>
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 rounded-md text-[12px] outline-none cursor-pointer"
          style={{ backgroundColor: '#111318', border: '1px solid #242830', color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>
          <option value="all">All Status</option>
          <option value="queued">Queued</option>
          <option value="calling">Calling</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-medium transition-all hover:opacity-80"
          style={{ backgroundColor: '#111318', border: '1px solid #242830', color: '#8A8F9E', fontFamily: "'DM Sans', sans-serif" }}
          onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Call Queue Table */}
      <CallTable calls={calls} loading={loading} />
    </div>
  );
}
