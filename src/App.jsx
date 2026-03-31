import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react'
import PageNotFound from './lib/PageNotFound';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
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
const ActiveWorkout = lazy(() => import('./pages/ActiveWorkout'));
const Profile = lazy(() => import('./pages/Profile'));

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
    <AnimatePresence mode="wait">
      <Routes>
      <Route path="/landing" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Landing /></Suspense></PageTransition>} />
      <Route path="/terms" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><TermsOfService /></Suspense></PageTransition>} />
      <Route path="/privacy" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><PrivacyPolicy /></Suspense></PageTransition>} />
      <Route path="/welcome" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Welcome /></Suspense></PageTransition>} />
      <Route path="/workout" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><ActiveWorkout /></Suspense></PageTransition>} />
      <Route path="/home" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Home /></Suspense></PageTransition>} />
      <Route path="/combat" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><CombatHub /></Suspense></PageTransition>} />
      <Route element={<TabStackLayout />}>
       <Route path="/" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense></PageTransition>} />
       <Route path="/training" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><TrainingLog /></Suspense></PageTransition>} />
       <Route path="/techniques" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><TechniqueLibrary /></Suspense></PageTransition>} />
        <Route path="/recovery" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Recovery /></Suspense></PageTransition>} />
        <Route path="/competition" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Competition /></Suspense></PageTransition>} />
        <Route path="/junior" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><JuniorTracker /></Suspense></PageTransition>} />
        <Route path="/vault" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><VideoVault /></Suspense></PageTransition>} />
        <Route path="/blueprint" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Blueprint /></Suspense></PageTransition>} />
        <Route path="/food" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><FoodLog /></Suspense></PageTransition>} />
        <Route path="/progress" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Progress /></Suspense></PageTransition>} />
        <Route path="/partners" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><SparringPartners /></Suspense></PageTransition>} />
        <Route path="/hub" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><TrainingHub /></Suspense></PageTransition>} />
        <Route path="/wellness" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><WellnessTracker /></Suspense></PageTransition>} />
        <Route path="/events" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><CompetitionsEvents /></Suspense></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Settings /></Suspense></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Profile /></Suspense></PageTransition>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </AnimatePresence>
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