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
      <div className="flex min-w-0 items-center gap-3">
        <h2 className="title text-2xl sm:text-3xl">{title}</h2>
        {detail}
      </div>
      {action}
    </div>
  );
}
