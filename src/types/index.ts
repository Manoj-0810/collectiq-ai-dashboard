export type CallStatus = 'queued' | 'calling' | 'completed' | 'failed' | 'no_answer';

export type CampaignStatus = 'draft' | 'running' | 'paused' | 'completed';

export type Outcome = 'ptp_confirmed' | 'disputed' | 'callback_requested' | 'escalate' | 'no_answer' | 'failed' | null;

export type Bucket = '0-30' | '31-60' | '61-90' | '90+';

export interface Borrower {
  id: string;
  name: string;
  phone: string;
  loan_account: string;
  overdue_amount: number;
  due_date: string;
  language: string;
  bucket: Bucket;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  total_accounts: number;
  created_at: string;
}

export interface Call {
  id: string;
  campaign_id: string;
  borrower_id: string;
  bolna_call_id: string | null;
  status: CallStatus;
  outcome: Outcome;
  ptp_date: string | null;
  ptp_amount: number | null;
  transcript: string | null;
  duration_seconds: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface CallWithBorrower extends Call {
  borrower: Borrower;
}

export interface CampaignMetrics {
  campaign_id: string;
  total_calls: number;
  completed_calls: number;
  ptp_count: number;
  ptp_amount_total: number;
  disputes: number;
  escalations: number;
  avg_duration_seconds: number | null;
}

export interface TranscriptBubble {
  speaker: 'Agent' | 'Customer';
  text: string;
  timestamp?: string;
}

export interface BorrowerRow {
  name: string;
  phone: string;
  loan_account: string;
  overdue_amount: number;
  due_date: string;
  language: string;
  bucket: Bucket;
}
