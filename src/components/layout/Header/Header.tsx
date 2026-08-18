import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Settings, User as UserIcon, Menu, Bell, Check, X, XCircle, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { appConfig } from '@/config/app.config';
import { incidentApi } from '@/services/api/endpoints';
import { Incident } from '@/types';
import { useToast } from '@/hooks/useToast';
// import { cn } from '@/utils/cn';

interface HeaderProps {
  onMenuClick?: () => void;
}

const PendingAssignmentItem = ({ incident, onRespond }: { incident: any, onRespond: (id: string, accept: boolean) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = incident.description && incident.description.length > 60;

  return (
    <div className="p-3 border-b border-border hover:bg-surface-hover transition-colors">
      <div className="flex justify-between items-start mb-1">
        <p className="text-xs font-semibold text-primary">Ticket #{incident.id}</p>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
          {new Date(incident.createdAt || incident.created_at || new Date()).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </span>
      </div>
      <p className="text-sm font-medium text-foreground">{incident.subject}</p>
      <div className="mt-1 mb-2">
        <p className={`text-xs text-muted-foreground ${!expanded ? 'line-clamp-1' : ''}`}>
          {incident.description}
        </p>
        {isLong && (
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="text-[10px] font-medium text-primary hover:underline mt-0.5"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => onRespond(incident.id, true)}
          className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Check className="h-3 w-3" /> Accept
        </button>
        <button
          onClick={() => onRespond(incident.id, false)}
          className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-surface border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
        >
          <X className="h-3 w-3" /> Decline
        </button>
      </div>
    </div>
  );
};

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState<Incident[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [clearedNotifIds, setClearedNotifIds] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const notifiedTicketsRef = useRef<Set<string>>(new Set());
  const [newTicketPopup, setNewTicketPopup] = useState<Incident | null>(null);
  const [newAdminPopup, setNewAdminPopup] = useState<any | null>(null);

  useEffect(() => {
    let audioInterval: NodeJS.Timeout | null = null;

    const playSound = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
        oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); 
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch (e) {
        console.error('Audio playback failed', e);
      }
    };

    if (pendingAssignments.length > 0) {
      const unnotifiedTicket = pendingAssignments.find(
        (t) => !notifiedTicketsRef.current.has(t.id)
      );

      if (unnotifiedTicket) {
        playSound();
        setNewTicketPopup(unnotifiedTicket);
        setTimeout(() => setNewTicketPopup(null), 5000);

        pendingAssignments.forEach((t) => notifiedTicketsRef.current.add(t.id));
      }
    }

    return () => {
    };
  }, [pendingAssignments]);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const data = await incidentApi.getPendingAssignments();
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setPendingAssignments(sortedData);
      } catch (err) {
        console.error('Failed to fetch pending assignments', err);
      }
    };
    if (user && user.role !== 'admin') {
      fetchPending();
      const interval = setInterval(fetchPending, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  const { toast } = useToast();
  const seenAdminNotifsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    let audioInterval: NodeJS.Timeout | null = null;
    const playSound = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
        oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1); 
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch (e) {
        console.error('Audio playback failed', e);
      }
    };

    const fetchAdminNotifications = async () => {
      if (user?.role !== 'admin') return;
      try {
        const data = await incidentApi.getAdminNotifications();
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.created_at || a.timestamp || 0).getTime();
          const dateB = new Date(b.created_at || b.timestamp || 0).getTime();
          return dateB - dateA;
        });
        setAdminNotifications(sortedData);
        
        const newNotifs = data.filter((n) => !seenAdminNotifsRef.current.has(n.id));
        if (newNotifs.length > 0) {
          newNotifs.forEach(n => seenAdminNotifsRef.current.add(n.id));
          const latest = newNotifs[0];
          setNewAdminPopup(latest);
          playSound();
          setTimeout(() => setNewAdminPopup(null), 5000);
        }
      } catch (err) {
        console.error('Failed to fetch admin notifications', err);
      }
    };

    if (user?.role === 'admin') {
      incidentApi.getAdminNotifications().then((data) => {
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.created_at || a.timestamp || 0).getTime();
          const dateB = new Date(b.created_at || b.timestamp || 0).getTime();
          return dateB - dateA;
        });
        setAdminNotifications(sortedData);
        data.forEach(n => seenAdminNotifsRef.current.add(n.id));
      });
      const interval = setInterval(fetchAdminNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) setNotificationsOpen(false);
    };
    if (menuOpen || notificationsOpen) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen, notificationsOpen]);

  const handleLogout = async () => {
    await logout();
    navigate(appConfig.routes.welcome);
  };

  const handleAssignmentResponse = async (id: string, accept: boolean) => {
    try {
      await incidentApi.respondToAssignment(id, accept);
      setPendingAssignments((prev) => prev.filter((inc) => inc.id !== id));
      if (accept) {
        navigate(`/incidents/${id}`);
      }
    } catch (err) {
      console.error('Failed to respond to assignment', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-surface/80 backdrop-blur-md px-4 sm:px-6 justify-between">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-hover"
        aria-label="Toggle navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((v) => !v)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            aria-label="Notifications"
          >
            <motion.div
              animate={(user?.role === 'admin' ? adminNotifications.filter(n => !clearedNotifIds.has(n.id)) : pendingAssignments).length > 0 ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1, 1.3, 1] } : { rotate: 0, scale: 1 }}
              transition={(user?.role === 'admin' ? adminNotifications.filter(n => !clearedNotifIds.has(n.id)) : pendingAssignments).length > 0 ? { repeat: Infinity, duration: 1.5, repeatDelay: 1 } : {}}
            >
              <Bell className="h-5 w-5" />
            </motion.div>
            {(user?.role === 'admin' ? adminNotifications.filter(n => !clearedNotifIds.has(n.id)) : pendingAssignments).length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-critical text-[9px] font-bold text-white ring-2 ring-surface">
                {(user?.role === 'admin' ? adminNotifications.filter(n => !clearedNotifIds.has(n.id)) : pendingAssignments).length}
              </span>
            )}
          </button>
          
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-surface shadow-soft-lg overflow-hidden z-40"
              >
                <div className="px-4 py-3 border-b border-border flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-foreground">
                    {user?.role === 'admin' ? 'Recent Assignments' : 'Pending Assignments'}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {(user?.role === 'admin' ? adminNotifications.filter(n => !clearedNotifIds.has(n.id)) : pendingAssignments).length} total
                    </span>
                    {user?.role === 'admin' && adminNotifications.filter(n => !clearedNotifIds.has(n.id)).length > 0 && (
                      <button
                        onClick={() => setClearedNotifIds(new Set([...clearedNotifIds, ...adminNotifications.map(n => n.id)]))}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {user?.role === 'admin' ? (
                    adminNotifications.filter(n => !clearedNotifIds.has(n.id)).length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No recent assignments
                      </div>
                    ) : (
                      adminNotifications.filter(n => !clearedNotifIds.has(n.id)).map((notif) => (
                        <div key={notif.id} className="p-3 border-b border-border hover:bg-surface-hover transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              {notif.action.includes('Declined') ? <XCircle className="w-4 h-4 text-critical" /> : <CheckCircle2 className="w-4 h-4 text-success" />}
                              <p className="text-xs font-semibold text-primary">Ticket #{notif.incident_id}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                              {new Date(notif.created_at || notif.timestamp || new Date()).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground mb-1">{notif.message}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{notif.subject}</p>
                        </div>
                      ))
                    )
                  ) : (
                    pendingAssignments.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No pending assignments
                      </div>
                    ) : (
                      pendingAssignments.map((incident) => (
                        <PendingAssignmentItem key={incident.id} incident={incident} onRespond={handleAssignmentResponse} />
                      ))
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ThemeToggle />

        <div ref={menuRef} className="relative ml-1">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md p-1 hover:bg-surface-hover transition-colors"
            aria-label="User menu"
            aria-haspopup="menu"
          >
            <Avatar name={user?.fullName ?? 'User'} size="sm" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                role="menu"
                className="absolute right-0 top-full mt-2 w-60 rounded-lg border border-border bg-surface shadow-soft-lg overflow-hidden z-40"
              >
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user?.fullName ?? 'Guest'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email ?? ''}
                  </p>
                  <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-semibold bg-primary/10 text-primary">
                    {user?.role ?? 'guest'}
                  </span>
                </div>
                <div className="p-1">
                  <Link
                    to={appConfig.routes.settings}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-surface-hover transition-colors"
                  >
                    <UserIcon className="h-4 w-4" /> Profile
                  </Link>
                  <Link
                    to={appConfig.routes.settings}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-surface-hover transition-colors"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                </div>
                <div className="p-1 border-t border-border">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-critical hover:bg-critical/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New Ticket Sliding Popup */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {newTicketPopup && (
            <motion.div
              initial={{ opacity: 0, x: 100, y: 0 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-24 right-6 z-[100] w-96 rounded-xl border-2 border-primary/20 bg-surface shadow-xl overflow-hidden p-5 flex gap-4 items-start"
            >
              <button
                onClick={() => setNewTicketPopup(null)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground rounded-md p-1 hover:bg-surface-hover transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="rounded-full bg-primary/10 p-3 text-primary mt-0.5 shrink-0">
                <Bell className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-base font-bold text-foreground truncate mr-2">New Assignment</h3>
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                    {newTicketPopup.priority || 'NEW'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-primary truncate">Ticket #{newTicketPopup.id}</p>
                <p className="text-sm font-medium text-foreground mt-1.5 line-clamp-2">{newTicketPopup.subject}</p>
                
                {newTicketPopup.description && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">
                    {newTicketPopup.description}
                  </p>
                )}

                {(newTicketPopup.caller || newTicketPopup.source) && (
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mt-3 pt-3 border-t border-border">
                    {newTicketPopup.caller && <span>By: <span className="text-foreground">{newTicketPopup.caller}</span></span>}
                    {newTicketPopup.source && <span className="uppercase">Via: {newTicketPopup.source}</span>}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Admin Notification Sliding Popup */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {newAdminPopup && (
            <motion.div
              initial={{ opacity: 0, x: 100, y: 0 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
              className={`fixed bottom-24 right-6 z-[100] w-96 rounded-xl border-2 bg-surface shadow-xl overflow-hidden p-5 flex gap-4 items-start ${
                newAdminPopup.action.includes('Declined') ? 'border-critical/20' : 'border-success/20'
              }`}
            >
              <button
                onClick={() => setNewAdminPopup(null)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground rounded-md p-1 hover:bg-surface-hover transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className={`rounded-full p-3 mt-0.5 shrink-0 ${
                newAdminPopup.action.includes('Declined') ? 'bg-critical/10 text-critical' : 'bg-success/10 text-success'
              }`}>
                {newAdminPopup.action.includes('Declined') ? <XCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-base font-bold text-foreground truncate mr-2">
                    {newAdminPopup.action.includes('Declined') ? 'Assignment Declined' : 'Assignment Accepted'}
                  </h3>
                </div>
                <p className="text-sm font-semibold text-primary truncate">Ticket #{newAdminPopup.incident_id}</p>
                <p className="text-sm font-medium text-foreground mt-1.5">{newAdminPopup.message}</p>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                  {newAdminPopup.subject}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
}
