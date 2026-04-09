import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, GraduationCap, FileText } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ students: 0, classes: 0, subjects: 0, exams: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [students, classes, subjects, exams] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('exams').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        students: students.count ?? 0,
        classes: classes.count ?? 0,
        subjects: subjects.count ?? 0,
        exams: exams.count ?? 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Students', value: stats.students, icon: Users, color: 'text-primary' },
    { label: 'Classes', value: stats.classes, icon: BookOpen, color: 'text-success' },
    { label: 'Subjects', value: stats.subjects, icon: GraduationCap, color: 'text-accent' },
    { label: 'Exams', value: stats.exams, icon: FileText, color: 'text-destructive' },
  ];

  return (
    <div>
      <h1 className="page-header">
        Welcome, {profile?.full_name || profile?.email}
      </h1>
      <p className="text-muted-foreground mb-6">
        Role: <span className="capitalize font-medium text-foreground">{profile?.role?.replace('_', ' ')}</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
