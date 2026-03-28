import skillsData from "@/data/skills.json";
import { getImagesFromFolder } from "@/lib/imageResolver";
import SkillsClient from "./SkillsClient";

export default function SkillsPage() {
  // Resolve all folders in the skills data
  const resolvedSkills = skillsData.skills.map(mainCat => {
    // Resolve category-level images
    const categoryImages = getImagesFromFolder(mainCat.imageFolder as string);
    
    // Resolve tool-level images
    const resolvedSubcategories = mainCat.subcategories.map(subcat => ({
      ...subcat,
      tools: subcat.tools.map(tool => {
        const toolImages = (tool as any).imageFolder 
          ? getImagesFromFolder((tool as any).imageFolder) 
          : [];
        
        return {
          ...tool,
          popupImages: toolImages.length > 0 ? toolImages : ((tool as any).popupImages || [])
        };
      })
    }));

    return {
      ...mainCat,
      images: categoryImages.length > 0 ? categoryImages : ((mainCat as any).images || []),
      subcategories: resolvedSubcategories
    };
  });

  return <SkillsClient resolvedSkills={resolvedSkills} />;
}
