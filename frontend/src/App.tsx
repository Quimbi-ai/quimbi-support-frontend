import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { InboxPage } from './pages/InboxPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { DemoPage } from './pages/DemoPage';
import { GamingPage } from './pages/GamingPage';
import { LoginPage } from './pages/LoginPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/demo" replace />} />
              <Route path="demo" element={<DemoPage />} />
              <Route path="gaming" element={<GamingPage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="tickets/:ticketId" element={<TicketDetailPage />} />
              <Route path="knowledge-base" element={<KnowledgeBasePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
