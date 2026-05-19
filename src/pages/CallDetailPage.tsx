import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, User, Clock, FileText, Hash } from 'lucide-react';
import { fetchCall } from '@/lib/supabase';
import { StatusChip } from '@/components/ui/StatusChip';
import {
  formatINR, formatPhone, formatDuration, formatDateTime, formatDate,
  outcomeLabel, bucketLabel, parseTranscript,
} from '@/lib/utils';
import type { CallWithBorrower } from '@/types';

export function CallDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [call, setCall] = useState<CallWithBorrower | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      const data = await fetchCall(id);
      setCall(data);
      setLoading(false);
    }
    load();
  }, [id]);

  const transcript = call?.transcript ? parseTranscript(call.transcript) : [];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="skeleton-shimmer h-8 w-64 rounded" />
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 space-y-4">
            <div className="skeleton-shimmer h-40 rounded-lg" />
            <div className="skeleton-shimmer h-32 rounded-lg" />
          </div>
          <div className="col-span-2">
            <div className="skeleton-shimmer h-80 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Phone className="w-10 h-10 mb-3" style={{ color: '#4E5464' }} />
        <p className="text-[14px] font-medium" style={{ color: '#8A8F9E' }}>Call not found</p>
        <button className="mt-4 flex items-center gap-2 text-[12px] font-medium" style={{ color: '#4D9EFF' }} onClick={() => navigate('/campaigns')}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to campaigns
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6" style={{ color: '#E8EAF0' }}>
      <button className="flex items-center gap-2 text-[12px] font-medium transition-colors hover:opacity-80"
        style={{ color: '#4D9EFF', fontFamily: "'DM Sans', sans-serif" }}
        onClick={() => navigate(`/campaigns/${call.campaign_id}`)}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back to campaign
      </button>

      <div className="grid grid-cols-5 gap-6">
        {/* Left Column - 60% */}
        <div className="col-span-3 space-y-4">
          {/* Borrower Info Card */}
          <div className="rounded-lg p-5" style={{ backgroundColor: '#111318', border: '1px solid #242830' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1A1E26' }}>
                  <User className="w-5 h-5" style={{ color: '#4D9EFF' }} />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold" style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>{call.borrower?.name || 'Unknown'}</h2>
                  <p className="text-[12px]" style={{ color: '#4E5464', fontFamily: "'IBM Plex Mono', monospace" }}>{formatPhone(call.borrower?.phone || '')}</p>
                </div>
              </div>
              <StatusChip status={call.status} size="md" pulse={call.status === 'calling'} />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: '1px solid #242830' }}>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#4E5464' }}>Loan Account</p>
                <p className="text-[13px] font-medium" style={{ color: '#E8EAF0', fontFamily: "'IBM Plex Mono', monospace" }}>{call.borrower?.loan_account || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#4E5464' }}>Overdue Amount</p>
                <p className="text-[13px] font-semibold" style={{ color: '#00E5A0', fontFamily: "'IBM Plex Mono', monospace" }}>{formatINR(call.borrower?.overdue_amount || 0)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#4E5464' }}>Due Date</p>
                <p className="text-[13px] font-medium" style={{ color: '#E8EAF0', fontFamily: "'IBM Plex Mono', monospace" }}>{call.borrower?.due_date ? formatDate(call.borrower.due_date) : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#4E5464' }}>Bucket</p>
                <p className="text-[13px] font-medium" style={{ color: '#8A8F9E', fontFamily: "'IBM Plex Mono', monospace" }}>{bucketLabel(call.borrower?.bucket || '')}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#4E5464' }}>Language</p>
                <p className="text-[13px] font-medium capitalize" style={{ color: '#8A8F9E' }}>{call.borrower?.language || '—'}</p>
              </div>
            </div>
          </div>

          {/* Outcome Card */}
          <div className="rounded-lg p-5" style={{ backgroundColor: '#111318', border: '1px solid #242830' }}>
            <h3 className="text-[13px] font-semibold mb-4 flex items-center gap-2" style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>
              <FileText className="w-4 h-4" style={{ color: '#F5A623' }} /> Outcome
            </h3>
            {call.outcome ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[24px] font-bold px-3 py-1.5 rounded-lg"
                    style={{
                      backgroundColor: call.outcome === 'ptp_confirmed' ? 'rgba(0, 229, 160, 0.1)' : call.outcome === 'disputed' || call.outcome === 'failed' ? 'rgba(255, 71, 87, 0.1)' : call.outcome === 'callback_requested' ? 'rgba(245, 166, 35, 0.1)' : call.outcome === 'escalate' ? 'rgba(167, 139, 250, 0.1)' : '#1A1E26',
                      color: call.outcome === 'ptp_confirmed' ? '#00E5A0' : call.outcome === 'disputed' || call.outcome === 'failed' ? '#FF4757' : call.outcome === 'callback_requested' ? '#F5A623' : call.outcome === 'escalate' ? '#A78BFA' : '#8A8F9E',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                    {outcomeLabel(call.outcome)}
                  </span>
                </div>
                {call.ptp_date && (
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#4E5464' }}>PTP Date</p>
                      <p className="text-[14px] font-semibold" style={{ color: '#E8EAF0', fontFamily: "'IBM Plex Mono', monospace" }}>{formatDate(call.ptp_date)}</p>
                    </div>
                    {call.ptp_amount && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#4E5464' }}>PTP Amount</p>
                        <p className="text-[14px] font-semibold" style={{ color: '#00E5A0', fontFamily: "'IBM Plex Mono', monospace" }}>{formatINR(call.ptp_amount)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[13px]" style={{ color: '#4E5464' }}>No outcome recorded yet</p>
            )}
          </div>

          {/* Call Metadata */}
          <div className="rounded-lg p-5" style={{ backgroundColor: '#111318', border: '1px solid #242830' }}>
            <h3 className="text-[13px] font-semibold mb-4 flex items-center gap-2" style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>
              <Clock className="w-4 h-4" style={{ color: '#4D9EFF' }} /> Call Metadata
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#4E5464' }}>Started At</p>
                <p className="text-[12px] font-medium" style={{ color: '#8A8F9E', fontFamily: "'IBM Plex Mono', monospace" }}>{call.started_at ? formatDateTime(call.started_at) : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#4E5464' }}>Duration</p>
                <p className="text-[12px] font-medium" style={{ color: '#8A8F9E', fontFamily: "'IBM Plex Mono', monospace" }}>{formatDuration(call.duration_seconds)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#4E5464' }}><Hash className="w-3 h-3 inline mr-1" />Bolna Call ID</p>
                <p className="text-[12px] font-medium truncate" style={{ color: '#4E5464', fontFamily: "'IBM Plex Mono', monospace" }}>{call.bolna_call_id || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 40% - Transcript */}
        <div className="col-span-2">
          <div className="rounded-lg p-5" style={{ backgroundColor: '#111318', border: '1px solid #242830', minHeight: '500px' }}>
            <h3 className="text-[13px] font-semibold mb-4 flex items-center gap-2" style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>
              <FileText className="w-4 h-4" style={{ color: '#A78BFA' }} /> Transcript
            </h3>
            {call.transcript ? (
              <div className="space-y-3">
                {transcript.map((bubble, i) => (
                  <div key={i} className={`flex ${bubble.speaker === 'Customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%] px-3.5 py-2.5 rounded-lg"
                      style={{
                        backgroundColor: bubble.speaker === 'Agent' ? '#1A1E26' : '#111318',
                        border: bubble.speaker === 'Customer' ? '1px solid #242830' : '1px solid transparent',
                      }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase"
                          style={{ color: bubble.speaker === 'Agent' ? '#4D9EFF' : '#00E5A0', fontFamily: "'DM Sans', sans-serif" }}>
                          {bubble.speaker}
                        </span>
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>{bubble.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="space-y-2 w-full max-w-[200px]">
                  <div className="skeleton-shimmer h-3 w-full rounded" />
                  <div className="skeleton-shimmer h-3 w-3/4 rounded" />
                  <div className="skeleton-shimmer h-3 w-full rounded" />
                  <div className="skeleton-shimmer h-3 w-2/3 rounded" />
                </div>
                <p className="text-[12px] mt-4" style={{ color: '#4E5464', fontFamily: "'DM Sans', sans-serif" }}>Transcript processing...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
