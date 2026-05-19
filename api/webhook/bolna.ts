import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  try {
    const body = req.body;

    console.log('Bolna webhook received:', body);

    const {
      call_id,
      outcome,
      transcript,
      summary,
      ptp_amount,
      ptp_date,
      duration_seconds,
    } = body;

    await supabase
      .from('calls')
      .update({
        call_status: 'completed',
        call_outcome: outcome || 'completed',
        transcript: transcript || '',
        summary: summary || '',
        ptp_amount: ptp_amount || 0,
        ptp_date: ptp_date || null,
        duration_seconds: duration_seconds || 0,
      })
      .eq('bolna_call_id', call_id);

    return res.status(200).json({
      success: true,
    });

  } catch (error: any) {
    console.error('Webhook error:', error);

    return res.status(500).json({
      error: error.message,
    });
  }
}