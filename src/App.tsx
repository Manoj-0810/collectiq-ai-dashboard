import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/ui/Sidebar';
import { DashboardPage } from '@/pages/DashboardPage';
import { CampaignsPage } from '@/pages/CampaignsPage';
import { CampaignDetailPage } from '@/pages/CampaignDetailPage';
import { UploadPage } from '@/pages/UploadPage';
import { CallDetailPage } from '@/pages/CallDetailPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { Toaster } from '@/components/ui/sonner';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen" style={{ backgroundColor: '#0A0B0D' }}>
      <Sidebar />
      <main
        className="flex-1 overflow-auto"
        style={{
          marginLeft: '220px',
          padding: '24px',
        }}
      >
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/calls/:id" element={<CallDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>
      <Toaster />
    </HashRouter>
  );
}

export default App;
