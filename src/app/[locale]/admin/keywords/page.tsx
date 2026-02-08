import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { KeywordLibrary } from '@/components/admin/KeywordLibrary';

export default function KeywordsPage() {
  return (
    <div className="flex h-screen bg-black">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <KeywordLibrary />
      </main>
    </div>
  );
}
