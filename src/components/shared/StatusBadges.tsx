import { 
  Database, 
  Webhook, 
  Mail, 
  Activity, 
  MessageSquare,
  Globe 
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import type { Priority, IncidentStatus, Source } from '@/types';

const priorityMap: Record<Priority, { label: string; variant: BadgeVariant }> = {
  P1: { label: 'P1 — Critical', variant: 'critical' },
  P2: { label: 'P2 — High', variant: 'high' },
  P3: { label: 'P3 — Medium', variant: 'warning' },
  P4: { label: 'P4 — Low', variant: 'muted' },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityMap[priority];
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}

const statusMap: Record<IncidentStatus, { label: string; variant: BadgeVariant }> = {
  new: { label: 'New', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'success' },
  analyzing: { label: 'Analyzing', variant: 'default' },
  remediating: { label: 'Remediating', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'success' },
  escalated: { label: 'Escalated', variant: 'critical' },
  closed: { label: 'Closed', variant: 'muted' },
  assigned: { label: 'Assigned', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'critical' },
};

export function StatusBadge({ status, assignmentStatus, assignment_status }: { status: IncidentStatus, assignmentStatus?: string, assignment_status?: string }) {
  const finalAssignmentStatus = assignmentStatus || assignment_status;
  
  // If the incident has progressed past 'new', always show its actual lifecycle status
  // (e.g. analyzing, remediating, resolved, closed) instead of its assignment metadata.
  if (status !== 'new') {
    const config = statusMap[status] || { label: status, variant: 'default' };
    return (
      <Badge variant={config.variant} dot>
        {config.label}
      </Badge>
    );
  }

  // If the incident is 'new', we use the assignment status to show progress before it officially starts.
  if (finalAssignmentStatus === 'pending_approval') {
    return (
      <Badge variant="warning" dot>
        Assigned
      </Badge>
    );
  }
  
  if (finalAssignmentStatus === 'assigned') {
    return (
      <Badge variant="success" dot>
        Accepted
      </Badge>
    );
  }

  if (finalAssignmentStatus === 'escalated_to_lead') {
    return (
      <Badge variant="critical" dot>
        Rejected
      </Badge>
    );
  }

  // Fallback for 'new' and unassigned
  const config = statusMap[status] || { label: status, variant: 'default' };
  return (
    <Badge variant={config.variant} dot>
      {config.label}
    </Badge>
  );
}



const sourceMap: Partial<Record<Source, { label: string; icon: any }>> = {
  itsm: { label: 'ITSM', icon: Database },
  webhook: { label: 'Webhook', icon: Webhook },
  email: { label: 'Email', icon: Mail },
  monitoring: { label: 'Monitoring', icon: Activity },
  user_chat: { label: 'Chat', icon: MessageSquare },
};

export function SourceBadge({ source }: { source: Source }) {
  const config = sourceMap[source] || { label: source, icon: Globe };
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
      <Icon className="h-3 w-3" />
      {config.label}
    </div>
  );
}
