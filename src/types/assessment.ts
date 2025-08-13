export type CompetencyCode = 'PRO' | 'COM' | 'FPA' | 'FPM' | 'LTW' | 'PSD' | 'SAW' | 'WLM'

export const COMPETENCIES_CODES: CompetencyCode[] = [
  'PRO',
  'COM',
  'FPA',
  'FPM',
  'LTW',
  'PSD',
  'SAW',
  'WLM',
] as const

export type Competency = {
  code: CompetencyCode
  name: string
  description: string
  nameEn: string
}

export type CompetencyScore = {
  competencyCode: CompetencyCode
  score: number | null
}

export type AssessmentSourceType = 'PC' | 'FDM' | 'EVAL' | 'ASR'

export const ASSESSMENT_TYPES: AssessmentSourceType[] = ['EVAL', 'PC', 'ASR', 'FDM']

export type Assessment = {
  id: string
  type: AssessmentSourceType
  date: string
  competencyScores: CompetencyScore[]
  instructorComment?: string
  instructorName?: string
}

export const ASSESSMENT_TYPES_LABELS: Record<AssessmentSourceType, string> = {
  EVAL: 'Этап оценки (Evaluation phase, EVAL)',
  PC: 'Квалификационная проверка (Proficiency check, PC)',
  ASR: 'Авиационное событие (Aviation safety report, ASR)',
  FDM: 'Программа анализа полетных данных (Flight data monitoring, FDM)',
}

export const COMPETENCIES: Record<CompetencyCode, Competency> = {
  PRO: {
    code: 'PRO',
    name: 'Следование правилам и процедурам',
    nameEn: 'Procedures',
    description: 'Способность соблюдать установленные процедуры и правила',
  },
  COM: {
    code: 'COM',
    name: 'Взаимодействие',
    nameEn: 'Communication',
    description: 'Способность эффективно коммуницировать с экипажем и диспетчерами',
  },
  FPA: {
    code: 'FPA',
    name: 'Пилотирование в автоматическом режиме',
    nameEn: 'Flight Path Automation',
    description: 'Способность управлять траекторией полета используя автоматику',
  },
  FPM: {
    code: 'FPM',
    name: 'Пилотирование в ручном режиме',
    nameEn: 'Flight Path Manual',
    description: 'Способность управлять траекторией полета вручную',
  },
  LTW: {
    code: 'LTW',
    name: 'Лидерство и работа в команде',
    nameEn: 'Leadership and Teamwork',
    description: 'Способность эффективно управлять и работать в команде',
  },
  PSD: {
    code: 'PSD',
    name: 'Разрешение проблем и принятие решений',
    nameEn: 'Problem Solving and Decision',
    description: 'Способность анализировать проблемы и принимать обоснованные решения',
  },
  SAW: {
    code: 'SAW',
    name: 'Ситуационная осознанность',
    nameEn: 'Situation Awareness and Info Management',
    description: 'Способность воспринимать и понимать всю ситуацию полета',
  },
  WLM: {
    code: 'WLM',
    name: 'Управление рабочей нагрузкой',
    nameEn: 'Workload Management',
    description: 'Способность эффективно управлять задачами и ресурсами',
  },
}
