import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";
import { redirect } from "next/navigation";

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="hub-shell">
      <Sidebar userName={session.user.name} />
      <main className="hub-main">{children}</main>
    </div>
  );
}
