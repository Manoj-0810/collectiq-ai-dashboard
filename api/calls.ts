import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  try {
    const { call_id } = req.body

    if (!call_id) {
      return res.status(400).json({
        error: 'Missing call_id',
      })
    }

    // Fetch call details
    const { data: call, error: callError } =
      await supabase
        .from('calls')
        .select('*')
        .eq('id', call_id)
        .single()

    if (callError || !call) {
      console.error(callError)

      return res.status(404).json({
        error: 'Call not found',
      })
    }

    // Trigger Bolna outbound call
    const bolnaResponse = await fetch(
      'https://api.bolna.ai/v1/call',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.VITE_BOLNA_API_KEY}`,
        },
        body: JSON.stringify({
          agent_id: process.env.VITE_BOLNA_AGENT_ID,
          phone_number: call.phone_number,
          customer_name: call.borrower_name,
          metadata: {
            call_id: call.id,
          },
        }),
      }
    )

    const bolnaData = await bolnaResponse.json()

    console.log('Bolna response:', bolnaData)

    // Save Bolna call ID + update status
    const { error: updateError } =
      await supabase
        .from('calls')
        .update({
          bolna_call_id:
            bolnaData.call_id || null,
          call_status: 'initiated',
        })
        .eq('id', call.id)

    if (updateError) {
      console.error(updateError)

      return res.status(500).json({
        error: 'Failed to update call',
      })
    }

    return res.status(200).json({
      success: true,
      bolna: bolnaData,
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: 'Failed to trigger call',
    })
  }
}