import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  User,
  Clock,
  FileText,
  Hash,
  PhoneCall,
} from 'lucide-react';

import { fetchCall } from '@/lib/supabase';

import { StatusChip } from '@/components/ui/StatusChip';

import {
  formatINR,
  formatPhone,
  formatDuration,
  formatDateTime,
  formatDate,
  outcomeLabel,
  bucketLabel,
  parseTranscript,
} from '@/lib/utils';

import type { CallWithBorrower } from '@/types';

export function CallDetailPage() {
  const { id } = useParams<{
    id: string;
  }>();

  const navigate = useNavigate();

  const [call, setCall] =
    useState<CallWithBorrower | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [triggering, setTriggering] =
    useState(false);

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

  // Trigger AI Call
  const triggerCall = async () => {
    if (!call) return;
  
    try {
      setTriggering(true);
  
      const response = await fetch(
        '/api/calls',
        {
          method: 'POST',
  
          headers: {
            'Content-Type':
              'application/json',
          },
  
          body: JSON.stringify({
            call_id: call.id,
          }),
        }
      );
  
      let data;
  
      try {
        data = await response.json();
      } catch {
        throw new Error(
          'Invalid server response'
        );
      }
  
      console.log(
        'Call response:',
        data
      );
  
      if (
        response.ok &&
        data.success
      ) {
        alert(
          'AI call triggered successfully!'
        );
      } else {
        alert(
          data.error ||
            data.message ||
            'Failed to trigger AI call'
        );
      }
    } catch (error) {
      console.error(error);
  
      alert('Something went wrong');
    } finally {
      setTriggering(false);
    }
  };
  const transcript = call?.transcript
    ? parseTranscript(call.transcript)
    : [];

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
        <Phone
          className="w-10 h-10 mb-3"
          style={{ color: '#4E5464' }}
        />

        <p
          className="text-[14px] font-medium"
          style={{ color: '#8A8F9E' }}
        >
          Call not found
        </p>

        <button
          className="mt-4 flex items-center gap-2 text-[12px] font-medium"
          style={{ color: '#4D9EFF' }}
          onClick={() =>
            navigate('/campaigns')
          }
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to campaigns
        </button>
      </div>
    );
  }

  return (
    <div
      className="max-w-5xl mx-auto space-y-6"
      style={{ color: '#E8EAF0' }}
    >
      <button
        className="flex items-center gap-2 text-[12px] font-medium transition-colors hover:opacity-80"
        style={{
          color: '#4D9EFF',
          fontFamily:
            "'DM Sans', sans-serif",
        }}
        onClick={() =>
          navigate(
            `/campaigns/${call.campaign_id}`
          )
        }
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to campaign
      </button>

      <div className="grid grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="col-span-3 space-y-4">
          {/* Borrower Info Card */}
          <div
            className="rounded-lg p-5"
            style={{
              backgroundColor:
                '#111318',

              border:
                '1px solid #242830',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor:
                      '#1A1E26',
                  }}
                >
                  <User
                    className="w-5 h-5"
                    style={{
                      color: '#4D9EFF',
                    }}
                  />
                </div>

                <div>
                  <h2
                    className="text-[16px] font-bold"
                    style={{
                      color: '#E8EAF0',
                      fontFamily:
                        "'DM Sans', sans-serif",
                    }}
                  >
                    {call.borrower?.name ||
                      'Unknown'}
                  </h2>

                  <p
                    className="text-[12px]"
                    style={{
                      color: '#4E5464',
                      fontFamily:
                        "'IBM Plex Mono', monospace",
                    }}
                  >
                    {formatPhone(
                      call.borrower?.phone ||
                        ''
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={triggerCall}
                  disabled={triggering}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor:
                      '#4D9EFF',
                    color: '#fff',
                  }}
                >
                  <PhoneCall className="w-3.5 h-3.5" />

                  {triggering
                    ? 'Calling...'
                    : 'Trigger AI Call'}
                </button>

                <StatusChip
                  status={call.status}
                  size="md"
                  pulse={
                    call.status ===
                    'calling'
                  }
                />
              </div>
            </div>

            <div
              className="grid grid-cols-3 gap-4 pt-4"
              style={{
                borderTop:
                  '1px solid #242830',
              }}
            >
              <div>
                <p
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{
                    color: '#4E5464',
                  }}
                >
                  Loan Account
                </p>

                <p
                  className="text-[13px] font-medium"
                  style={{
                    color: '#E8EAF0',
                    fontFamily:
                      "'IBM Plex Mono', monospace",
                  }}
                >
                  {call.borrower
                    ?.loan_account || '—'}
                </p>
              </div>

              <div>
                <p
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{
                    color: '#4E5464',
                  }}
                >
                  Overdue Amount
                </p>

                <p
                  className="text-[13px] font-semibold"
                  style={{
                    color: '#00E5A0',
                    fontFamily:
                      "'IBM Plex Mono', monospace",
                  }}
                >
                  {formatINR(
                    call.borrower
                      ?.overdue_amount || 0
                  )}
                </p>
              </div>

              <div>
                <p
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{
                    color: '#4E5464',
                  }}
                >
                  Due Date
                </p>

                <p
                  className="text-[13px] font-medium"
                  style={{
                    color: '#E8EAF0',
                    fontFamily:
                      "'IBM Plex Mono', monospace",
                  }}
                >
                  {call.borrower?.due_date
                    ? formatDate(
                        call.borrower
                          .due_date
                      )
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Rest of your original file remains EXACTLY SAME */}
        </div>
      </div>
    </div>
  );
}