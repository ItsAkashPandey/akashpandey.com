"use client";

import { Badge } from "@/components/ui/Badge";
import { Activity } from "@/lib/schemas";
import Link from "next/link";
import Markdown from "react-markdown";
import Icon from "./Icon";
import ActivitySwipeCards from "./ActivitySwipeCards";
import { Calendar, MapPin, Users } from "lucide-react";

interface Props {
    activity: Activity;
    images?: string[];
}

export function ActivityCard({ activity, images: resolvedImages }: Props) {
    const { name, href, description, date, location, image, images, links } = activity;

    // Use resolved images (from folder scan) if provided, otherwise fall back to data
    const allImages = resolvedImages?.length ? resolvedImages : (images?.length ? images : (image ? [image] : []));

    // Format date nicely
    const formattedDate = new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <article
            style={{
                background: "rgba(255, 255, 255, 0.40)",
                backdropFilter: "blur(24px) saturate(160%)",
                WebkitBackdropFilter: "blur(24px) saturate(160%)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4), 0 8px 32px 0 rgba(0, 0, 0, 0.04)"
            }}
            className="group relative rounded-3xl p-7 transition-all duration-300
                       dark:!bg-white/[0.08] dark:!border-white/10 dark:!shadow-[0_4px_30px_rgba(0,0,0,0.3)]
                       hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)] dark:hover:shadow-primary/10"
        >
            {/* Subtle glass highlight on top edge */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />

            <div className="grid grid-cols-1 sm:grid-cols-[300px_1fr] gap-5.5 items-center">
                {/* Left Column — Date, Location & Photo */}
                <div className="flex flex-col items-center sm:items-start gap-3">
                    {/* Date & Location */}
                    <div className="flex flex-col gap-1.5 w-full">
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary/80">
                            <Calendar className="size-3.5" />
                            <time dateTime={date}>{formattedDate}</time>
                        </div>
                        {location && (
                            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80">
                                <MapPin className="size-3.5" />
                                <span>{location}</span>
                            </div>
                        )}
                    </div>

                    {/* Swipe Cards */}
                    {allImages.length > 0 && (
                        <ActivitySwipeCards
                            images={allImages}
                            className="w-[280px] max-w-[280px]"
                        />
                    )}
                </div>

                {/* Right Column — Title, Description, Links */}
                <div className="flex flex-col gap-3 min-w-0">
                    {/* Title */}
                    <h2 className="text-xl font-bold leading-snug tracking-tight group-hover:text-primary transition-colors duration-200">
                        {href ? (
                            <Link href={href} target="_blank" rel="noreferrer" className="hover:underline underline-offset-4 decoration-primary/30 decoration-2">
                                {name}
                            </Link>
                        ) : (
                            name
                        )}
                    </h2>

                    {/* Accent line */}
                    <div className="h-0.5 w-10 rounded-full bg-gradient-to-r from-primary/40 to-transparent" />

                    {/* Description & Collaborators */}
                    <div className="prose max-w-full text-justify font-sans text-sm leading-relaxed text-muted-foreground dark:prose-invert">
                        {(() => {
                            // Split by "With: " (allowing for newlines before it)
                            const parts = description.split(/\n+\s*With:\s*/);
                            const mainContent = parts[0];
                            const collaborators = parts[1];

                            return (
                                <>
                                    <Markdown>{mainContent}</Markdown>
                                    {collaborators && (
                                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 pt-3 border-t border-primary/10 dark:border-white/5">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary/70 dark:text-primary/60 uppercase tracking-widest bg-primary/5 dark:bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                                                <Users className="size-3" />
                                                <span>With</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground/90 font-medium italic">
                                                {collaborators}
                                            </span>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    {/* Links */}
                    {links && links.length > 0 && (
                        <div className="flex flex-row flex-wrap items-center gap-2 pt-1">
                            {links.map((link, idx) => (
                                <Link href={link?.href} key={idx} target="_blank">
                                    <Badge className="flex gap-2 px-2.5 py-1 text-[10px] backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-sm">
                                        <Icon name={link.icon} className="size-3" />
                                        {link.name}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
