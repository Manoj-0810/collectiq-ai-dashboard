import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

if (!process.env.SUPABASE_URL) {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, '.env.local'),
    path.join(cwd, '.env'),
    path.join(cwd, 'app', '.env.local'),
    path.join(cwd, 'app', '.env'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const parts = trimmed.split('=');
            if (parts.length >= 2) {
              const key = parts[0].trim();
              const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
              if (!process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        }
        if (process.env.SUPABASE_URL) {
          break;
        }
      }
    } catch (_) {}
  }
}

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
) 
export default async function handler(
  req: { method: string; body: { borrower_name: string; phone_number: string; overdue_amount: number; due_date: string; loan_account: string; language?: string; call_id: string } },
  res: { status: (code: number) => { json: (body: unknown) => void } }
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

          Authorization: `Bearer ${process.env.BOLNA_API_KEY}`,
        },

        body: JSON.stringify({
          agent_id:
            process.env.BOLNA_AGENT_ID,

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
    let bolnaData: any = {};
    try {
      bolnaData = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Bolna response JSON:', e);
    }

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
  } catch (error: unknown) {
    console.error(
      'Trigger call error:',
      error
    )

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    })
  }
}