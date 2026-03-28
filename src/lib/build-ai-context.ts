import activitiesData from "@/data/activities.json";
import publicationsData from "@/data/publications.json";
import skillsData from "@/data/skills.json";
import careerData from "@/data/career.json";
import educationData from "@/data/education.json";
import fs from "fs";
import path from "path";

/**
 * Build dynamic AI context by combining manually fed knowledge (PROFILE_CONTENT)
 * with auto-generated summaries from the website's JSON data files.
 *
 * This ensures that whenever activities, publications, skills, or career data
 * is updated, Kasi automatically knows about the changes (after rebuild/redeploy).
 */
export function buildAIContext(): string {
  let profileContent = "Akash's website assistant.";
  try {
    profileContent = fs.readFileSync(path.join(process.cwd(), "src", "data", "profile.md"), "utf-8");
  } catch (err) {
    console.error("Failed to read profile.md", err);
  }

  const sections: string[] = [profileContent];

  // ── Activities ──
  try {
    const activities = (activitiesData as any).activities || [];
    if (activities.length > 0) {
      const activityLines = activities
        .slice(0, 30) // Limit to keep context size reasonable
        .map((a: any) => {
          const date = a.date ? new Date(a.date).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "";
          const loc = a.location ? ` (${a.location})` : "";
          const desc = a.description
            ? a.description.replace(/\n/g, " ").slice(0, 150)
            : "";
          return `- ${date}: ${a.name}${loc} — ${desc}`;
        });

      sections.push(
        `\n## Recent Activities (from website)\n${activityLines.join("\n")}`
      );
    }
  } catch {
    // Non-critical: skip if import fails
  }

  // ── Publications ──
  try {
    const pubs = (publicationsData as any).publications || [];
    if (pubs.length > 0) {
      const pubLines = pubs.map((p: any) => {
        const status = p.status ? ` [${p.status}]` : "";
        const journal = p.journal || p.conference || "";
        const quartile = p.journalQuartile ? ` (${p.journalQuartile})` : "";
        return `- ${p.year}: "${p.title}" — ${journal}${quartile}${status}`;
      });

      sections.push(
        `\n## All Publications (from website)\n${pubLines.join("\n")}`
      );
    }
  } catch {
    // Non-critical
  }

  // ── Skills ──
  try {
    const skillCategories = (skillsData as any).skills || [];
    if (skillCategories.length > 0) {
      const skillLines = skillCategories.map((cat: any) => {
        const subs = (cat.subcategories || [])
          .map((sub: any) => {
            const tools = (sub.tools || []).map((t: any) => t.name).join(", ");
            return `  - ${sub.name}: ${tools}`;
          })
          .join("\n");
        return `### ${cat.category}\n${subs}`;
      });

      sections.push(
        `\n## Full Skills & Tools (from website)\n${skillLines.join("\n")}`
      );
    }
  } catch {
    // Non-critical
  }

  // ── Career ──
  // Structure: { career: [{ name, positions: [{ title, start, end, description }] }] }
  try {
    const careers = (careerData as any).career || [];
    if (careers.length > 0) {
      const careerLines = careers.flatMap((c: any) => {
        return (c.positions || []).map((p: any) => {
          const desc = Array.isArray(p.description)
            ? p.description.join("; ")
            : (p.description || "");
          return `- ${p.title} at ${c.name} (${p.start} – ${p.end || "Present"}): ${desc}`;
        });
      });

      sections.push(
        `\n## Career History (from website)\n${careerLines.join("\n")}`
      );
    }
  } catch {
    // Non-critical
  }

  // ── Education ──
  // Structure: { education: [{ name, positions: [{ title, start, end, description }] }] }
  try {
    const education = (educationData as any).education || [];
    if (education.length > 0) {
      const eduLines = education.flatMap((e: any) => {
        return (e.positions || []).map((p: any) => {
          const desc = Array.isArray(p.description)
            ? p.description.join("; ")
            : (p.description || "");
          return `- ${p.title} from ${e.name} (${p.start} – ${p.end || "Present"}) — ${desc}`;
        });
      });

      sections.push(
        `\n## Education (from website)\n${eduLines.join("\n")}`
      );
    }
  } catch {
    // Non-critical
  }

  return sections.join("\n\n");
}
