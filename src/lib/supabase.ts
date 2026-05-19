import { createClient } from '@supabase/supabase-js';
import type { Borrower, Campaign, Call, CallWithBorrower, CampaignMetrics } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a mock client for demo when no credentials provided
function createMockClient() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
        count: 'exact',
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
    channel: () => ({
      on: () => ({
        subscribe: () => ({}),
      }),
    }),
    removeChannel: () => {},
  } as any;
}

// Single client instance for the browser
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    : createMockClient();

// Campaign operations
export async function fetchCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }

  return (data || []).map((campaign: any) => ({
    ...campaign,
    name: campaign.campaign_name,
    total_accounts: campaign.total_customers,
  }));
}

export async function fetchCampaign(id: string): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching campaign:', error);
    return null;
  }

  return data;
}

export async function createCampaign(
  name: string,
  totalAccounts: number
): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      campaign_name: name,
      total_customers: totalAccounts,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating campaign:', error);
    return null;
  }

  return data;
}

export async function updateCampaignStatus(
  id: string,
  status: string
): Promise<boolean> {
  const { error } = await supabase
    .from('campaigns')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Error updating campaign:', error);
    return false;
  }

  return true;
}

export async function updateCampaignName(
  id: string,
  name: string
): Promise<boolean> {
  const { error } = await supabase
    .from('campaigns')
    .update({ campaign_name: name })
    .eq('id', id);

  if (error) {
    console.error('Error updating campaign name:', error);
    return false;
  }

  return true;
}

// Borrower operations
export async function insertBorrowers(
  borrowers: Omit<Borrower, 'id' | 'created_at'>[]
): Promise<Borrower[]> {
  const { data, error } = await supabase
    .from('borrowers')
    .insert(borrowers)
    .select();

  if (error) {
    console.error('Error inserting borrowers:', error);
    return [];
  }

  return data || [];
}

// Call operations
export async function createCalls(
  calls: Omit<Call, 'id' | 'created_at'>[]
): Promise<Call[]> {
  const { data, error } = await supabase
    .from('calls')
    .insert(calls)
    .select();

  if (error) {
    console.error('Error creating calls:', error);
    return [];
  }

  return data || [];
}

export async function fetchCalls(
  campaignId?: string,
  filters?: {
    outcome?: string;
    status?: string;
    search?: string;
  }
): Promise<CallWithBorrower[]> {
  let query = supabase
    .from('calls')
    .select('*, borrower:borrowers(*)');

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  if (filters?.outcome && filters.outcome !== 'all') {
    query = query.eq('outcome', filters.outcome);
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query.order('created_at', {
    ascending: true,
  });

  if (error) {
    console.error('Error fetching calls:', error);
    return [];
  }

  let calls = data || [];

  // Client-side search
  if (filters?.search) {
    const search = filters.search.toLowerCase();

    calls = calls.filter(
      (call: CallWithBorrower) =>
        call.borrower?.name?.toLowerCase().includes(search) ||
        call.borrower?.phone?.includes(search)
    );
  }

  return calls;
}

export async function fetchCall(
  id: string
): Promise<CallWithBorrower | null> {
  const { data, error } = await supabase
    .from('calls')
    .select('*, borrower:borrowers(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching call:', error);
    return null;
  }

  return data;
}

export async function updateCallStatus(
  id: string,
  updates: Partial<Call>
): Promise<boolean> {
  const { error } = await supabase
    .from('calls')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating call:', error);
    return false;
  }

  return true;
}

export async function fetchCampaignMetrics(
  campaignId: string
): Promise<CampaignMetrics | null> {
  const { data, error } = await supabase
    .from('campaign_metrics')
    .select('*')
    .eq('campaign_id', campaignId)
    .single();

  if (error) {
    console.error('Error fetching metrics:', error);
    return null;
  }

  return data;
}

export async function fetchDashboardMetrics(): Promise<{
  totalCalls: number;
  completedCalls: number;
  ptpCount: number;
  ptpAmount: number;
  connectRate: number;
  ptpRate: number;
}> {
  // Get all calls
  const { data: calls, error } = await supabase
    .from('calls')
    .select('*');

  if (error || !calls) {
    return {
      totalCalls: 0,
      completedCalls: 0,
      ptpCount: 0,
      ptpAmount: 0,
      connectRate: 0,
      ptpRate: 0,
    };
  }

  const totalCalls = calls.length;

  const completedCalls = calls.filter(
    (c: any) => c.call_status === 'completed'
  ).length;

  const ptpCount = calls.filter(
    (c: any) => c.call_outcome === 'PTP_CONFIRMED'
  ).length;

  const ptpAmount = calls
    .filter(
      (c: any) => c.call_outcome === 'PTP_CONFIRMED'
    )
    .reduce(
      (sum: number, c: any) => sum + (c.ptp_amount || 0),
      0
    );

  const connectRate =
    totalCalls > 0
      ? Math.round((completedCalls / totalCalls) * 100)
      : 0;

  const ptpRate =
    completedCalls > 0
      ? Math.round((ptpCount / completedCalls) * 100)
      : 0;

  return {
    totalCalls,
    completedCalls,
    ptpCount,
    ptpAmount,
    connectRate,
    ptpRate,
  };
}

export async function fetchCallVolumeByHour(): Promise<
  { hour: string; count: number }[]
> {
  const { data: calls, error } = await supabase
    .from('calls')
    .select('created_at');

  if (error || !calls) {
    return [];
  }

  const hourCounts: Record<string, number> = {};

  // Initialize all hours from 9 AM to 8 PM
  for (let i = 9; i <= 20; i++) {
    const hour = `${i % 12 || 12} ${
      i < 12 ? 'AM' : 'PM'
    }`;

    hourCounts[hour] = 0;
  }

  calls.forEach((call: any) => {
    if (call.created_at) {
      const date = new Date(call.created_at);

      const hour24 = date.getHours();

      if (hour24 >= 9 && hour24 <= 20) {
        const hour = `${hour24 % 12 || 12} ${
          hour24 < 12 ? 'AM' : 'PM'
        }`;

        hourCounts[hour] =
          (hourCounts[hour] || 0) + 1;
      }
    }
  });

  return Object.entries(hourCounts).map(
    ([hour, count]) => ({
      hour,
      count,
    })
  );
}

export async function fetchOutcomeBreakdown(): Promise<
  { name: string; value: number; color: string }[]
> {
  const { data: calls, error } = await supabase
    .from('calls')
    .select('call_outcome');

  if (error || !calls) {
    return [];
  }

  const outcomeColors: Record<string, string> = {
    PTP_CONFIRMED: '#00E5A0',
    DISPUTED: '#FF4757',
    CALLBACK_REQUESTED: '#F5A623',
    ESCALATE: '#A78BFA',
    no_answer: '#4E5464',
    failed: '#FF4757',
  };

  const outcomeLabels: Record<string, string> = {
    PTP_CONFIRMED: 'PTP Confirmed',
    DISPUTED: 'Disputed',
    CALLBACK_REQUESTED: 'Callback',
    ESCALATE: 'Escalated',
    no_answer: 'No Answer',
    failed: 'Failed',
  };

  const counts: Record<string, number> = {};

  calls.forEach((call: any) => {
    const outcome =
      call.call_outcome || 'no_answer';

    counts[outcome] =
      (counts[outcome] || 0) + 1;
  });

  return Object.entries(counts).map(
    ([outcome, value]) => ({
      name:
        outcomeLabels[outcome] || outcome,
      value,
      color:
        outcomeColors[outcome] || '#4E5464',
    })
  );
}

// Trigger call via API
export async function triggerCall(
  callId: string
): Promise<{
  success: boolean;
  bolnaCallId?: string;
  error?: string;
}> {
  try {
    const response = await fetch(
      '/api/calls/trigger',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call_id: callId,
        }),
      }
    );

    const result = await response.json();

    return result;
  } catch (error) {
    console.error(
      'Error triggering call:',
      error
    );

    return {
      success: false,
      error: 'Failed to trigger call',
    };
  }
}

// Webhook handler
export async function handleBolnaWebhook(payload: {
  call_id: string;
  status: string;
  duration: number;
  transcript: string;
  extracted_data: {
    outcome: string;
    ptp_date?: string;
    ptp_amount?: number;
  };
}): Promise<boolean> {
  try {
    // Find the call by bolna_call_id
    const { data: callData, error: findError } =
      await supabase
        .from('calls')
        .select('id')
        .eq(
          'bolna_call_id',
          payload.call_id
        )
        .single();

    if (findError || !callData) {
      console.error(
        'Call not found for bolna_call_id:',
        payload.call_id
      );

      return false;
    }

    // Update the call
    const { error: updateError } =
      await supabase
        .from('calls')
        .update({
          status: payload.status,
          outcome:
            payload.extracted_data.outcome,
          ptp_date:
            payload.extracted_data.ptp_date ||
            null,
          ptp_amount:
            payload.extracted_data
              .ptp_amount || null,
          transcript: payload.transcript,
          duration_seconds:
            payload.duration,
          ended_at:
            new Date().toISOString(),
        })
        .eq('id', callData.id);

    if (updateError) {
      console.error(
        'Error updating call from webhook:',
        updateError
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      'Webhook handler error:',
      error
    );

    return false;
  }
}