import { getCareer, getEducation } from "@/lib/content";
import ExperienceTabs from "./ExperienceTabs";
import Timeline from "./Timeline";

export default function Experience() {
  const career = getCareer();
  const education = getEducation();

  return (
    <ExperienceTabs
      workCount={career.length}
      educationCount={education.length}
      work={<Timeline experience={career} />}
      education={<Timeline experience={education} />}
    />
  );
}
