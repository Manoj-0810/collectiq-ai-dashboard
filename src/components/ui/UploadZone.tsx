import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';

interface UploadZoneProps {
  onFileAccepted: (file: File) => void;
  onError: (message: string) => void;
}

export function UploadZone({ onFileAccepted, onError }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      onError('Please upload a CSV file only');
      return;
    }

    onFileAccepted(file);
  }, [onFileAccepted, onError]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      onError('Please upload a CSV file only');
      return;
    }

    onFileAccepted(file);
  }, [onFileAccepted, onError]);

  return (
    <div
      className="relative rounded-lg p-10 transition-all duration-150 cursor-pointer"
      style={{
        border: isDragOver
          ? '2px solid #00E5A0'
          : '2px dashed #242830',
        backgroundColor: isDragOver
          ? 'rgba(0, 229, 160, 0.03)'
          : 'transparent',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('csv-upload')?.click()}
    >
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex flex-col items-center gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: isDragOver ? 'rgba(0, 229, 160, 0.15)' : '#1A1E26' }}
        >
          {isDragOver ? (
            <Check className="w-6 h-6" style={{ color: '#00E5A0' }} />
          ) : (
            <Upload className="w-6 h-6" style={{ color: '#4E5464' }} />
          )}
        </div>

        <div className="text-center">
          <p
            className="text-[14px] font-medium"
            style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}
          >
            {isDragOver ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
          </p>
          <p
            className="text-[12px] mt-1"
            style={{ color: '#4E5464', fontFamily: "'DM Sans', sans-serif" }}
          >
            or click to browse files
          </p>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: '#1A1E26' }}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" style={{ color: '#00E5A0' }} />
          <span
            className="text-[11px] font-medium"
            style={{ color: '#8A8F9E', fontFamily: "'DM Sans', sans-serif" }}
          >
            CSV files only
          </span>
        </div>
      </div>
    </div>
  );
}

interface UploadProgressProps {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
}

export function UploadProgress({ fileName, progress, status }: UploadProgressProps) {
  const statusConfig = {
    uploading: { color: '#4D9EFF', label: 'Uploading...' },
    processing: { color: '#F5A623', label: 'Processing...' },
    complete: { color: '#00E5A0', label: 'Complete' },
    error: { color: '#FF4757', label: 'Error' },
  };

  const config = statusConfig[status];

  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: '#111318',
        border: '1px solid #242830',
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <FileSpreadsheet className="w-5 h-5" style={{ color: config.color }} />
        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] font-medium truncate"
            style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}
          >
            {fileName}
          </p>
          <p
            className="text-[11px]"
            style={{ color: config.color, fontFamily: "'DM Sans', sans-serif" }}
          >
            {config.label}
          </p>
        </div>
        {status === 'error' && <AlertCircle className="w-4 h-4" style={{ color: '#FF4757' }} />}
        {status === 'complete' && <Check className="w-4 h-4" style={{ color: '#00E5A0' }} />}
      </div>

      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: '#1A1E26' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: config.color,
          }}
        />
      </div>
    </div>
  );
}
