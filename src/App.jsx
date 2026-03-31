import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TrainingLog from './pages/TrainingLog';
import TechniqueLibrary from './pages/TechniqueLibrary';
import Recovery from './pages/Recovery';
import Competition from './pages/Competition';
import JuniorTracker from './pages/JuniorTracker';
import VideoVault from './pages/VideoVault';
import Blueprint from './pages/Blueprint';
import FoodLog from './pages/FoodLog';
import Progress from './pages/Progress';
import SparringPartners from './pages/SparringPartners';
import TrainingHub from './pages/TrainingHub';
import WellnessTracker from './pages/WellnessTracker';
import CompetitionsEvents from './pages/CompetitionsEvents';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/training" element={<TrainingLog />} />
        <Route path="/techniques" element={<TechniqueLibrary />} />
        <Route path="/recovery" element={<Recovery />} />
        <Route path="/competition" element={<Competition />} />
        <Route path="/junior" element={<JuniorTracker />} />
        <Route path="/vault" element={<VideoVault />} />
        <Route path="/blueprint" element={<Blueprint />} />
        <Route path="/food" element={<FoodLog />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/partners" element={<SparringPartners />} />
        <Route path="/hub" element={<TrainingHub />} />
        <Route path="/wellness" element={<WellnessTracker />} />
        <Route path="/events" element={<CompetitionsEvents />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App