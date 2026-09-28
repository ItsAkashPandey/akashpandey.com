import { readAdminSession } from "@/lib/admin-auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ChatLogsClient from "./chat-logs/ChatLogsClient";

export const metadata: Metadata = {
  title: "Chat logs",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await readAdminSession();
  if (!session) redirect("/admin/login?next=%2Fadmin");

  return <ChatLogsClient adminUsername={session.username} />;
}
