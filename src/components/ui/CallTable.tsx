import { useNavigate } from 'react-router-dom';
import { Eye, Phone, User } from 'lucide-react';
import type { CallWithBorrower } from '@/types';
import { formatINR, formatPhone, formatDuration, formatDate, outcomeLabel, bucketLabel } from '@/lib/utils';
import { StatusChip } from './StatusChip';

interface CallTableProps {
  calls: CallWithBorrower[];
  loading?: boolean;
  onRowClick?: (callId: string) => void;
}

export function CallTable({ calls, loading, onRowClick }: CallTableProps) {
  const navigate = useNavigate();

  const handleRowClick = (callId: string) => {
    if (onRowClick) {
      onRowClick(callId);
    } else {
      navigate(`/calls/${callId}`);
    }
  };

  if (loading) {
    return (
      <div
        className="rounded-lg overflow-hidden"
        style={{
          backgroundColor: '#111318',
          border: '1px solid #242830',
        }}
      >
        <div className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: '1px solid #242830' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-3 w-16 rounded" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 px-5 py-3"
            style={{
              borderBottom: rowIndex < 5 ? '1px solid #242830' : 'none',
              height: '48px',
            }}
          >
            {Array.from({ length: 10 }).map((_, colIndex) => (
              <div key={colIndex} className="skeleton-shimmer h-3 w-full max-w-[80px] rounded" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div
        className="rounded-lg flex flex-col items-center justify-center py-16"
        style={{
          backgroundColor: '#111318',
          border: '1px solid #242830',
        }}
      >
        <Phone className="w-10 h-10 mb-3" style={{ color: '#4E5464' }} />
        <p className="text-[14px] font-medium" style={{ color: '#8A8F9E' }}>
          No calls match your filters
        </p>
        <p className="text-[12px] mt-1" style={{ color: '#4E5464' }}>
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  const columns = [
    { key: 'name', label: 'Borrower', width: '180px' },
    { key: 'phone', label: 'Phone', width: '130px' },
    { key: 'overdue', label: 'Overdue', width: '120px' },
    { key: 'bucket', label: 'Bucket', width: '100px' },
    { key: 'language', label: 'Language', width: '90px' },
    { key: 'status', label: 'Status', width: '120px' },
    { key: 'outcome', label: 'Outcome', width: '130px' },
    { key: 'ptp_date', label: 'PTP Date', width: '110px' },
    { key: 'duration', label: 'Duration', width: '80px' },
    { key: 'actions', label: '', width: '50px' },
  ];

  const outcomeColors: Record<string, { bg: string; text: string }> = {
    ptp_confirmed: { bg: 'rgba(0, 229, 160, 0.15)', text: '#00E5A0' },
    disputed: { bg: 'rgba(255, 71, 87, 0.15)', text: '#FF4757' },
    failed: { bg: 'rgba(255, 71, 87, 0.15)', text: '#FF4757' },
    callback_requested: { bg: 'rgba(245, 166, 35, 0.15)', text: '#F5A623' },
    escalate: { bg: 'rgba(167, 139, 250, 0.15)', text: '#A78BFA' },
    no_answer: { bg: 'rgba(78, 84, 100, 0.15)', text: '#4E5464' },
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: '#111318',
        border: '1px solid #242830',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center px-5"
        style={{
          borderBottom: '1px solid #242830',
          backgroundColor: '#1A1E26',
          height: '40px',
        }}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{
              width: col.width,
              minWidth: col.width,
              color: '#4E5464',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Rows */}
      {calls.map((call, index) => (
        <div
          key={call.id}
          className="flex items-center px-5 cursor-pointer transition-all duration-100 group"
          style={{
            height: '48px',
            borderBottom: index < calls.length - 1 ? '1px solid #242830' : 'none',
          }}
          onClick={() => handleRowClick(call.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1A1E26';
            e.currentTarget.style.borderLeft = '2px solid #4D9EFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderLeft = '2px solid transparent';
          }}
        >
          {/* Borrower name */}
          <div style={{ width: '180px', minWidth: '180px' }} className="flex items-center gap-2 pr-4">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#1A1E26' }}
            >
              <User className="w-3 h-3" style={{ color: '#4E5464' }} />
            </div>
            <span
              className="text-[13px] font-medium truncate"
              style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}
            >
              {call.borrower?.name || 'Unknown'}
            </span>
          </div>

          {/* Phone */}
          <div
            style={{
              width: '130px',
              minWidth: '130px',
              fontFamily: "'IBM Plex Mono', monospace",
              color: '#8A8F9E',
            }}
            className="text-[13px] pr-4"
          >
            {formatPhone(call.borrower?.phone || '')}
          </div>

          {/* Overdue */}
          <div
            style={{
              width: '120px',
              minWidth: '120px',
              fontFamily: "'IBM Plex Mono', monospace",
              color: '#E8EAF0',
            }}
            className="text-[13px] font-medium pr-4"
          >
            {formatINR(call.borrower?.overdue_amount || 0)}
          </div>

          {/* Bucket */}
          <div style={{ width: '100px', minWidth: '100px' }} className="pr-4">
            <span
              className="text-[12px] font-medium px-2 py-0.5 rounded"
              style={{
                backgroundColor: '#1A1E26',
                color: '#8A8F9E',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {bucketLabel(call.borrower?.bucket || '')}
            </span>
          </div>

          {/* Language */}
          <div style={{ width: '90px', minWidth: '90px' }} className="pr-4">
            <span
              className="text-[12px] font-medium capitalize"
              style={{ color: '#8A8F9E', fontFamily: "'DM Sans', sans-serif" }}
            >
              {call.borrower?.language || '—'}
            </span>
          </div>

          {/* Status */}
          <div style={{ width: '120px', minWidth: '120px' }} className="pr-4">
            <StatusChip status={call.status} size="sm" />
          </div>

          {/* Outcome */}
          <div style={{ width: '130px', minWidth: '130px' }} className="pr-4">
            {call.outcome ? (
              <span
                className="text-[12px] font-medium px-2 py-0.5 rounded"
                style={{
                  backgroundColor: outcomeColors[call.outcome]?.bg || 'rgba(78, 84, 100, 0.15)',
                  color: outcomeColors[call.outcome]?.text || '#4E5464',
                }}
              >
                {outcomeLabel(call.outcome)}
              </span>
            ) : (
              <span className="text-[12px]" style={{ color: '#4E5464' }}>—</span>
            )}
          </div>

          {/* PTP Date */}
          <div
            style={{
              width: '110px',
              minWidth: '110px',
              fontFamily: "'IBM Plex Mono', monospace",
              color: '#8A8F9E',
            }}
            className="text-[13px] pr-4"
          >
            {call.ptp_date ? formatDate(call.ptp_date) : '—'}
          </div>

          {/* Duration */}
          <div
            style={{
              width: '80px',
              minWidth: '80px',
              fontFamily: "'IBM Plex Mono', monospace",
              color: '#8A8F9E',
            }}
            className="text-[13px]"
          >
            {formatDuration(call.duration_seconds)}
          </div>

          {/* Actions */}
          <div style={{ width: '50px', minWidth: '50px' }} className="flex justify-end">
            <button
              className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: '#1A1E26' }}
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick(call.id);
              }}
            >
              <Eye className="w-3.5 h-3.5" style={{ color: '#8A8F9E' }} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
