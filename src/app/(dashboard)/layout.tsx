import { Sidebar } from "@/components/sidebar";
import { TopNavbar } from "@/components/top-navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <TopNavbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
