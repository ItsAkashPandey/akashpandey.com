import ReactMarkdown from "react-markdown";
import { PRIVACY_CONTENT } from "@/data/static-content";

export default async function PrivacyPage() {
  const privacyContent = PRIVACY_CONTENT;

  return (
    <article className="mt-8 flex flex-col gap-8 pb-16">
      <h1 className="title">privacy policy.</h1>

      <div className="prose dark:prose-invert">
        <ReactMarkdown>{privacyContent}</ReactMarkdown>
      </div>
    </article>
  );
}