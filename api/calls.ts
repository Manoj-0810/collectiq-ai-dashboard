import type {
    VercelRequest,
    VercelResponse,
  } from '@vercel/node'
  
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
    req: VercelRequest,
    res: VercelResponse
  ) {
    // Allow only POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
      })
    }
  
    try {
      const { call_id } = req.body as {
        call_id: string
      }
  
      if (!call_id) {
        return res.status(400).json({
          error: 'Missing call_id',
        })
      }
  
      console.log(
        'Received call_id:',
        call_id
      )
  
      // Fetch call details from Supabase
      const {
        data: call,
        error: callError,
      } = await supabase
        .from('calls')
        .select('*')
        .eq('id', call_id)
        .single()
  
      if (callError || !call) {
        console.error(
          'Supabase fetch error:',
          callError
        )
  
        return res.status(404).json({
          error: 'Call not found',
        })
      }
  
      console.log('Call data:', call)
  
      console.log(
        'Bolna API Key exists:',
        !!process.env.BOLNA_API_KEY
      )
  
      console.log(
        'Bolna Agent ID:',
        process.env.BOLNA_AGENT_ID
      )
  
      // Trigger Bolna API
      const bolnaResponse = await fetch(
        'https://api.bolna.ai/call',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.BOLNA_API_KEY}`,
          },
          body: JSON.stringify({
            agent_id:
              process.env.BOLNA_AGENT_ID,
  
            recipient_phone_number: `+91${call.phone_number}`,
  
            
            user_data: {
              borrower_name:
                call.borrower_name,
            
              loan_account:
                call.loan_account,
            
              overdue_amount: `₹${Number(
                call.overdue_amount
              ).toLocaleString('en-IN')}`,
            
              due_date: call.due_date,
            },
          }),
        }
      )
  
      const bolnaData =
        await bolnaResponse.json()
  
      console.log(
        'Bolna response:',
        bolnaData
      )
  
      // Save Bolna call ID
      const {
        error: updateError,
      } = await supabase
        .from('calls')
        .update({
          bolna_call_id:
            bolnaData.call_id || null,
          call_status: 'initiated',
        })
        .eq('id', call.id)
  
      if (updateError) {
        console.error(
          'Update error:',
          updateError
        )
  
        return res.status(500).json({
          error: 'Failed to update call',
        })
      }
  
      return res.status(200).json({
        success: true,
        bolna: bolnaData,
      })
    } catch (error: unknown) {
      console.error('FULL ERROR:', error)
  
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error',
      })
    }
  }