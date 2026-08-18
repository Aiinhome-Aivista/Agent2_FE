import { useQuery } from '@tanstack/react-query';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, Users, Activity } from 'lucide-react';
import { dashboardApi } from '@/services/api/endpoints';
import { PageSpinner } from '@/components/ui/Spinner';

interface Engineer {
  id: string;
  full_name: string;
  email: string;
  job_title?: string;
  active_tickets: number;
}

interface EscalatedTicket {
  id: string;
  subject: string;
  priority: string;
  created_at: string;
}

interface DashboardData {
  engineers: Engineer[];
  escalated_tickets: EscalatedTicket[];
}

export default function TeamLeadDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['teamLeadDashboard'],
    queryFn: async () => {
      const data = await dashboardApi.teamLeadDashboard();
      return data as unknown as DashboardData;
    },
  });

  if (isLoading) {
    return (
      <PageWrapper>
        <PageSpinner />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <div className="text-red-500">Failed to load dashboard data.</div>
      </PageWrapper>
    );
  }

  const { engineers, escalated_tickets } = data || { engineers: [], escalated_tickets: [] };

  return (
      <PageWrapper>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">Team Lead Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Engineers Bandwidth Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              Team Bandwidth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engineers.length === 0 ? (
                <div className="text-gray-500 text-sm">No engineers found.</div>
              ) : (
                engineers.map((engineer) => (
                  <div key={engineer.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        {engineer.full_name}
                        {engineer.job_title && (
                          <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                            {engineer.job_title}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{engineer.email}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-gray-500 mb-1">Active Tickets</span>
                      <Badge variant={engineer.active_tickets > 5 ? 'critical' : engineer.active_tickets > 2 ? 'warning' : 'success'}>
                        {engineer.active_tickets}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Escalated Tickets Card */}
        <Card className="col-span-1 border-error-200 dark:border-error-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-error-600 dark:text-error-400">
              <AlertCircle className="w-5 h-5" />
              Escalated / Declined Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[210px] overflow-y-auto pr-2 custom-scrollbar">
              {escalated_tickets.length === 0 ? (
                <div className="text-gray-500 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" /> No pending escalations.
                </div>
              ) : (
                escalated_tickets.map((ticket) => (
                  <div key={ticket.id} className="p-3 border border-error-100 dark:border-error-800 rounded-lg bg-error-50 dark:bg-error-900/20">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{ticket.id}</div>
                      <Badge variant="critical">{ticket.priority}</Badge>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{ticket.subject}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Created: {new Date(ticket.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
      </div>
    </PageWrapper>
  );
}
