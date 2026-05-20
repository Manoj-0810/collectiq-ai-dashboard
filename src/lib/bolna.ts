import type { Borrower } from '@/types';

const BOLNA_API_KEY = '';
const BOLNA_AGENT_ID = '';
const BOLNA_API_URL = 'https://api.bolna.dev/call';

interface BolnaCallRequest {
  agent_id: string;
  recipient_phone_number: string;
  user_data: {
    borrower_name: string;
    loan_account: string;
    overdue_amount: number;
    due_date: string;
    language: string;
  };
}

interface BolnaCallResponse {
  call_id: string;
  status: string;
}

export async function initiateBolnaCall(_callId: string, borrower: Borrower): Promise<{ success: boolean; bolnaCallId?: string; error?: string }> {
  try {
    // Check if API key and agent ID are configured
    if (!BOLNA_API_KEY || !BOLNA_AGENT_ID) {
      // For demo purposes, simulate a successful call
      console.log('Bolna not configured, simulating call for:', borrower.name);
      return { 
        success: true, 
        bolnaCallId: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
      };
    }

    const requestBody: BolnaCallRequest = {
      agent_id: BOLNA_AGENT_ID,
      recipient_phone_number: borrower.phone,
      user_data: {
        borrower_name: borrower.name,
        loan_account: borrower.loan_account,
        overdue_amount: borrower.overdue_amount,
        due_date: borrower.due_date,
        language: borrower.language,
      },
    };

    const response = await fetch(BOLNA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BOLNA_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bolna API error:', response.status, errorText);
      return { success: false, error: `Bolna API error: ${response.status}` };
    }

    const result: BolnaCallResponse = await response.json();
    
    return {
      success: true,
      bolnaCallId: result.call_id,
    };
  } catch (error) {
    console.error('Error initiating Bolna call:', error);
    // For demo, return simulated success
    return { 
      success: true, 
      bolnaCallId: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
    };
  }
}

// Simulate call completion for demo purposes
export async function simulateCallCompletion(callId: string): Promise<void> {
  // In a real scenario, Bolna would call our webhook
  // For demo, we simulate the call completing after a random delay
  const delay = 5000 + Math.random() * 10000; // 5-15 seconds
  
  setTimeout(async () => {
    const outcomes = ['ptp_confirmed', 'disputed', 'callback_requested', 'no_answer', 'failed'];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    const { supabase } = await import('./supabase');
    
    await supabase
      .from('calls')
      .update({
        status: 'completed',
        outcome,
        ptp_date: outcome === 'ptp_confirmed' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
        ptp_amount: outcome === 'ptp_confirmed' ? Math.floor(Math.random() * 50000) + 10000 : null,
        duration_seconds: Math.floor(Math.random() * 120) + 30,
        transcript: `Agent: Namaste, main CollectIQ se bol raha hoon. Aapka loan account ${Math.floor(Math.random() * 100000)} mein overdue amount hai.\nCustomer: Ji haan, mujhe pata hai.\nAgent: Kya aap payment kar sakte hain?\nCustomer: Main agle hafte kar dunga.\nAgent: Theek hai, main aapko reminder bhej dunga.`,
        ended_at: new Date().toISOString(),
      })
      .eq('id', callId);
  }, delay);
}
