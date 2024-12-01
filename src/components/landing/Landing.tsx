'use client'

import { HeroSection } from './sections/HeroSection'
import { CurrentSystemSection } from './sections/CurrentSystemSection'
import { DisadvantagesSection } from './sections/DisadvantagesSection'
import { SiteStructureSection } from './sections/SiteStructureSection'
import { ProjectPrinciplesSection } from './sections/ProjectPrinciplesSection'
import { PilotBenefitsSection } from './sections/PilotBenefitsSection'
import { InstructorBenefitsSection } from './sections/InstructorBenefitsSection'
import { CompanyBenefitsSection } from './sections/CompanyBenefitsSection'

export function Landing() {
  return (
    <div className="w-full bg-[#f2f2f2]">
      <HeroSection />
      <CurrentSystemSection />
      <DisadvantagesSection />
      <SiteStructureSection />
      <ProjectPrinciplesSection />
      <PilotBenefitsSection />
      <InstructorBenefitsSection />
      <CompanyBenefitsSection />
    </div>
  )
}
