import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SubscriptionGuard } from "@/components/auth/SubscriptionGuard";
import { AdminGuard } from "@/components/admin/AdminGuard";
import LandingPage from "./pages/LandingPage";
import Coaches from "./pages/Coaches";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CoursePlayer from "./pages/CoursePlayer";
import DrillExperience from "./pages/DrillExperience";
import Community from "./pages/Community";
import Progress from "./pages/Progress";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import Recruit from "./pages/Recruit";
import RecruitProfile from "./pages/RecruitProfile";
import MyProfile from "./pages/MyProfile";
import PublicAthleteProfile from "./pages/PublicAthleteProfile";

import SignupSuccess from "./pages/SignupSuccess";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import OAuthCallback from "./pages/OAuthCallback";
import Onboarding from "./pages/Onboarding";
import OnboardingResults from "./pages/OnboardingResults";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseEditor from "./pages/admin/AdminCourseEditor";
import AdminCreators from "./pages/admin/AdminCreators";
import AdminCoaches from "./pages/admin/AdminCoaches";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminModeration from "./pages/admin/AdminModeration";
import AdminFeatured from "./pages/admin/AdminFeatured";
import AdminDrills from "./pages/admin/AdminDrills";
import AdminBulkUpload from "./pages/admin/AdminBulkUpload";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfUse />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup-success" element={<SignupSuccess />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/onboarding" element={<AuthGuard><Onboarding /></AuthGuard>} />
            <Route path="/onboarding/results" element={<AuthGuard><OnboardingResults /></AuthGuard>} />
            <Route path="/dashboard" element={<AuthGuard><SubscriptionGuard><Dashboard /></SubscriptionGuard></AuthGuard>} />
            <Route path="/courses" element={<AuthGuard><SubscriptionGuard><Courses /></SubscriptionGuard></AuthGuard>} />
            <Route path="/courses/:courseId/:drillIndex" element={<AuthGuard><SubscriptionGuard><CoursePlayer /></SubscriptionGuard></AuthGuard>} />
            <Route path="/drill/:courseId/:drillIndex" element={<AuthGuard><SubscriptionGuard><DrillExperience /></SubscriptionGuard></AuthGuard>} />
            <Route path="/drills/:drillId" element={<AuthGuard><SubscriptionGuard><DrillExperience /></SubscriptionGuard></AuthGuard>} />
            {/* Hidden for App Store review — pricing/paywall disabled */}
            {/* <Route path="/pricing" element={<AuthGuard><Pricing /></AuthGuard>} /> */}
            <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
            
            <Route path="/coaches" element={<AuthGuard><SubscriptionGuard><Coaches /></SubscriptionGuard></AuthGuard>} />
            <Route path="/community" element={<AuthGuard><SubscriptionGuard><Community /></SubscriptionGuard></AuthGuard>} />
            <Route path="/progress" element={<AuthGuard><SubscriptionGuard><Progress /></SubscriptionGuard></AuthGuard>} />
            <Route path="/recruit" element={<AuthGuard><SubscriptionGuard><Recruit /></SubscriptionGuard></AuthGuard>} />
            <Route path="/profile" element={<AuthGuard><SubscriptionGuard><MyProfile /></SubscriptionGuard></AuthGuard>} />
            <Route path="/profile/edit" element={<AuthGuard><SubscriptionGuard><RecruitProfile /></SubscriptionGuard></AuthGuard>} />
            <Route path="/profile/:username" element={<RecruitProfile />} />
            {/* Public, no-login recruiting profile — shareable with coaches */}
            <Route path="/p/:identifier" element={<PublicAthleteProfile />} />
            <Route path="/athlete/:identifier" element={<PublicAthleteProfile />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/courses" replace />} />
            <Route path="/admin/courses" element={<AdminGuard><AdminCourses /></AdminGuard>} />
            <Route path="/admin/courses/:courseId" element={<AdminGuard><AdminCourseEditor /></AdminGuard>} />
            <Route path="/admin/drills" element={<AdminGuard><AdminDrills /></AdminGuard>} />
            <Route path="/admin/bulk-upload" element={<AdminGuard requiredRole="admin"><AdminBulkUpload /></AdminGuard>} />
            <Route path="/admin/featured" element={<AdminGuard requiredRole="admin"><AdminFeatured /></AdminGuard>} />
            <Route path="/admin/creators" element={<AdminGuard requiredRole="admin"><AdminCreators /></AdminGuard>} />
            <Route path="/admin/coaches" element={<AdminGuard requiredRole="admin"><AdminCoaches /></AdminGuard>} />
            <Route path="/admin/users" element={<AdminGuard requiredRole="admin"><AdminUsers /></AdminGuard>} />
            <Route path="/admin/moderation" element={<AdminGuard requiredRole="admin"><AdminModeration /></AdminGuard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
