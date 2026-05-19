/**
 * POST /api/webhook/bolna
 * 
 * Bolna calls this endpoint when a voice call completes.
 * It updates the call record in Supabase with the outcome.
 * 
 * SECURITY: Validate x-bolna-secret header against BOLNA_WEBHOOK_SECRET
 * ERROR HANDLING: Never return 5xx - Bolna retries on 5xx and creates duplicates
 */

import { supabase } from '@/lib/supabase';

export interface BolnaWebhookPayload {
  call_id: string;           // Bolna's internal call ID
  status: 'completed' | 'failed' | 'no_answer';
  duration: number;          // seconds
  transcript: string;        // full transcript text
  extracted_data: {
    outcome: 'ptp_confirmed' | 'disputed' | 'callback_requested' | 'escalate' | 'no_answer' | 'failed';
    ptp_date?: string;       // ISO date string if PTP confirmed
    ptp_amount?: number;     // rupees if PTP confirmed
  };
}

export interface BolnaWebhookResponse {
  success: boolean;
  error?: string;
}

const BOLNA_WEBHOOK_SECRET = import.meta.env.VITE_BOLNA_WEBHOOK_SECRET || '';

export async function POST(request: Request): Promise<Response> {
  try {
    // 1. Validate webhook secret
    const secret = request.headers.get('x-bolna-secret');
    if (BOLNA_WEBHOOK_SECRET && secret !== BOLNA_WEBHOOK_SECRET) {
      return Response.json(
        { success: false, error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    // 2. Parse payload
    const payload: BolnaWebhookPayload = await request.json();

    if (!payload.call_id) {
      return Response.json(
        { success: false, error: 'Missing call_id' },
        { status: 200 } // Return 200 so Bolna doesn't retry
      );
    }

    // 3. Find the call record by bolna_call_id
    const { data: callData, error: findError } = await supabase
      .from('calls')
      .select('id')
      .eq('bolna_call_id', payload.call_id)
      .single();

    if (findError || !callData) {
      console.error('Call not found for bolna_call_id:', payload.call_id);
      return Response.json(
        { success: false, error: 'Call not found' },
        { status: 200 } // Return 200 so Bolna doesn't retry
      );
    }

    // 4. Update the call record
    const { error: updateError } = await supabase
      .from('calls')
      .update({
        status: payload.status,
        outcome: payload.extracted_data.outcome,
        ptp_date: payload.extracted_data.ptp_date || null,
        ptp_amount: payload.extracted_data.ptp_amount || null,
        transcript: payload.transcript,
        duration_seconds: payload.duration,
        ended_at: new Date().toISOString(),
      })
      .eq('id', callData.id);

    if (updateError) {
      console.error('Error updating call from webhook:', updateError);
      return Response.json(
        { success: false, error: 'Database update failed' },
        { status: 200 } // Return 200 so Bolna doesn't retry
      );
    }

    // 5. Return success
    return Response.json({ success: true });

  } catch (error) {
    // CRITICAL: Never return 5xx - catch all errors
    console.error('Webhook handler error:', error);
    return Response.json(
      { success: false, error: 'Internal processing error' },
      { status: 200 } // Return 200 so Bolna doesn't retry
    );
  }
}
