import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { authGuard } from './guards/auth.guard';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfesorIaComponent } from './components/profesor-ia/profesor-ia.component';
import { SubjectsListComponent } from './components/subjects/subjects-list.component';
import { SubjectDetailComponent } from './components/subjects/subject-detail.component';
import { JobsComponent } from './components/jobs/jobs.component';
import { MiCvComponent } from './components/mi-cv/mi-cv.component';
import { RoadmapsComponent } from './components/roadmaps/roadmaps.component';
import { RoadmapsListComponent } from './components/roadmaps-list/roadmaps-list.component';
import { RoadmapDetailComponent } from './components/roadmap-detail/roadmap-detail.component';
import { StudyGroups } from './components/study-groups/study-groups';
import { GroupDetailComponent } from './components/group-detail/group-detail';
import { AcademicRiskComponent } from './components/academic-risk/academic-risk';
import { ProfileComponent } from './components/profile/profile';
import { NotificationsComponent } from './components/notifications/notifications';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'subjects', component: SubjectsListComponent, canActivate: [authGuard] },
  { path: 'subjects/:id', component: SubjectDetailComponent, canActivate: [authGuard] },
  { path: 'profesor-ia', component: ProfesorIaComponent, canActivate: [authGuard] },
  // { path: 'empleos', component: JobsComponent, canActivate: [authGuard] },
  { path: 'mi-cv', component: MiCvComponent, canActivate: [authGuard] },
  {
    path: 'roadmaps',
    component: RoadmapsComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: RoadmapsListComponent },
      { path: ':id', component: RoadmapDetailComponent },
    ],
  },
  { path: 'grupos', component: StudyGroups, canActivate: [authGuard] },
  { path: 'grupos/:id', component: GroupDetailComponent, canActivate: [authGuard] },
  { path: 'riesgo', component: AcademicRiskComponent, canActivate: [authGuard] },
  { path: 'perfil', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'notificaciones', component: NotificationsComponent, canActivate: [authGuard] },
];
