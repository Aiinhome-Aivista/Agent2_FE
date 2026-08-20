import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Ticket, CheckCircle2, XCircle, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { assignmentApi } from '@/services/api/endpoints';
import { formatRelativeTime } from '@/utils/formatters';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

export default function AutomatedActions() {
  const [page, setPage] = useState(1);
  const [selectedEngineer, setSelectedEngineer] = useState<string | null>(null);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['assignments-journey', page, selectedEngineer],
    queryFn: () => assignmentApi.journey(page, pageSize, selectedEngineer || undefined),
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <PageWrapper title="Assignment Journey" description="Tracking how tickets are distributed across the team.">
        <PageSpinner />
      </PageWrapper>
    );
  }

  const { engineers, incidents, total } = data || { engineers: [], incidents: [], total: 0 };

  const getEngineerName = (id: string) => {
    if (!id) return null;
    const eng = engineers.find((e: any) => e.id === id);
    return eng ? eng.full_name : null;
  };

  return (
    <PageWrapper
      title="Assignment Journey"
      description="Visual tracking of ticket distribution, acceptances, and escalations."
    >
      {/* Engineers Overview */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Users className="h-5 w-5" />
            Active Engineers ({engineers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => { setSelectedEngineer(null); setPage(1); }}
              className={`flex items-center gap-2 rounded-full py-1 px-6 shadow-soft-sm border transition-all ${
                selectedEngineer === null 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-surface text-foreground border-border hover:bg-surface-hover'
              }`}
            >
              <span className="text-sm font-semibold">All</span>
            </button>
            {engineers.map((eng: any) => (
              <button 
                key={eng.id} 
                onClick={() => { setSelectedEngineer(eng.id); setPage(1); }}
                className={`flex items-center gap-2 rounded-full py-1.5 px-3 shadow-soft-sm border transition-all ${
                  selectedEngineer === eng.id 
                    ? 'bg-primary/10 text-primary border-primary/30' 
                    : 'bg-surface text-foreground border-border hover:bg-surface-hover'
                }`}
              >
                <Avatar name={eng.full_name} size="sm" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{eng.full_name}</span>
                  <Badge variant={eng.active_tickets > 0 ? 'warning' : 'success'} className="px-1.5 py-0">
                    {eng.active_tickets}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Journey Flow */}
      {!incidents || incidents.length === 0 ? (
        <Card>
          <EmptyState
            icon={Ticket}
            title="No tickets found"
            description="Ticket assignment journeys will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident: any) => (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden">
                <div className="bg-surface-hover px-5 py-3 border-b border-border flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white bg-primary px-2 py-1 rounded-md border border-border">
                      {incident.id}
                    </span>
                    <span className="text-sm font-medium text-foreground">{incident.subject}</span>
                  </div>
                  <Badge variant={
                    incident.assignment_status === 'pending_approval' 
                      ? 'warning' 
                      : incident.assignment_status === 'assigned' 
                        ? 'success' 
                        : incident.status === 'escalated' || incident.assignment_status === 'escalated_to_lead'
                          ? 'critical'
                          : 'default'
                  }>
                    {incident.assignment_status}
                  </Badge>
                </div>
                
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {/* Start Node */}
                    <JourneyNode 
                      title="Ticket Created" 
                      subtitle={formatRelativeTime(incident.created_at)} 
                      icon={<Ticket className="h-4 w-4" />} 
                      status="neutral" 
                    />

                    {incident.journey.map((step: any) => {

                      
                      if (step.action === "Assignment Proposed") {
                        const engId = step.metadata?.proposed_to;
                        const engName = getEngineerName(engId);
                        return (
                          <div key={step.id} className="flex items-center">
                            <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 shrink-0" />
                            <JourneyNode 
                              title={engName ? `Proposed to ${engName}` : "Proposed"}
                              subtitle={formatRelativeTime(step.timestamp)}
                              icon={<Clock className="h-4 w-4" />}
                              status="pending"
                            />
                          </div>
                        );
                      }
                      
                      if (step.action === "Assignment Accepted") {
                        const engId = step.metadata?.accepted_by || incident.assigned_to;
                        const engName = getEngineerName(engId);
                        return (
                          <div key={step.id} className="flex items-center">
                            <ArrowRight className="h-4 w-4 text-success mx-2 shrink-0" />
                            <JourneyNode 
                              title={engName ? `Accepted by ${engName}` : "Accepted"}
                              subtitle={formatRelativeTime(step.timestamp)}
                              icon={<CheckCircle2 className="h-4 w-4" />}
                              status="success"
                            />
                          </div>
                        );
                      }

                      if (step.action === "Assignment Declined & Reassigned") {
                        const engId = step.metadata?.declined_by;
                        const engName = getEngineerName(engId);
                        
                        const nextEngId = step.metadata?.proposed_to;
                        const nextEngName = getEngineerName(nextEngId);
                        
                        return (
                          <div key={step.id} className="flex items-center">
                            <div className="flex items-center">
                              <ArrowRight className="h-4 w-4 text-critical mx-2 shrink-0" />
                              <JourneyNode 
                                title={engName ? `Declined by ${engName}` : "Declined"}
                                subtitle={formatRelativeTime(step.timestamp)}
                                icon={<XCircle className="h-4 w-4" />}
                                status="critical"
                              />
                            </div>
                            {nextEngId && (
                              <div className="flex items-center">
                                <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 shrink-0" />
                                <JourneyNode 
                                  title={nextEngName ? `Proposed to ${nextEngName}` : "Proposed"}
                                  subtitle={formatRelativeTime(step.timestamp)}
                                  icon={<Clock className="h-4 w-4" />}
                                  status="pending"
                                />
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (step.action === "Assignment Declined by All") {
                        return (
                          <div key={step.id} className="flex items-center">
                            <ArrowRight className="h-4 w-4 text-critical mx-2 shrink-0" />
                            <JourneyNode 
                              title="Declined by All (Escalated)"
                              subtitle={formatRelativeTime(step.timestamp)}
                              icon={<AlertTriangle className="h-4 w-4" />}
                              status="critical"
                            />
                          </div>
                        );
                      }

                      return null;
                    })}
                    
                    {incident.journey.length === 0 && (
                       <div className="flex items-center">
                         <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 shrink-0" />
                         <span className="text-sm text-muted-foreground italic whitespace-nowrap">
                            No assignment steps found (old ticket or unassigned)...
                         </span>
                       </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {/* Pagination */}
          {total > pageSize && (
            <div className="flex justify-between items-center mt-6">
               <span className="text-xs text-muted-foreground">Showing {incidents.length} of {total}</span>
               <div className="flex gap-2">
                 <button 
                   disabled={page === 1} 
                   onClick={() => setPage(p => p - 1)}
                   className="px-3 py-1 bg-surface border border-border rounded-md text-sm disabled:opacity-50 hover:bg-surface-hover transition-colors"
                 >
                   Previous
                 </button>
                 <button 
                   disabled={page * pageSize >= total} 
                   onClick={() => setPage(p => p + 1)}
                   className="px-3 py-1 bg-surface border border-border rounded-md text-sm disabled:opacity-50 hover:bg-surface-hover transition-colors"
                 >
                   Next
                 </button>
               </div>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}

function JourneyNode({ title, subtitle, icon, status }: { title: string, subtitle: string, icon: React.ReactNode, status: 'success' | 'critical' | 'pending' | 'neutral' }) {
  const statusColors = {
    success: 'bg-success/10 text-success border-success/30',
    critical: 'bg-critical/10 text-critical border-critical/30',
    pending: 'bg-warning/10 text-warning border-warning/30',
    neutral: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-lg border min-w-[160px] shrink-0 ${statusColors[status]}`}>
      <div className="mb-1">{icon}</div>
      <span className="text-xs font-semibold text-center leading-tight mb-1">{title}</span>
      <span className="text-[10px] opacity-80">{subtitle}</span>
    </div>
  );
}
