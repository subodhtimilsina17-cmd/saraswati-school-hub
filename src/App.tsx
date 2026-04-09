import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import RoleGuard from "@/components/RoleGuard";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ClassesPage from "@/pages/admin/ClassesPage";
import TeachersPage from "@/pages/admin/TeachersPage";
import SubjectsPage from "@/pages/admin/SubjectsPage";
import AssignSubjectsPage from "@/pages/admin/AssignSubjectsPage";
import ExamsPage from "@/pages/admin/ExamsPage";
import QuestionPapersPage from "@/pages/admin/QuestionPapersPage";
import AdminResultsPage from "@/pages/admin/ResultsPage";
import StudentsPage from "@/pages/teacher/StudentsPage";
import MarksEntryPage from "@/pages/teacher/MarksEntryPage";
import QuestionUploadPage from "@/pages/teacher/QuestionUploadPage";
import TeacherResultsPage from "@/pages/teacher/ResultsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* Admin Routes */}
              <Route path="/admin/classes" element={<RoleGuard role="super_admin"><ClassesPage /></RoleGuard>} />
              <Route path="/admin/teachers" element={<RoleGuard role="super_admin"><TeachersPage /></RoleGuard>} />
              <Route path="/admin/subjects" element={<RoleGuard role="super_admin"><SubjectsPage /></RoleGuard>} />
              <Route path="/admin/assign" element={<RoleGuard role="super_admin"><AssignSubjectsPage /></RoleGuard>} />
              <Route path="/admin/exams" element={<RoleGuard role="super_admin"><ExamsPage /></RoleGuard>} />
              <Route path="/admin/question-papers" element={<RoleGuard role="super_admin"><QuestionPapersPage /></RoleGuard>} />
              <Route path="/admin/results" element={<RoleGuard role="super_admin"><AdminResultsPage /></RoleGuard>} />
              {/* Teacher Routes */}
              <Route path="/teacher/students" element={<RoleGuard role="teacher"><StudentsPage /></RoleGuard>} />
              <Route path="/teacher/marks" element={<RoleGuard role="teacher"><MarksEntryPage /></RoleGuard>} />
              <Route path="/teacher/question-upload" element={<RoleGuard role="teacher"><QuestionUploadPage /></RoleGuard>} />
              <Route path="/teacher/results" element={<RoleGuard role="teacher"><TeacherResultsPage /></RoleGuard>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
