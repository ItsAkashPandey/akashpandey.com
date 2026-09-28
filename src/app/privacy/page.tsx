import fs from "node:fs";
import path from "node:path";
import ReactMarkdown from "react-markdown";

/** Rendered straight from src/data/privacy.md at build time. */
function readPrivacyPolicy() {
  return fs.readFileSync(
    path.join(process.cwd(), "src", "data", "privacy.md"),
    "utf-8",
  );
}

export default function PrivacyPage() {
  return (
    <article className="page-shell">
      <header className="page-heading">
        <h1 className="title">privacy policy.</h1>
      </header>

      <div className="prose dark:prose-invert">
        <ReactMarkdown>{readPrivacyPolicy()}</ReactMarkdown>
      </div>
    </article>
  );
}
