import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap, FileText,
  ClipboardList, Upload, LogOut, ChevronLeft, ChevronRight, School
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const adminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/classes', icon: BookOpen, label: 'Classes' },
  { to: '/admin/teachers', icon: Users, label: 'Teachers' },
  { to: '/admin/subjects', icon: GraduationCap, label: 'Subjects' },
  { to: '/admin/assign', icon: ClipboardList, label: 'Assign Subjects' },
  { to: '/admin/exams', icon: FileText, label: 'Exams' },
  { to: '/admin/question-papers', icon: Upload, label: 'Question Papers' },
  { to: '/admin/results', icon: ClipboardList, label: 'Results' },
];

const teacherLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/teacher/students', icon: Users, label: 'Students' },
  { to: '/teacher/marks', icon: ClipboardList, label: 'Enter Marks' },
  { to: '/teacher/question-upload', icon: Upload, label: 'Upload Questions' },
  { to: '/teacher/results', icon: FileText, label: 'Results' },
];

const AppSidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const links = profile?.role === 'super_admin' ? adminLinks : teacherLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className={cn(
      "h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 border-r border-sidebar-border",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <School className="h-8 w-8 text-sidebar-primary shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-sidebar-primary-foreground leading-tight">
              Shree Saraswati
            </h1>
            <p className="text-xs text-sidebar-foreground/60">Secondary School</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <link.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors w-full"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <Button variant="ghost" size="sm" onClick={onToggle} className="w-full text-sidebar-foreground">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
