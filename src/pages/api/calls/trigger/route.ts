/**
 * POST /api/calls/trigger
 * 
 * Triggers a voice call via Bolna API.
 * Fetches call record + borrower, then initiates the call.
 */

import { supabase } from '@/lib/supabase';
import { initiateBolnaCall } from '@/lib/bolna';

export interface TriggerCallRequest {
  call_id: string;
}

export interface TriggerCallResponse {
  success: boolean;
  bolna_call_id?: string;
  error?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { call_id }: TriggerCallRequest = await request.json();

    if (!call_id) {
      return Response.json(
        { success: false, error: 'Missing call_id' },
        { status: 400 }
      );
    }

    // 1. Fetch call record with borrower
    const { data: callData, error: callError } = await supabase
      .from('calls')
      .select('*, borrower:borrowers(*)')
      .eq('id', call_id)
      .single();

    if (callError || !callData) {
      return Response.json(
        { success: false, error: 'Call record not found' },
        { status: 404 }
      );
    }

    const { borrower } = callData;

    if (!borrower) {
      return Response.json(
        { success: false, error: 'Borrower not found' },
        { status: 404 }
      );
    }

    // 2. Initiate Bolna call
    const result = await initiateBolnaCall(call_id, borrower);

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error || 'Failed to initiate call' },
        { status: 500 }
      );
    }

    // 3. Update call record with bolna_call_id and status
    const { error: updateError } = await supabase
      .from('calls')
      .update({
        bolna_call_id: result.bolnaCallId,
        status: 'calling',
        started_at: new Date().toISOString(),
      })
      .eq('id', call_id);

    if (updateError) {
      console.error('Error updating call status:', updateError);
      // Don't fail the request - the call was initiated
    }

    // 4. Return success
    return Response.json({
      success: true,
      bolna_call_id: result.bolnaCallId,
    });

  } catch (error) {
    console.error('Trigger call error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
