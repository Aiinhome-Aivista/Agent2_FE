import { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User as UserIcon, Menu, Bell, Check, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { appConfig } from '@/config/app.config';
import { incidentApi } from '@/services/api/endpoints';
import { Incident } from '@/types';
// import { cn } from '@/utils/cn';

interface HeaderProps {
  onMenuClick?: () => void;
}

const PendingAssignmentItem = ({ incident, onRespond }: { incident: Incident, onRespond: (id: string, accept: boolean) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = incident.description && incident.description.length > 60;

  return (
    <div className="p-3 border-b border-border hover:bg-surface-hover transition-colors">
      <p className="text-xs font-semibold text-primary mb-1">Ticket #{incident.id}</p>
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
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const prevPendingLengthRef = useRef(0);

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
      if (pendingAssignments.length > prevPendingLengthRef.current) {
        playSound();
      }
      // Play sound every 3 seconds continuously
      audioInterval = setInterval(playSound, 3000);
    }

    prevPendingLengthRef.current = pendingAssignments.length;

    return () => {
      if (audioInterval) clearInterval(audioInterval);
    };
  }, [pendingAssignments]);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const data = await incidentApi.getPendingAssignments();
        setPendingAssignments(data);
      } catch (err) {
        console.error('Failed to fetch pending assignments', err);
      }
    };
    if (user) {
      fetchPending();
      const interval = setInterval(fetchPending, 60000); // Check every minute
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
              animate={pendingAssignments.length > 0 ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1, 1.3, 1] } : { rotate: 0, scale: 1 }}
              transition={pendingAssignments.length > 0 ? { repeat: Infinity, duration: 1.5, repeatDelay: 1 } : {}}
            >
              <Bell className="h-5 w-5" />
            </motion.div>
            {pendingAssignments.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-critical text-[9px] font-bold text-white ring-2 ring-surface">
                {pendingAssignments.length}
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
                  <h3 className="text-sm font-semibold text-foreground">Pending Assignments</h3>
                  <span className="text-xs text-muted-foreground">{pendingAssignments.length} new</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {pendingAssignments.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No pending assignments
                    </div>
                  ) : (
                    pendingAssignments.map((incident) => (
                      <PendingAssignmentItem key={incident.id} incident={incident} onRespond={handleAssignmentResponse} />
                    ))
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
    </header>
  );
}
