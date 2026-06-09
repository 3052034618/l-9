import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import ImportPage from '@/pages/ImportPage';
import MatchingPage from '@/pages/MatchingPage';
import DiscrepancyPage from '@/pages/DiscrepancyPage';
import ExportPage from '@/pages/ExportPage';
import LogsPage from '@/pages/LogsPage';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/matching" element={<MatchingPage />} />
          <Route path="/discrepancy" element={<DiscrepancyPage />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/logs" element={<LogsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
