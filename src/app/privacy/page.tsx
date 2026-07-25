import ReactMarkdown from "react-markdown";
import { PRIVACY_CONTENT } from "@/data/static-content";

export default async function PrivacyPage() {
  const privacyContent = PRIVACY_CONTENT;

  return (
    <article className="page-shell">
      <header className="page-heading">
        <h1 className="title">privacy policy.</h1>
      </header>

      <div className="prose dark:prose-invert">
        <ReactMarkdown>{privacyContent}</ReactMarkdown>
      </div>
    </article>
  );
}
