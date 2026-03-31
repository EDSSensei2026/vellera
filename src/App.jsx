import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react'
import PageNotFound from './lib/PageNotFound';
import TabStackLayout from './components/TabStackLayout';

const Landing = lazy(() => import('./pages/Landing'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Welcome = lazy(() => import('./pages/Welcome'));
const Home = lazy(() => import('./pages/Home'));
const CombatHub = lazy(() => import('./pages/CombatHub'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TrainingLog = lazy(() => import('./pages/TrainingLog'));
const TechniqueLibrary = lazy(() => import('./pages/TechniqueLibrary'));
const Recovery = lazy(() => import('./pages/Recovery'));
const Competition = lazy(() => import('./pages/Competition'));
const JuniorTracker = lazy(() => import('./pages/JuniorTracker'));
const VideoVault = lazy(() => import('./pages/VideoVault'));
const Blueprint = lazy(() => import('./pages/Blueprint'));
const FoodLog = lazy(() => import('./pages/FoodLog'));
const Progress = lazy(() => import('./pages/Progress'));
const SparringPartners = lazy(() => import('./pages/SparringPartners'));
const TrainingHub = lazy(() => import('./pages/TrainingHub'));
const WellnessTracker = lazy(() => import('./pages/WellnessTracker'));
const CompetitionsEvents = lazy(() => import('./pages/CompetitionsEvents'));
const Settings = lazy(() => import('./pages/Settings'));

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-commander-dark z-50">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);
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
      <Route path="/landing" element={<Suspense fallback={<LoadingSpinner />}><Landing /></Suspense>} />
      <Route path="/terms" element={<Suspense fallback={<LoadingSpinner />}><TermsOfService /></Suspense>} />
      <Route path="/privacy" element={<Suspense fallback={<LoadingSpinner />}><PrivacyPolicy /></Suspense>} />
      <Route path="/welcome" element={<Suspense fallback={<LoadingSpinner />}><Welcome /></Suspense>} />
      <Route path="/home" element={<Suspense fallback={<LoadingSpinner />}><Home /></Suspense>} />
      <Route path="/combat" element={<Suspense fallback={<LoadingSpinner />}><CombatHub /></Suspense>} />
      <Route element={<TabStackLayout />}>
        <Route path="/" element={<Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense>} />
        <Route path="/training" element={<Suspense fallback={<LoadingSpinner />}><TrainingLog /></Suspense>} />
        <Route path="/techniques" element={<Suspense fallback={<LoadingSpinner />}><TechniqueLibrary /></Suspense>} />
        <Route path="/recovery" element={<Suspense fallback={<LoadingSpinner />}><Recovery /></Suspense>} />
        <Route path="/competition" element={<Suspense fallback={<LoadingSpinner />}><Competition /></Suspense>} />
        <Route path="/junior" element={<Suspense fallback={<LoadingSpinner />}><JuniorTracker /></Suspense>} />
        <Route path="/vault" element={<Suspense fallback={<LoadingSpinner />}><VideoVault /></Suspense>} />
        <Route path="/blueprint" element={<Suspense fallback={<LoadingSpinner />}><Blueprint /></Suspense>} />
        <Route path="/food" element={<Suspense fallback={<LoadingSpinner />}><FoodLog /></Suspense>} />
        <Route path="/progress" element={<Suspense fallback={<LoadingSpinner />}><Progress /></Suspense>} />
        <Route path="/partners" element={<Suspense fallback={<LoadingSpinner />}><SparringPartners /></Suspense>} />
        <Route path="/hub" element={<Suspense fallback={<LoadingSpinner />}><TrainingHub /></Suspense>} />
        <Route path="/wellness" element={<Suspense fallback={<LoadingSpinner />}><WellnessTracker /></Suspense>} />
        <Route path="/events" element={<Suspense fallback={<LoadingSpinner />}><CompetitionsEvents /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<LoadingSpinner />}><Settings /></Suspense>} />
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