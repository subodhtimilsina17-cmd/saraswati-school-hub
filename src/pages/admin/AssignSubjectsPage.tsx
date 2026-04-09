import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

const AssignSubjectsPage: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const { toast } = useToast();

  const fetchAll = async () => {
    const [t, c, s, a] = await Promise.all([
      supabase.from('teachers').select('*, profiles(email, full_name)'),
      supabase.from('classes').select('*').order('name'),
      supabase.from('subjects').select('*').order('name'),
      supabase.from('teacher_subjects').select('*, teachers(profiles(full_name, email)), subjects(name), classes(name)'),
    ]);
    setTeachers(t.data || []);
    setClasses(c.data || []);
    setSubjects(s.data || []);
    setAssignments(a.data || []);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAssign = async () => {
    if (!teacherId || !classId || !subjectId) return;
    const { error } = await supabase.from('teacher_subjects').insert({
      teacher_id: teacherId, class_id: classId, subject_id: subjectId,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Subject assigned' });
      fetchAll();
    }
  };

  const handleRemove = async (id: string) => {
    await supabase.from('teacher_subjects').delete().eq('id', id);
    toast({ title: 'Assignment removed' });
    fetchAll();
  };

  return (
    <div>
      <h1 className="page-header">Assign Subjects to Teachers</h1>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <Select value={teacherId} onValueChange={setTeacherId}>
          <SelectTrigger><SelectValue placeholder="Select Teacher" /></SelectTrigger>
          <SelectContent>
            {teachers.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.profiles?.full_name || t.profiles?.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
          <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
          <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={handleAssign}><Plus className="h-4 w-4 mr-2" />Assign</Button>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead><TableHead>Class</TableHead><TableHead>Subject</TableHead><TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map(a => (
              <TableRow key={a.id}>
                <TableCell>{a.teachers?.profiles?.full_name || a.teachers?.profiles?.email}</TableCell>
                <TableCell>{a.classes?.name}</TableCell>
                <TableCell>{a.subjects?.name}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AssignSubjectsPage;
