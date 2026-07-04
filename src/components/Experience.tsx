import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import careerData from "@/data/career.json";
import educationData from "@/data/education.json";
import { careerSchema, educationSchema } from "@/lib/schemas";
import { BriefcaseBusiness, GraduationCap } from "lucide-react";
import Timeline from "./Timeline";

export default function Experience() {
  const career = careerSchema.parse(careerData).career;
  const education = educationSchema.parse(educationData).education;

  return (
    <Tabs defaultValue="education">
      <TabsList className="border-border/55 bg-muted/45 mb-4 grid h-auto w-full grid-cols-2 gap-1.5 rounded-[20px] border p-1.5">
        <TabsTrigger
          value="education"
          className="group h-auto justify-start gap-3 rounded-[15px] px-3 py-3 text-left data-[state=active]:shadow-[0_8px_24px_rgba(15,23,42,.09)]"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
            <GraduationCap className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold">Education</span>
            <span className="text-muted-foreground hidden truncate text-[10px] font-normal sm:block">
              {education.length} academic milestones
            </span>
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="work"
          className="group h-auto justify-start gap-3 rounded-[15px] px-3 py-3 text-left data-[state=active]:shadow-[0_8px_24px_rgba(15,23,42,.09)]"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <BriefcaseBusiness className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold">Experience</span>
            <span className="text-muted-foreground hidden truncate text-[10px] font-normal sm:block">
              {career.length} roles and appointments
            </span>
          </span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="education">
        <Timeline experience={education}></Timeline>
      </TabsContent>
      <TabsContent value="work">
        <Timeline experience={career}></Timeline>
      </TabsContent>
    </Tabs>
  );
}
