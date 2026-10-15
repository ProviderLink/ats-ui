import ForgotPasswordPage from '@/app/auth/forgot-password/page';
import { AuthLayout } from '@/app/auth/layout';
import LoginPage from '@/app/auth/login/page';
import ResetPasswordPage from '@/app/auth/reset-password/page';
import VerifyEmailPage from '@/app/auth/verify-email/page';
import CalendarPage from '@/app/calendar/page';
import CandidateDetailPage from '@/app/candidates/[id]/page';
import CandidatesPage from '@/app/candidates/page';
import CandidateQuickImportPage from '@/app/candidates/quick-import/page';
import CareersApplyPage from '@/app/careers/[id]/apply/page';
import CareerJobDetailPage from '@/app/careers/[id]/page';
import CareersPage from '@/app/careers/page';
import ClientDetailPage from '@/app/clients/[id]/page';
import ClientNewPage from '@/app/clients/new/page';
import ClientsPage from '@/app/clients/page';
import Dashboard from '@/app/dashboard/page';
import EmailDetailPage from '@/app/emails/[id]/page';
import EmailsPage from '@/app/emails/page';
import ErrorPage from '@/app/error';
import HiredPage from '@/app/hired/page';
import HomePage from '@/app/home/page';
import JobDetailPage from '@/app/jobs/[id]/page';
import JobNewPage from '@/app/jobs/new/page';
import JobsPage from '@/app/jobs/page';
import NotFoundPage from '@/app/not-found';
import PermanentlyIneligiblePage from '@/app/permanently-ineligible/page';
import SettingsAccountPage from '@/app/settings/account/page';
import SettingsDispositionReasonsPage from '@/app/settings/disposition-reasons/page';
import SettingsGeneralPage from '@/app/settings/general/page';
import TagsPage from '@/app/tags/page';
import TalentPoolPage from '@/app/talent-pool/page';
import TeamMemberPage from '@/app/team/[id]/page';
import TeamPage from '@/app/team/page';
import UnauthorizedPage from '@/app/unauthorized/page';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { RoleGuard } from '@/components/auth/role-guard';
import { Layout } from '@/components/layout';
import { PublicShell } from '@/components/public-shell';
import type { UserRole } from '@/store/types/enums';
import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

const ADMIN_ONLY: UserRole[] = ['admin'];
const STAFF_ROLES: UserRole[] = [
  'admin',
  'hiring_manager',
  'recruiter',
  'coordinator',
];

const guarded = (allowedRoles: UserRole[], page: ReactNode) => (
  <RoleGuard allowedRoles={allowedRoles}>{page}</RoleGuard>
);

export const router = createBrowserRouter([
  // Public careers portal — no auth required
  {
    element: <PublicShell />,
    children: [
      { path: 'careers', element: <CareersPage /> },
      { path: 'careers/:id', element: <CareerJobDetailPage /> },
      { path: 'careers/:id/apply', element: <CareersApplyPage /> },
    ],
  },
  // ATS routes (public landing + auth + protected app)
  {
    path: 'ats',
    children: [
      // Public landing page
      { index: true, element: <HomePage /> },
      // Auth pages
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
          { path: 'verify-email/:token', element: <VerifyEmailPage /> },
        ],
      },
      // Protected app pages
      {
        element: <ProtectedRoute />,
        errorElement: <ErrorPage />,
        children: [
          {
            element: <Layout />,
            children: [
              { path: 'dashboard', element: <Dashboard /> },
              { path: 'clients', element: <ClientsPage /> },
              { path: 'clients/new', element: <ClientNewPage /> },
              { path: 'clients/:id', element: <ClientDetailPage /> },
              { path: 'jobs', element: <JobsPage /> },
              { path: 'jobs/new', element: <JobNewPage /> },
              { path: 'jobs/:id', element: <JobDetailPage /> },
              { path: 'candidates', element: <CandidatesPage /> },
              {
                path: 'candidates/quick-import',
                element: <CandidateQuickImportPage />,
              },
              { path: 'candidates/:id', element: <CandidateDetailPage /> },
              { path: 'talent-pool', element: <TalentPoolPage /> },
              { path: 'hired', element: <HiredPage /> },
              {
                path: 'permanently-ineligible',
                element: guarded(ADMIN_ONLY, <PermanentlyIneligiblePage />),
              },
              { path: 'calendar', element: <CalendarPage /> },
              { path: 'team', element: guarded(ADMIN_ONLY, <TeamPage />) },
              {
                path: 'team/:id',
                element: guarded(ADMIN_ONLY, <TeamMemberPage />),
              },
              {
                path: 'settings',
                element: <Navigate to="/ats/settings/general" replace />,
              },
              {
                path: 'settings/general',
                element: guarded(STAFF_ROLES, <SettingsGeneralPage />),
              },
              {
                path: 'settings/disposition-reasons',
                element: guarded(ADMIN_ONLY, <SettingsDispositionReasonsPage />),
              },
              { path: 'account', element: <SettingsAccountPage /> },
              { path: 'tags', element: <TagsPage /> },
              { path: 'emails', element: <EmailsPage /> },
              { path: 'emails/:id', element: <EmailDetailPage /> },
            ],
          },
        ],
      },
      { path: 'unauthorized', element: <UnauthorizedPage /> },
    ],
  },
  { path: '/', element: <NotFoundPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
