"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { useEffect, useState, type ReactNode } from "react";
import { FieldCaseIcon, OpenLeavesIcon } from "./icons/FieldIcons";
import {
  SectionSwitcherVisual,
  sectionSwitcherListClass,
  sectionSwitcherTriggerClass,
} from "./SectionSwitcher";

type Tab = "work" | "education";

/**
 * Opens on current work. `/#work` and `/#education` (the map's popups link
 * there) pick the tab and scroll the section into view.
 */
export default function ExperienceTabs({
  work,
  education,
  workCount,
  educationCount,
}: {
  work: ReactNode;
  education: ReactNode;
  workCount: number;
  educationCount: number;
}) {
  const [tab, setTab] = useState<Tab>("work");

  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash !== "work" && hash !== "education") return;
      setTab(hash);
      document
        .getElementById("experience")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
      <TabsList className={`${sectionSwitcherListClass} mb-3`}>
        <TabsTrigger value="work" className={sectionSwitcherTriggerClass}>
          <SectionSwitcherVisual
            Icon={FieldCaseIcon}
            title="Experience"
            count={workCount}
            tone="green"
          />
        </TabsTrigger>
        <TabsTrigger value="education" className={sectionSwitcherTriggerClass}>
          <SectionSwitcherVisual
            Icon={OpenLeavesIcon}
            title="Education"
            count={educationCount}
            tone="sky"
          />
        </TabsTrigger>
      </TabsList>
      <TabsContent value="work" className="mt-0">
        {work}
      </TabsContent>
      <TabsContent value="education" className="mt-0">
        {education}
      </TabsContent>
    </Tabs>
  );
}
