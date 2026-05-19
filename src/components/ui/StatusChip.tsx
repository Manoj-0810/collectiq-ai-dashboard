import { statusLabel } from '@/lib/utils';

interface StatusChipProps {
  status: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  queued: { bg: 'rgba(78, 84, 100, 0.2)', text: '#8A8F9E' },
  calling: { bg: 'rgba(77, 158, 255, 0.2)', text: '#4D9EFF' },
  completed: { bg: 'rgba(138, 143, 158, 0.2)', text: '#8A8F9E' },
  ptp_confirmed: { bg: 'rgba(0, 229, 160, 0.2)', text: '#00E5A0' },
  disputed: { bg: 'rgba(255, 71, 87, 0.2)', text: '#FF4757' },
  callback_requested: { bg: 'rgba(245, 166, 35, 0.2)', text: '#F5A623' },
  escalate: { bg: 'rgba(167, 139, 250, 0.2)', text: '#A78BFA' },
  no_answer: { bg: 'rgba(78, 84, 100, 0.2)', text: '#4E5464' },
  failed: { bg: 'rgba(255, 71, 87, 0.2)', text: '#FF4757' },
  draft: { bg: 'rgba(78, 84, 100, 0.2)', text: '#8A8F9E' },
  running: { bg: 'rgba(0, 229, 160, 0.2)', text: '#00E5A0' },
  paused: { bg: 'rgba(245, 166, 35, 0.2)', text: '#F5A623' },
};

export function StatusChip({ status, size = 'md', pulse = false }: StatusChipProps) {
  const style = statusStyles[status] || statusStyles.queued;
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-[12px]';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  const shouldPulse = pulse || status === 'calling';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} ${textSize}`}
      style={{
        fontFamily: "'DM Sans', sans-serif",
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      {shouldPulse ? (
        <span className={`relative flex ${dotSize}`}>
          <span
            className="pulse-dot absolute inline-flex rounded-full w-full h-full"
            style={{ backgroundColor: '#4D9EFF' }}
          />
          <span
            className="relative inline-flex rounded-full w-full h-full"
            style={{ backgroundColor: '#4D9EFF' }}
          />
        </span>
      ) : (
        <span
          className={`rounded-full ${dotSize}`}
          style={{
            backgroundColor: 'currentColor',
            opacity: 0.5,
          }}
        />
      )}
      {statusLabel(status)}
    </span>
  );
}
