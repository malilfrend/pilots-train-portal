export type CompetencyCode = 'APK' | 'COM' | 'FPA' | 'FPM' | 'LTW' | 'PSD' | 'SAW' | 'WLM' | 'KNO'

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

export type AssessmentType = 'EVAL' | 'QUALIFICATION' | 'AVIATION_EVENT' | 'FLIGHT_DATA_ANALYSIS'

export type Assessment = {
  id: string
  type: AssessmentType
  date: string
  competencyScores: CompetencyScore[]
  instructorComment?: string
}

export const COMPETENCIES: Record<CompetencyCode, Competency> = {
  APK: {
    code: 'APK',
    name: 'Следование правилам и процедурам',
    nameEn: 'Application of Procedures',
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
    nameEn: 'Aircraft Flight Path Management, automation',
    description: 'Способность управлять траекторией полета используя автоматику',
  },
  FPM: {
    code: 'FPM',
    name: 'Пилотирование в ручном режиме',
    nameEn: 'Aircraft Flight Path Management, manual control',
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
    nameEn: 'Problem Solving and Decision Making',
    description: 'Способность анализировать проблемы и принимать обоснованные решения',
  },
  SAW: {
    code: 'SAW',
    name: 'Ситуационная осознанность',
    nameEn: 'Situational Awareness',
    description: 'Способность воспринимать и понимать всю ситуацию полета',
  },
  WLM: {
    code: 'WLM',
    name: 'Управление рабочей нагрузкой',
    nameEn: 'Workload Management',
    description: 'Способность эффективно управлять задачами и ресурсами',
  },
  KNO: {
    code: 'KNO',
    name: 'Применение знаний',
    nameEn: 'Application of Knowledge',
    description: 'Способность применять соответствующие знания',
  },
}
