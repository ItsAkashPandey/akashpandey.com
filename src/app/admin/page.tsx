import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ChatLogsClient from "./chat-logs/ChatLogsClient";
import {
  decodeAdminSessionCookieValue,
  getAdminCookieName,
  verifyAdminSessionCookieValue,
} from "@/lib/admin-auth";

export default async function AdminPage() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    redirect("/admin/login?next=%2Fadmin");
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(getAdminCookieName())?.value;

  if (!session || !verifyAdminSessionCookieValue(session, secret)) {
    redirect("/admin/login?next=%2Fadmin");
  }

  const decoded = decodeAdminSessionCookieValue(session, secret);
  return <ChatLogsClient adminUsername={decoded?.username ?? null} />;
}
