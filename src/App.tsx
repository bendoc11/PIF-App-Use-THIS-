import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminGuard } from "@/components/admin/AdminGuard";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CoursePlayer from "./pages/CoursePlayer";
import DrillExperience from "./pages/DrillExperience";
import Community from "./pages/Community";
import Progress from "./pages/Progress";
import Pricing from "./pages/Pricing";
import Settings from "./pages/Settings";
import Install from "./pages/Install";
import SignupSuccess from "./pages/SignupSuccess";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseEditor from "./pages/admin/AdminCourseEditor";
import AdminCreators from "./pages/admin/AdminCreators";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminModeration from "./pages/admin/AdminModeration";
import AdminFeatured from "./pages/admin/AdminFeatured";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup-success" element={<SignupSuccess />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/courses" element={<AuthGuard><Courses /></AuthGuard>} />
            <Route path="/courses/:courseId/:drillIndex" element={<AuthGuard><CoursePlayer /></AuthGuard>} />
            <Route path="/drill/:courseId/:drillIndex" element={<AuthGuard><DrillExperience /></AuthGuard>} />
            <Route path="/drills/:drillId" element={<AuthGuard><DrillExperience /></AuthGuard>} />
            <Route path="/pricing" element={<AuthGuard><Pricing /></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
            <Route path="/install" element={<AuthGuard><Install /></AuthGuard>} />
            <Route path="/coaches" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/community" element={<AuthGuard><Community /></AuthGuard>} />
            <Route path="/progress" element={<AuthGuard><Progress /></AuthGuard>} />
            {/* Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/courses" replace />} />
            <Route path="/admin/courses" element={<AdminGuard><AdminCourses /></AdminGuard>} />
            <Route path="/admin/courses/:courseId" element={<AdminGuard><AdminCourseEditor /></AdminGuard>} />
            <Route path="/admin/featured" element={<AdminGuard requiredRole="admin"><AdminFeatured /></AdminGuard>} />
            <Route path="/admin/creators" element={<AdminGuard requiredRole="admin"><AdminCreators /></AdminGuard>} />
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
