import { createClient } from '@supabase/supabase-js'
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
) 
export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    })
  }

  try {
    const {
      borrower_name,
      phone_number,
      overdue_amount,
      due_date,
      loan_account,
      language,
      call_id,
    } = req.body

    // Trigger Bolna call
    const response = await fetch(
      'https://api.bolna.ai/call',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',

          Authorization: `Bearer ${process.env.VITE_BOLNA_API_KEY}`,
        },

        body: JSON.stringify({
          agent_id:
            process.env.VITE_BOLNA_AGENT_ID,

          recipient_phone_number: `+91${phone_number}`,

          user_data: {
            borrower_name,

            overdue_amount: `₹${Number(
              overdue_amount
            ).toLocaleString('en-IN')}`,

            due_date,

            loan_account,

            language:
              language || 'hinglish',
          },
        }),
      }
    )
    console.log('Bolna status:', response.status);

    const text = await response.text();

    console.log('Bolna raw response:', text);
    const bolnaData =
      await response.json()

    console.log(
      'Bolna response:',
      bolnaData
    )

    // Update Supabase
    await supabase
      .from('calls')
      .update({
        call_status: 'initiated',

        bolna_call_id:
          bolnaData.call_id || null,
      })
      .eq('id', call_id)

    return res.status(200).json({
      success: true,
      bolna: bolnaData,
    })
  } catch (error: any) {
    console.error(
      'Trigger call error:',
      error
    )

    return res.status(500).json({
      error: error.message,
    })
  }
}