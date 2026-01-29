import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

// Layouts, Guards & Pages
import AdminLayout from './components/layout/AdminLayout';
import RoleGuard from './components/common/RoleGuard'; // Import the new Guard
import Login from './pages/auth/Login';

// Dashboard Pages
import DashboardOverview from './pages/dashboard/Overview';
import Faculties from './pages/dashboard/Faculties';
import Departments from './pages/dashboard/Departments';
import Staff from './pages/dashboard/Staff';
import Programs from './pages/dashboard/Programs';
import Posts from './pages/dashboard/Posts';
import Events from './pages/dashboard/Events';
import CategoryPage from './pages/dashboard/CategoryPage';
import Pages from './pages/dashboard/Pages';
import Sliders from './pages/dashboard/Sliders';
import Settings from './pages/dashboard/Settings';
import Menus from './pages/dashboard/Menus';
import HomepageWidgets from './pages/dashboard/HomepageWidgets';
import Users from './pages/dashboard/Users';
import Messages from './pages/dashboard/Messages';
import Admissions from './pages/dashboard/Admissions';
import AcademicCalendar from './pages/dashboard/AcademicCalendar';
import TuitionManagement from './pages/dashboard/TuitionManagement';
import Trustees from './pages/dashboard/Trustees';
import JupebManager from './pages/dashboard/JupebManager';
import Scholarships from './pages/dashboard/Scholarships';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Toast Notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              style: { background: '#5c1885' }, // PCU Purple
            },
            error: {
              style: { background: '#da251d' }, // PCU Red
            },
          }}
        />

        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes Wrapper */}
          <Route path="/admin" element={<AdminLayout />}>
            
            {/* 1. PUBLIC DASHBOARD ACCESS (All Logged in Users) */}
            <Route element={<RoleGuard allowedRoles={[]} />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardOverview />} />
                <Route path="messages" element={<Messages />} />
            </Route>

            {/* 2. SUPER ADMIN ONLY (Restricted) */}
            <Route element={<RoleGuard allowedRoles={['Super Admin']} />}>
                <Route path="users" element={<Users />} />
                <Route path="settings" element={<Settings />} />
                <Route path="bot" element={<Trustees />} />
                <Route path="menus" element={<Menus />} />
            </Route>

            {/* 3. CONTENT MANAGEMENT (Super Admin, Content Editor) */}
            <Route element={<RoleGuard allowedRoles={['Super Admin', 'Content Editor', 'Admin']} />}>
                <Route path="posts" element={<Posts />} />
                <Route path="pages" element={<Pages />} />
                <Route path="sliders" element={<Sliders />} />
                <Route path="widgets" element={<HomepageWidgets />} />
                <Route path="categories" element={<CategoryPage />} />
            </Route>

            {/* 4. EVENT MANAGEMENT (Super Admin, Editor, Event Manager) */}
            <Route element={<RoleGuard allowedRoles={['Super Admin', 'Content Editor', 'Event Manager', 'Admin']} />}>
                <Route path="events" element={<Events />} />
            </Route>

            {/* 5. ACADEMIC CALENDAR (Super Admin, Event Manager, Academic Admin) */}
            <Route element={<RoleGuard allowedRoles={['Super Admin', 'Event Manager', 'Academic Admin', 'Admin']} />}>
                <Route path="academic-calendar" element={<AcademicCalendar />} />
            </Route>

            {/* 6. ACADEMIC STRUCTURE (Super Admin, Academic Admin) */}
            <Route element={<RoleGuard allowedRoles={['Super Admin', 'Academic Admin', 'Admin']} />}>
                <Route path="faculties" element={<Faculties />} />
                <Route path="departments" element={<Departments />} />
                <Route path="programs" element={<Programs />} />
                <Route path="jupeb" element={<JupebManager />} />
            </Route>

            {/* 7. ADMISSIONS (Super Admin, Academic Admin, Admission Officer) */}
            <Route element={<RoleGuard allowedRoles={['Super Admin', 'Academic Admin', 'Admission Officer', 'Admin']} />}>
                <Route path="admissions" element={<Admissions />} />
            </Route>

            {/* 8. FINANCE (Super Admin, Accountant, Academic Admin) */}
            <Route element={<RoleGuard allowedRoles={['Super Admin', 'Accountant', 'Academic Admin']} />}>
                <Route path="fees" element={<TuitionManagement />} />
                <Route path="scholarships" element={<Scholarships />} />
            </Route>

            {/* 9. STAFF MANAGEMENT (Super Admin, Staff Manager) */}
            <Route element={<RoleGuard allowedRoles={['Super Admin', 'Staff Manager', 'Human Resources', 'Admin']} />}>
                <Route path="staff" element={<Staff />} />
            </Route>

          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;