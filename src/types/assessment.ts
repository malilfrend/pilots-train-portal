export type CompetencyCode = 'KNO' | 'PRO' | 'FPA' | 'FPM' | 'COM' | 'LDR' | 'WSA' | 'WLM' | 'PSD'

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

export type AssessmentSourceType = 'KP' | 'PADP' | 'EVAL' | 'AS'

export const ASSESSMENT_TYPES: AssessmentSourceType[] = ['KP', 'PADP', 'EVAL', 'AS']

export type Assessment = {
  id: string
  type: AssessmentSourceType
  date: string
  competencyScores: CompetencyScore[]
  instructorComment?: string
  instructorName?: string
}

export const COMPETENCIES: Record<CompetencyCode, Competency> = {
  KNO: {
    code: 'KNO',
    name: 'Применение знаний',
    nameEn: 'Knowledge',
    description: 'Способность применять соответствующие знания',
  },
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
  LDR: {
    code: 'LDR',
    name: 'Лидерство и работа в команде',
    nameEn: 'Leadership',
    description: 'Способность эффективно управлять и работать в команде',
  },
  PSD: {
    code: 'PSD',
    name: 'Разрешение проблем и принятие решений',
    nameEn: 'Problem Solving and Decision',
    description: 'Способность анализировать проблемы и принимать обоснованные решения',
  },
  WSA: {
    code: 'WSA',
    name: 'Ситуационная осознанность',
    nameEn: 'Workload and Situation Awareness',
    description: 'Способность воспринимать и понимать всю ситуацию полета',
  },
  WLM: {
    code: 'WLM',
    name: 'Управление рабочей нагрузкой',
    nameEn: 'Workload Management',
    description: 'Способность эффективно управлять задачами и ресурсами',
  },
}
