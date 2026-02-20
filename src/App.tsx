import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import AnalyzePage from "./pages/Analyze";
import ResultsDashboard from "./pages/ResultsDashboard";
import DrugDetail from "./pages/DrugDetail";
import GeneDetail from "./pages/GeneDetail";
import HistoryPage from "./pages/History";
import KnowledgePage from "./pages/Knowledge";
import AboutPage from "./pages/About";
import NotFound from "./pages/NotFound";
import { AnalysisProvider } from "@/state/AnalysisStore";
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/analyze" replace />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/results/:runId" element={<ResultsDashboard />} />
        <Route path="/results/:runId/drug/:drugName" element={<DrugDetail />} />
        <Route path="/results/:runId/gene/:geneSymbol" element={<GeneDetail />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AnalysisProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <AnimatedRoutes />
        </Router>
      </TooltipProvider>
    </AnalysisProvider>
  </QueryClientProvider>
);

export default App;
