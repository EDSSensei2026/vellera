import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react'
import PageNotFound from './lib/PageNotFound';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import TabStackLayout from './components/TabStackLayout';
import RecoveryAlertBanner from './components/RecoveryAlertBanner';
import GlobalHomeButton from './components/GlobalHomeButton';
import BetaGate from './components/BetaGate';

const Landing = lazy(() => import('./pages/Landing'));
const BetaRequestForm = lazy(() => import('./pages/BetaRequestForm'));
const BetaOnboarding = lazy(() => import('./pages/BetaOnboarding'));
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
const Paywall = lazy(() => import('./pages/Paywall'));
const InvestorRelations = lazy(() => import('./pages/InvestorRelations'));
const AICoach = lazy(() => import('./pages/AICoach'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const AgentForge = lazy(() => import('./pages/AgentForge'));
const WorkoutHistory = lazy(() => import('./pages/WorkoutHistory'));
const AnalyzeTechnique = lazy(() => import('./pages/AnalyzeTechnique'));
const TrainingSquads = lazy(() => import('./pages/TrainingSquads'));
const WearablesHub = lazy(() => import('./pages/WearablesHub'));
const TrainingCalendar = lazy(() => import('./pages/TrainingCalendar'));
const MasteryMap = lazy(() => import('./pages/MasteryMap'));
const PreWorkoutPrep = lazy(() => import('./pages/PreWorkoutPrep'));
const SupplementLog = lazy(() => import('./pages/SupplementLog'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const StudentProgressTracking = lazy(() => import('./pages/StudentProgressTracking'));
const LiftAnalysis = lazy(() => import('./pages/LiftAnalysis'));
const StudentFeedbackCenter = lazy(() => import('./pages/StudentFeedbackCenter'));
const SquadChallenges = lazy(() => import('./pages/SquadChallenges'));
const MacroTracking = lazy(() => import('./pages/MacroTracking'));
const Auth = lazy(() => import('./pages/Auth'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const CommunityChallenge = lazy(() => import('./pages/CommunityChallenge'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const PersonalizedTrainingDashboard = lazy(() => import('./pages/PersonalizedTrainingDashboard'));
const BiometricsDashboard = lazy(() => import('./pages/BiometricsDashboard'));
const CoachHub = lazy(() => import('./pages/CoachHub'));
const MyCoaches = lazy(() => import('./pages/MyCoaches'));
const RetentionAnalytics = lazy(() => import('./pages/RetentionAnalytics'));
const ZuluWarrior = lazy(() => import('./pages/ZuluWarrior'));
const ZuluShred = lazy(() => import('./pages/ZuluShred'));
const ZuluWarriorv4 = lazy(() => import('./pages/ZuluWarriorv4'));
const ZuluMasterProtocol = lazy(() => import('./pages/ZuluMasterProtocol'));
const BJJTacticalJournal = lazy(() => import('./pages/BJJTacticalJournal'));
const TrainingCorrelationDashboard = lazy(() => import('./pages/TrainingCorrelationDashboard'));
const MealPlanner = lazy(() => import('./pages/MealPlanner'));
const HydrationTracker = lazy(() => import('./pages/HydrationTracker'));
const MobilityRoutinePage = lazy(() => import('./pages/MobilityRoutinePage'));
const PhysiqueTrackerPage = lazy(() => import('./pages/PhysiqueTrackerPage'));
const SkillRoadmapPage = lazy(() => import('./pages/SkillRoadmapPage'));
const AISparringAdvisor = lazy(() => import('./pages/AISparringAdvisor'));
const BeltProgressionDashboard = lazy(() => import('./pages/BeltProgressionDashboard'));
const StatsDashboard = lazy(() => import('./pages/StatsDashboard'));
const NutritionTracker = lazy(() => import('./pages/NutritionTracker'));
const RecoveryPredictor = lazy(() => import('./pages/RecoveryPredictor'));

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-commander-dark z-50">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);
const SearchConsoleDashboard = lazy(() => import('./pages/SearchConsoleDashboard'));
const MemberOnboarding = lazy(() => import('./pages/MemberOnboarding'));
const CoachDashboard = lazy(() => import('./pages/CoachDashboard'));
const StudentHub = lazy(() => import('./pages/StudentHub'));
const InstructorOrgDashboard = lazy(() => import('./pages/InstructorOrgDashboard'));
const StudentMobileHome = lazy(() => import('./pages/StudentMobileHome'));
const ReferralPortal = lazy(() => import('./pages/ReferralPortal'));
const CoachShowcase = lazy(() => import('./pages/CoachShowcase'));
const HybridAthlete = lazy(() => import('./pages/HybridAthlete'));
const BJJStrengthConditioning = lazy(() => import('./pages/BJJStrengthConditioning'));
const ExecutiveFitnessDefense = lazy(() => import('./pages/ExecutiveFitnessDefense'));
const EDS_Executive_Dashboard = lazy(() => import('./pages/EDS_Executive_Dashboard'));
const ClinicalDashboard = lazy(() => import('./pages/ClinicalDashboard'));
const ClinicalLogisticsHub = lazy(() => import('./pages/ClinicalLogisticsHub'));
const BetaAccessManager = lazy(() => import('./pages/BetaAccessManager'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const WearableAnalytics = lazy(() => import('./pages/WearableAnalytics'));
const ApprovalWorkflow = lazy(() => import('./pages/ApprovalWorkflow'));
const InsightsDashboard = lazy(() => import('./pages/InsightsDashboard'));
const ManualDataLogger = lazy(() => import('./pages/ManualDataLogger'));
// Add page imports here

const PublicApp = () => (
  <AnimatePresence mode="wait">
    <Routes>
      <Route path="/" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Landing /></Suspense></PageTransition>} />
      <Route path="/landing" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Landing /></Suspense></PageTransition>} />
      <Route path="/beta-request" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><BetaRequestForm /></Suspense></PageTransition>} />
      <Route path="/terms" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><TermsOfService /></Suspense></PageTransition>} />
      <Route path="/privacy" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><PrivacyPolicy /></Suspense></PageTransition>} />
      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AnimatePresence>
);

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
      // Show login page
      return <Auth />;
    }
  }

  // Render the main authenticated app
  return (
    <AnimatePresence mode="wait">
      <Routes>
      <Route path="/landing" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Landing /></Suspense></PageTransition>} />
      <Route path="/beta-request" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><BetaRequestForm /></Suspense></PageTransition>} />
      <Route path="/beta-onboarding" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><BetaOnboarding /></Suspense></PageTransition>} />
      <Route path="/terms" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><TermsOfService /></Suspense></PageTransition>} />
      <Route path="/privacy" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><PrivacyPolicy /></Suspense></PageTransition>} />
      <Route path="/welcome" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Welcome /></Suspense></PageTransition>} />
      <Route path="/home" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Home /></Suspense></PageTransition>} />
      <Route path="/workout" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><ActiveWorkout /></Suspense></PageTransition>} />
      <Route path="/" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense></PageTransition>} />
      <Route element={<TabStackLayout />}>
       <Route path="/dashboard" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense></PageTransition>} />
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
      <Route path="/paywall" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Paywall /></Suspense></PageTransition>} />
      <Route path="/investors" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><InvestorRelations /></Suspense></PageTransition>} />
      <Route path="/coach" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><AICoach /></Suspense></PageTransition>} />
      <Route path="/onboarding" element={<Suspense fallback={<LoadingSpinner />}><Onboarding /></Suspense>} />
      <Route path="/forge" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><AgentForge /></Suspense></PageTransition>} />
      <Route path="/workout-history" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><WorkoutHistory /></Suspense></PageTransition>} />
      <Route path="/analyze" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><AnalyzeTechnique /></Suspense></PageTransition>} />
      <Route path="/squads" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><TrainingSquads /></Suspense></PageTransition>} />
      <Route path="/wearables" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><WearablesHub /></Suspense></PageTransition>} />
      <Route path="/combat" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><CombatHub /></Suspense></PageTransition>} />
      <Route path="/calendar" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><TrainingCalendar /></Suspense></PageTransition>} />
      <Route path="/mastery-map" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><MasteryMap /></Suspense></PageTransition>} />
      <Route path="/prep" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><PreWorkoutPrep /></Suspense></PageTransition>} />
      <Route path="/supplements" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><SupplementLog /></Suspense></PageTransition>} />
      <Route path="/instructor" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><InstructorDashboard /></Suspense></PageTransition>} />
      <Route path="/student-progress" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><StudentProgressTracking /></Suspense></PageTransition>} />
      <Route path="/feedback" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><StudentFeedbackCenter /></Suspense></PageTransition>} />
      <Route path="/challenges" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><CommunityChallenge /></Suspense></PageTransition>} />
      <Route path="/lift-analysis" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><LiftAnalysis /></Suspense></PageTransition>} />
      <Route path="/squad-challenges" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><SquadChallenges /></Suspense></PageTransition>} />
      <Route path="/macros" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><MacroTracking /></Suspense></PageTransition>} />
      <Route path="/leaderboard" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><Leaderboard /></Suspense></PageTransition>} />
      <Route path="/setup" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><ProfileSetup /></Suspense></PageTransition>} />
      <Route path="/training-dashboard" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><PersonalizedTrainingDashboard /></Suspense></PageTransition>} />
      <Route path="/biometrics" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><BiometricsDashboard /></Suspense></PageTransition>} />
      <Route path="/coach-hub" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><CoachHub /></Suspense></PageTransition>} />
      <Route path="/my-coaches" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><MyCoaches /></Suspense></PageTransition>} />
      <Route path="/retention" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><RetentionAnalytics /></Suspense></PageTransition>} />
      <Route path="/zulu" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><ZuluWarrior /></Suspense></PageTransition>} />
      <Route path="/shred" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><ZuluShred /></Suspense></PageTransition>} />
      <Route path="/zulu-v4" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><ZuluWarriorv4 /></Suspense></PageTransition>} />
      <Route path="/master-protocol" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><ZuluMasterProtocol /></Suspense></PageTransition>} />
      <Route path="/bjj-journal" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><BJJTacticalJournal /></Suspense></PageTransition>} />
      <Route path="/correlation" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><TrainingCorrelationDashboard /></Suspense></PageTransition>} />
      <Route path="/meal-planner" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><MealPlanner /></Suspense></PageTransition>} />
      <Route path="/hydration" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><HydrationTracker /></Suspense></PageTransition>} />
      <Route path="/mobility" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><MobilityRoutinePage /></Suspense></PageTransition>} />
      <Route path="/physique" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><PhysiqueTrackerPage /></Suspense></PageTransition>} />
      <Route path="/skill-roadmap" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><SkillRoadmapPage /></Suspense></PageTransition>} />
      <Route path="/sparring-advisor" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><AISparringAdvisor /></Suspense></PageTransition>} />
      <Route path="/belt-progression" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><BeltProgressionDashboard /></Suspense></PageTransition>} />
      <Route path="/stats" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><StatsDashboard /></Suspense></PageTransition>} />
      <Route path="/nutrition" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><NutritionTracker /></Suspense></PageTransition>} />
      <Route path="/recovery-predictor" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><RecoveryPredictor /></Suspense></PageTransition>} />
      <Route path="/search-console" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><SearchConsoleDashboard /></Suspense></PageTransition>} />
      <Route path="/member-onboarding" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><MemberOnboarding /></Suspense></PageTransition>} />
      <Route path="/coach-dashboard" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><CoachDashboard /></Suspense></PageTransition>} />
      <Route path="/student-hub" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><StudentHub /></Suspense></PageTransition>} />
      <Route path="/org-dashboard" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><InstructorOrgDashboard /></Suspense></PageTransition>} />
      <Route path="/submit-video" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><StudentMobileHome /></Suspense></PageTransition>} />
      <Route path="/referral" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><ReferralPortal /></Suspense></PageTransition>} />
      <Route path="/coach/:coachId" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><CoachShowcase /></Suspense></PageTransition>} />
      <Route path="/hybrid-athlete" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><HybridAthlete /></Suspense></PageTransition>} />
      <Route path="/bjj-strength-conditioning" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><BJJStrengthConditioning /></Suspense></PageTransition>} />
      <Route path="/executive-fitness-defense" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><ExecutiveFitnessDefense /></Suspense></PageTransition>} />
      <Route path="/logistics" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><ClinicalLogisticsHub /></Suspense></PageTransition>} />
      <Route path="/clinical" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><ClinicalDashboard /></Suspense></PageTransition>} />
      <Route path="/eds-dashboard" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><EDS_Executive_Dashboard /></Suspense></PageTransition>} />
      <Route path="/beta-manager" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><BetaAccessManager /></Suspense></PageTransition>} />
      <Route path="/admin" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><AdminDashboard /></Suspense></PageTransition>} />
      <Route path="/wearable-analytics" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><WearableAnalytics /></Suspense></PageTransition>} />
      <Route path="/approvals" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><ApprovalWorkflow /></Suspense></PageTransition>} />
      <Route path="/insights" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><InsightsDashboard /></Suspense></PageTransition>} />
      <Route path="/manual-log" element={<PageTransition><Suspense fallback={<LoadingSpinner />}><ManualDataLogger /></Suspense></PageTransition>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </AnimatePresence>
  );
};

const RootApp = () => {
  const { isLoadingAuth, authError } = useAuth();
  
  if (isLoadingAuth) return <LoadingSpinner />;
  
  // If no error or user_not_registered, show authenticated app
  // If auth_required, show public app
  // If other errors, show authenticated app (let it handle)
  if (authError?.type === 'auth_required') {
    return <PublicApp />;
  }
  
  return <AuthenticatedApp />;
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <RecoveryAlertBanner />
          <GlobalHomeButton />
          <BetaGate>
            <RootApp />
          </BetaGate>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App