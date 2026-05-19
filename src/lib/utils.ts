import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TranscriptBubble } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format rupees: 45000 → "₹45,000" | 1500000 → "₹15 L" | 10000000 → "₹1 Cr"
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 10000000) {
    // Crores
    const crores = (absAmount / 10000000).toFixed(1);
    return `₹${parseFloat(crores)} Cr`;
  } else if (absAmount >= 100000) {
    // Lakhs
    const lakhs = (absAmount / 100000).toFixed(1);
    return `₹${parseFloat(lakhs)} L`;
  } else if (absAmount >= 1000) {
    // Thousands with comma
    return `₹${absAmount.toLocaleString('en-IN')}`;
  } else {
    return `₹${absAmount}`;
  }
}

// Format duration: 154 → "2m 34s"
export function formatDuration(seconds: number | null): string {
  if (!seconds || isNaN(seconds)) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

// Format phone for display: "9876543210" → "98765 43210"
export function formatPhone(phone: string): string {
  if (!phone) return '—';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return cleaned;
}

// Parse transcript text into bubbles
export function parseTranscript(raw: string): TranscriptBubble[] {
  if (!raw) return [];
  
  const lines = raw.split('\n').filter(line => line.trim());
  const bubbles: TranscriptBubble[] = [];
  
  for (const line of lines) {
    const agentMatch = line.match(/^Agent:\s*(.+)/i);
    const customerMatch = line.match(/^Customer:\s*(.+)/i);
    
    if (agentMatch) {
      bubbles.push({
        speaker: 'Agent',
        text: agentMatch[1].trim(),
      });
    } else if (customerMatch) {
      bubbles.push({
        speaker: 'Customer',
        text: customerMatch[1].trim(),
      });
    } else if (bubbles.length > 0) {
      // Append to last bubble if no speaker prefix
      bubbles[bubbles.length - 1].text += ' ' + line.trim();
    }
  }
  
  return bubbles;
}

// Get outcome label for display
export function outcomeLabel(outcome: string | null): string {
  if (!outcome) return 'Pending';
  const labels: Record<string, string> = {
    'ptp_confirmed': 'PTP Confirmed',
    'disputed': 'Disputed',
    'callback_requested': 'Callback Requested',
    'escalate': 'Escalated',
    'no_answer': 'No Answer',
    'failed': 'Failed',
  };
  return labels[outcome] || outcome;
}

// Get bucket label
export function bucketLabel(bucket: string): string {
  if (!bucket) return '—';
  return `${bucket} DPD`;
}

// Get status label
export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    'queued': 'Queued',
    'calling': 'Calling',
    'completed': 'Completed',
    'failed': 'Failed',
    'no_answer': 'No Answer',
    'draft': 'Draft',
    'running': 'Running',
    'paused': 'Paused',
  };
  return labels[status] || status;
}

// Format date for display
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

// Format datetime for display
export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}
