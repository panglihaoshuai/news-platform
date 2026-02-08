import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ClassificationWorkbench } from '@/components/admin/ClassificationWorkbench';

export default function AdminPage() {
  return (
    <div className="flex h-screen bg-black">
      <AdminSidebar />
      <main className="flex-1 overflow-hidden">
        <ClassificationWorkbench />
      </main>
    </div>
  );
}
