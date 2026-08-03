import type { ReactNode } from "react";

export default function SectionHeading({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div className="flex min-w-0 items-baseline gap-3">
        <h2 className="section-title">{title}</h2>
        {detail}
      </div>
      {action}
    </div>
  );
}
