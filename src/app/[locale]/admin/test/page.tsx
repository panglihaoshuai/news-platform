import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { RealTimeTester } from '@/components/admin/RealTimeTester';

export default function TestPage() {
  return (
    <div className="flex h-screen bg-black">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <RealTimeTester />
      </main>
    </div>
  );
}
