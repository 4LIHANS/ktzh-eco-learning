export type UserRole = 'admin' | 'methodist' | 'manager' | 'employee'

export interface ApiUser {
  id: string
  login: string
  fullName: string
  firstName: string
  initials: string
  department: string
  role: UserRole
  preferredLang: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error ?? 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  login: (login: string, password: string) =>
    request<{ user: ApiUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    }),

  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  me: () => request<{ user: ApiUser }>('/auth/me'),

  setLanguage: (lang: 'ru' | 'kk') =>
    request<{ preferredLang: string }>('/auth/language', {
      method: 'PATCH',
      body: JSON.stringify({ lang }),
    }),

  dashboardStats: () => request<DashboardStats>('/dashboard/stats'),

  notifications: () => request<{ items: NotificationItem[] }>('/dashboard/notifications'),

  certificates: () => request<{ items: CertificateItem[] }>('/dashboard/certificates'),

  results: () => request<{ items: ResultItem[] }>('/dashboard/results'),

  getCourse: (slug: string) => request<CourseDetail>(`/courses/${slug}`),

  watchLesson: (slug: string, lessonId: string) =>
    request(`/courses/${slug}/lessons/${lessonId}/watch`, { method: 'POST' }),

  getTest: (slug: string, lessonId: string) =>
    request<TestPayload>(`/courses/${slug}/lessons/${lessonId}/test`),

  submitTest: (slug: string, lessonId: string, answers: { questionId: string; optionIds: string[] }[]) =>
    request<TestResult>(`/courses/${slug}/lessons/${lessonId}/test/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  downloadMaterial: (materialId: string) =>
    `/api/courses/materials/${materialId}/download`,

  reportsSummary: () => request<ReportsSummary>('/reports/summary'),

  exportReport: () => `/api/reports/export?format=csv`,

  users: () => request<{ users: AdminUser[] }>('/users'),

  updateUser: (id: string, data: Partial<{ isBlocked: boolean; role: string; department: string }>) =>
    request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  adminSections: () => request<{ sections: SectionItem[] }>('/admin/sections'),

  adminTests: () => request<{ tests: AdminTest[] }>('/admin/tests'),

  uploadMaterial: (formData: FormData) =>
    request<{ courseId: string; lessonId: string }>('/admin/materials', {
      method: 'POST',
      body: formData,
    }),

  getSettings: () => request<{ settings: PlatformSettings }>('/admin/settings'),

  updateSettings: (data: Partial<PlatformSettings>) =>
    request<{ settings: PlatformSettings }>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}

export interface DashboardStats {
  totalCourses: number
  completedCourses: number
  inProgressCourses: number
  avgScore: number
  unfinished: number
  courses: CourseCard[]
}

export interface CourseCard {
  id: string
  courseId: string
  titleRu: string
  titleKk: string
  lessons: number
  durationMin: number
  progress: number
  thumbColor: string
  icon: string
  iconColor: string
  status: 'completed' | 'inProgress' | 'notStarted'
}

export interface NotificationItem {
  id: string
  titleRu: string
  titleKk: string
  messageRu: string
  messageKk: string
  isRead: boolean
  createdAt: string
}

export interface CertificateItem {
  id: string
  courseId: string
  titleRu: string
  titleKk: string
  issuedAt: string
}

export interface ResultItem {
  id: string
  courseTitleRu: string
  courseTitleKk: string
  lessonOrder: number
  score: number
  passed: boolean
  attempt: number
  date: string
}

export interface CourseDetail {
  id: string
  titleRu: string
  titleKk: string
  lessons: LessonDetail[]
}

export interface LessonDetail {
  id: string
  order: number
  titleRu: string
  titleKk: string
  durationSec: number
  completed: boolean
  videoWatched: boolean
  materials: { id: string; type: string; titleRu: string; titleKk: string; fileName: string | null }[]
  hasTest: boolean
  testConfig: { passScore: number; maxAttempts: number; timeLimitMin: number } | null
}

export interface TestPayload {
  testId: string
  passScore: number
  timeLimitMin: number
  attemptNumber: number
  questions: {
    id: string
    type: string
    textRu: string
    textKk: string
    options: { id: string; textRu: string; textKk: string }[]
  }[]
}

export interface TestResult {
  score: number
  passed: boolean
  correct: number
  total: number
}

export interface ReportsSummary {
  employees: number
  trained: number
  coverage: number
  avgScore: number
  departmentCoverage: { department: string; coverage: number }[]
  recentResults: {
    employee: string
    courseRu: string
    courseKk: string
    score: string
    status: string
  }[]
}

export interface AdminUser {
  id: string
  login: string
  fullName: string
  department: string
  role: string
  isBlocked: boolean
}

export interface SectionItem {
  id: string
  nameRu: string
  nameKk: string
  courses: { id: string; slug: string; titleRu: string; titleKk: string }[]
}

export interface AdminTest {
  id: string
  courseRu: string
  courseKk: string
  lessonOrder: number
  questionCount: number
  passScore: number
  maxAttempts: number
  timeLimitMin: number
}

export interface PlatformSettings {
  emailNotifications: boolean
  ssoEnabled: boolean
  backupEnabled: boolean
}

export function isAdminPanelRole(role: UserRole) {
  return role === 'admin' || role === 'methodist'
}

export function isReportsRole(role: UserRole) {
  return role === 'admin' || role === 'methodist' || role === 'manager'
}

export function homePath(role: UserRole) {
  if (role !== 'employee' && isReportsRole(role)) return '/admin/reports'
  return '/dashboard'
}

export function localized(ru: string, kk: string, lang: string) {
  return lang === 'kk' ? kk : ru
}
