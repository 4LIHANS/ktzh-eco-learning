export const courses = [
  {
    id: 'safety',
    titleKey: 'courses.safety',
    lessons: 8,
    duration: 45,
    progress: 100,
    status: 'completed' as const,
    thumb: 'green' as const,
    icon: 'ti-leaf',
    iconColor: '#1a5c38',
  },
  {
    id: 'water',
    titleKey: 'courses.water',
    lessons: 6,
    duration: 30,
    progress: 60,
    status: 'inProgress' as const,
    thumb: 'blue' as const,
    icon: 'ti-droplet',
    iconColor: '#185fa5',
  },
  {
    id: 'waste',
    titleKey: 'courses.waste',
    lessons: 5,
    duration: 25,
    progress: 0,
    status: 'notStarted' as const,
    thumb: 'amber' as const,
    icon: 'ti-flame',
    iconColor: '#854f0b',
  },
]

export const departmentCoverage = [
  { key: 'departments.almaty', value: 92 },
  { key: 'departments.astana', value: 78 },
  { key: 'departments.shymkent', value: 65 },
  { key: 'departments.aktobe', value: 54 },
]

export const recentResults = [
  { employee: 'Сейткали М.', courseKey: 'shortCourses.safety', score: '94%', status: 'passed' as const },
  { employee: 'Досов Р.', courseKey: 'shortCourses.waste', score: '58%', status: 'failed' as const },
  { employee: 'Нурова А.', courseKey: 'shortCourses.water', score: '87%', status: 'passed' as const },
  { employee: 'Каиров Б.', courseKey: 'shortCourses.safety', score: '—', status: 'inProgress' as const },
]

export const testHistory = [
  { courseKey: 'courses.safety', score: 94, date: '2026-05-12', attempt: 1 },
  { courseKey: 'courses.water', score: 72, date: '2026-06-01', attempt: 1 },
  { courseKey: 'courses.water', score: 87, date: '2026-06-03', attempt: 2 },
]

export const employees = [
  { name: 'Ахметов А.Б.', departmentKey: 'departments.almaty', role: 'employee', status: 'active' },
  { name: 'Сейткали М.', departmentKey: 'departments.astana', role: 'employee', status: 'active' },
  { name: 'Нурова А.', departmentKey: 'departments.shymkent', role: 'employee', status: 'active' },
  { name: 'Каиров Б.', departmentKey: 'departments.aktobe', role: 'employee', status: 'active' },
]
