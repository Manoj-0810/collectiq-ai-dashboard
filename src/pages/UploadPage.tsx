import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Upload, AlertCircle, ArrowLeft, FileSpreadsheet, Check } from 'lucide-react';
import { UploadZone, UploadProgress } from '@/components/ui/UploadZone';
import { createCampaign, insertBorrowers, createCalls } from '@/lib/supabase';
import { formatINR } from '@/lib/utils';
import type { BorrowerRow, Bucket } from '@/types';

export function UploadPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'upload' | 'preview' | 'creating'>('upload');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<BorrowerRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);

  const detectColumns = useCallback((headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());

    const columnPatterns: Record<string, string[]> = {
      name: ['name', 'borrower', 'customer', 'borrower_name', 'customer_name', 'full_name'],
      phone: ['phone', 'mobile', 'contact', 'phone_number', 'mobile_number', 'contact_number'],
      loan_account: ['loan_account', 'account', 'loan_id', 'account_number', 'loan_number'],
      overdue_amount: ['overdue_amount', 'amount', 'due_amount', 'overdue', 'outstanding', 'balance'],
      due_date: ['due_date', 'date', 'duedate', 'maturity_date', 'repayment_date'],
      language: ['language', 'lang', 'preferred_language'],
      bucket: ['bucket', 'dpd', 'days_past_due', 'ageing', 'category'],
    };

    Object.entries(columnPatterns).forEach(([field, patterns]) => {
      const index = lowerHeaders.findIndex(h => patterns.some(p => h.includes(p)));
      if (index !== -1) {
        mapping[field] = headers[index];
      }
    });

    return mapping;
  }, []);

  const handleFileAccepted = useCallback((file: File) => {
    setFileName(file.name);
    setStep('creating');
    setProgress(30);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setProgress(60);

        if (results.errors && results.errors.length > 0) {
          setErrors(results.errors.map(e => `Row ${e.row}: ${e.message}`));
        }

        const headers = results.meta.fields || [];
        const detectedMapping = detectColumns(headers);
        setColumnMapping(detectedMapping);

        const parsedRows: BorrowerRow[] = results.data
          .filter((row: any) => row[detectedMapping.phone] || row.phone)
          .map((row: any) => ({
            name: row[detectedMapping.name] || row.name || 'Unknown',
            phone: String(row[detectedMapping.phone] || row.phone || '').trim(),
            loan_account: row[detectedMapping.loan_account] || row.loan_account || '',
            overdue_amount: parseFloat(row[detectedMapping.overdue_amount] || row.overdue_amount || '0'),
            due_date: row[detectedMapping.due_date] || row.due_date || new Date().toISOString().split('T')[0],
            language: (row[detectedMapping.language] || row.language || 'hindi').toLowerCase(),
            bucket: (row[detectedMapping.bucket] || row.bucket || '0-30') as Bucket,
          }));

        const validationErrors: string[] = [];
        parsedRows.forEach((row, i) => {
          if (!row.phone || row.phone.length < 10) {
            validationErrors.push(`Row ${i + 1}: Invalid phone number`);
          }
          if (!row.name || row.name === 'Unknown') {
            validationErrors.push(`Row ${i + 1}: Missing name`);
          }
        });

        setRows(parsedRows);
        setErrors(validationErrors);
        setProgress(100);
        setCampaignName(`${file.name.replace('.csv', '')} - ${new Date().toLocaleDateString('en-IN')}`);

        setTimeout(() => setStep('preview'), 500);
      },
      error: (error) => {
        setErrors([error.message]);
        setStep('upload');
      },
    });
  }, [detectColumns]);

  const handleError = useCallback((message: string) => {
    setErrors([message]);
  }, []);

  const handleCreateCampaign = async () => {
    if (!campaignName.trim() || rows.length === 0) return;

    setStep('creating');
    setProgress(20);

    const campaign = await createCampaign(campaignName, rows.length);
    if (!campaign) {
      setErrors(['Failed to create campaign']);
      setStep('preview');
      return;
    }

    setProgress(50);

    const borrowers = await insertBorrowers(rows);
    if (borrowers.length === 0) {
      setErrors(['Failed to insert borrowers']);
      setStep('preview');
      return;
    }

    setProgress(80);

    const calls: any[] = borrowers.map((borrower) => ({
      campaign_id: campaign.id,
      borrower_id: borrower.id,
      status: 'queued',
    }));

    await createCalls(calls);

    setProgress(100);

    setTimeout(() => {
      navigate(`/campaigns/${campaign.id}`);
    }, 500);
  };

  const totalOverdue = rows.reduce((sum, row) => sum + (row.overdue_amount || 0), 0);
  const errorCount = errors.length;

  return (
    <div className="max-w-4xl mx-auto" style={{ color: '#E8EAF0' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {step === 'preview' && (
          <button
            className="p-2 rounded-md transition-colors"
            style={{ backgroundColor: '#111318' }}
            onClick={() => {
              setStep('upload');
              setRows([]);
              setErrors([]);
              setFileName('');
            }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: '#8A8F9E' }} />
          </button>
        )}
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>
            {step === 'upload' ? 'Upload Borrower List' : 'Preview & Confirm'}
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#8A8F9E', fontFamily: "'DM Sans', sans-serif" }}>
            {step === 'upload'
              ? 'Upload a CSV file with borrower details to start a campaign'
              : `Found ${rows.length} accounts ready to import`}
          </p>
        </div>
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <div className="space-y-6">
          <UploadZone onFileAccepted={handleFileAccepted} onError={handleError} />

          {errors.length > 0 && (
            <div
              className="rounded-lg p-4 flex items-start gap-3"
              style={{
                backgroundColor: 'rgba(255, 71, 87, 0.1)',
                border: '1px solid rgba(255, 71, 87, 0.2)',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#FF4757' }} />
              <div>
                {errors.map((error, i) => (
                  <p key={i} className="text-[13px]" style={{ color: '#FF4757' }}>
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* CSV Format Documentation */}
          <div
            className="rounded-lg p-5"
            style={{
              backgroundColor: '#111318',
              border: '1px solid #242830',
            }}
          >
            <h3
              className="text-[14px] font-semibold mb-3 flex items-center gap-2"
              style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}
            >
              <FileSpreadsheet className="w-4 h-4" style={{ color: '#00E5A0' }} />
              Expected CSV Format
            </h3>
            <p className="text-[12px] mb-3" style={{ color: '#8A8F9E', fontFamily: "'DM Sans', sans-serif" }}>
              Your CSV should include these columns. Column names are auto-detected.
            </p>
            <div className="rounded-md p-3 overflow-x-auto" style={{ backgroundColor: '#0A0B0D' }}>
              <pre
                className="text-[11px]"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: '#8A8F9E',
                  lineHeight: 1.6,
                }}
              >
{`name,phone,loan_account,overdue_amount,due_date,language,bucket
Rajesh Kumar,9876543210,LN2024001,45000,2024-11-15,hindi,31-60
Priya Sharma,9123456789,LN2024002,18500,2024-11-10,english,0-30`}
              </pre>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {[
                { field: 'name', desc: 'Borrower full name', required: true },
                { field: 'phone', desc: '10-digit mobile number', required: true },
                { field: 'loan_account', desc: 'Internal loan ID', required: true },
                { field: 'overdue_amount', desc: 'Amount in ₹', required: true },
                { field: 'due_date', desc: 'YYYY-MM-DD format', required: true },
                { field: 'language', desc: 'hindi or english', required: false },
                { field: 'bucket', desc: '0-30, 31-60, 61-90, 90+', required: false },
              ].map((col) => (
                <div key={col.field} className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: '#1A1E26',
                      color: '#4D9EFF',
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {col.field}
                  </span>
                  <span className="text-[11px]" style={{ color: '#4E5464' }}>
                    {col.desc}
                  </span>
                  {col.required && (
                    <span className="text-[9px]" style={{ color: '#FF4757' }}>*</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Processing */}
      {step === 'creating' && (
        <div className="space-y-4">
          <UploadProgress
            fileName={fileName}
            progress={progress}
            status={progress < 100 ? 'processing' : 'complete'}
          />
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: '#111318', border: '1px solid #242830' }}>
              <p className="text-[11px] uppercase tracking-wider" style={{ color: '#4E5464' }}>Total Accounts</p>
              <p className="text-[22px] font-semibold mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#E8EAF0' }}>
                {rows.length}
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: '#111318', border: '1px solid #242830' }}>
              <p className="text-[11px] uppercase tracking-wider" style={{ color: '#4E5464' }}>Total Overdue</p>
              <p className="text-[22px] font-semibold mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#00E5A0' }}>
                {formatINR(totalOverdue)}
              </p>
            </div>
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: errorCount > 0 ? 'rgba(255, 71, 87, 0.05)' : '#111318',
                border: `1px solid ${errorCount > 0 ? 'rgba(255, 71, 87, 0.2)' : '#242830'}`,
              }}
            >
              <p className="text-[11px] uppercase tracking-wider" style={{ color: '#4E5464' }}>Errors</p>
              <p
                className="text-[22px] font-semibold mt-1"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: errorCount > 0 ? '#FF4757' : '#00E5A0',
                }}
              >
                {errorCount}
              </p>
            </div>
          </div>

          {/* Column Mapping */}
          {Object.keys(columnMapping).length > 0 && (
            <div className="rounded-lg p-4" style={{ backgroundColor: '#111318', border: '1px solid #242830' }}>
              <h4 className="text-[13px] font-semibold mb-3" style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>
                Detected Columns
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(columnMapping).map(([field, header]) => (
                  <div key={field} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md" style={{ backgroundColor: '#1A1E26' }}>
                    <Check className="w-3 h-3" style={{ color: '#00E5A0' }} />
                    <span className="text-[11px] font-medium" style={{ color: '#8A8F9E', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {field}
                    </span>
                    <span className="text-[11px]" style={{ color: '#4E5464' }}>→ {header}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #242830' }}>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #242830' }}>
              <h4 className="text-[13px] font-semibold" style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>
                Preview (first 5 rows)
              </h4>
              <span className="text-[11px]" style={{ color: '#4E5464' }}>Showing 5 of {rows.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#1A1E26' }}>
                    {['Name', 'Phone', 'Loan Account', 'Overdue', 'Due Date', 'Language', 'Bucket'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2"
                        style={{ color: '#4E5464', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #242830' }}>
                      <td className="px-4 py-2.5 text-[12px] font-medium" style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>{row.name}</td>
                      <td className="px-4 py-2.5 text-[12px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#8A8F9E' }}>{row.phone}</td>
                      <td className="px-4 py-2.5 text-[12px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#8A8F9E' }}>{row.loan_account}</td>
                      <td className="px-4 py-2.5 text-[12px] font-medium" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#00E5A0' }}>{formatINR(row.overdue_amount)}</td>
                      <td className="px-4 py-2.5 text-[12px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#8A8F9E' }}>{row.due_date}</td>
                      <td className="px-4 py-2.5 text-[12px] capitalize" style={{ color: '#8A8F9E' }}>{row.language}</td>
                      <td className="px-4 py-2.5 text-[12px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#8A8F9E' }}>{row.bucket}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Campaign Name + Submit */}
          <div className="rounded-lg p-5" style={{ backgroundColor: '#111318', border: '1px solid #242830' }}>
            <label className="text-[13px] font-medium mb-2 block" style={{ color: '#E8EAF0', fontFamily: "'DM Sans', sans-serif" }}>
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-md text-[13px] mb-4 outline-none focus:ring-1"
              style={{
                backgroundColor: '#1A1E26',
                border: '1px solid #242830',
                color: '#E8EAF0',
                fontFamily: "'DM Sans', sans-serif",
              }}
              placeholder="Enter campaign name"
            />
            <button
              className="w-full py-2.5 rounded-md text-[13px] font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{
                backgroundColor: '#00E5A0',
                color: '#000',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onClick={handleCreateCampaign}
              disabled={!campaignName.trim()}
            >
              <Upload className="w-4 h-4" />
              Import {rows.length} accounts & create campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
