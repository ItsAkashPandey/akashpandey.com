import SkillsExplorer, { type SkillCategoryView } from "@/components/SkillsExplorer";
import { getSkills } from "@/lib/content";
import { getPhotos } from "@/lib/photos";

export default function SkillsPage() {
  const categories: SkillCategoryView[] = getSkills().map((category) => ({
    ...category,
    photos: getPhotos(category.images ?? []),
    subcategories: category.subcategories.map((subcategory) => ({
      ...subcategory,
      tools: subcategory.tools.map((tool) => ({
        ...tool,
        photos: getPhotos(tool.popupImages ?? [], 0),
      })),
    })),
  }));

  return (
    <article className="page-shell relative">
      <header className="page-heading">
        <h1 className="title">my skills.</h1>
        <p className="page-lede">
          The field instruments I have carried, set up and flown, and the
          software I use to turn what they record into maps, time series and
          papers.
        </p>
      </header>

      <SkillsExplorer categories={categories} />
    </article>
  );
}
