import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { QualityConsole } from '@/components/admin/QualityConsole';
import { SourceOperationsPanel } from '@/components/admin/SourceOperationsPanel';

export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-black">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">A: 数据源运营台</h2>
          <SourceOperationsPanel />
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">B: 质量控制台</h2>
          <QualityConsole />
        </section>
      </main>
    </div>
  );
}
