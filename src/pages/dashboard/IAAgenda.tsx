import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AgendaInsightsPanel } from "@/components/dashboard/AgendaInsightsPanel";

export default function IAAgenda() {
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        <AgendaInsightsPanel />
      </div>
    </DashboardLayout>
  );
}
