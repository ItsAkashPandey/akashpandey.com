import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import careerData from "@/data/career.json";
import educationData from "@/data/education.json";
import { careerSchema, educationSchema } from "@/lib/schemas";
import { BriefcaseBusiness, GraduationCap } from "lucide-react";
import {
  SectionSwitcherVisual,
  sectionSwitcherListClass,
  sectionSwitcherTriggerClass,
} from "./SectionSwitcher";
import Timeline from "./Timeline";

export default function Experience() {
  const career = careerSchema.parse(careerData).career;
  const education = educationSchema.parse(educationData).education;

  return (
    <Tabs defaultValue="education">
      <TabsList className={`${sectionSwitcherListClass} mb-3`}>
        <TabsTrigger value="education" className={sectionSwitcherTriggerClass}>
          <SectionSwitcherVisual
            Icon={GraduationCap}
            title="Education"
            count={education.length}
            tone="sky"
          />
        </TabsTrigger>
        <TabsTrigger value="work" className={sectionSwitcherTriggerClass}>
          <SectionSwitcherVisual
            Icon={BriefcaseBusiness}
            title="Experience"
            count={career.length}
            tone="emerald"
          />
        </TabsTrigger>
      </TabsList>
      <TabsContent value="education" className="mt-0">
        <Timeline experience={education}></Timeline>
      </TabsContent>
      <TabsContent value="work" className="mt-0">
        <Timeline experience={career}></Timeline>
      </TabsContent>
    </Tabs>
  );
}
