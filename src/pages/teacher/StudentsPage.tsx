import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const StudentsPage: React.FC = () => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [filterClass, setFilterClass] = useState('');
  const { toast } = useToast();

  const fetchData = async () => {
    // Get teacher's assigned classes
    const { data: teacher } = await supabase.from('teachers').select('id').eq('profile_id', profile?.id).single();
    if (!teacher) return;
    const { data: assignments } = await supabase.from('teacher_subjects').select('class_id').eq('teacher_id', teacher.id);
    const classIds = [...new Set((assignments || []).map(a => a.class_id))];
    
    const { data: classData } = await supabase.from('classes').select('*').in('id', classIds).order('name');
    setClasses(classData || []);

    let query = supabase.from('students').select('*, classes(name)').in('class_id', classIds).order('roll_no');
    if (filterClass) query = query.eq('class_id', filterClass);
    const { data } = await query;
    setStudents(data || []);
  };

  useEffect(() => { if (profile) fetchData(); }, [profile, filterClass]);

  const handleSave = async () => {
    if (!name || !rollNo || !classId) return;
    const payload = { name, roll_no: parseInt(rollNo), class_id: classId, section };
    if (editId) {
      await supabase.from('students').update(payload).eq('id', editId);
      toast({ title: 'Student updated' });
    } else {
      await supabase.from('students').insert(payload);
      toast({ title: 'Student added' });
    }
    resetForm(); fetchData();
  };

  const resetForm = () => { setName(''); setRollNo(''); setClassId(''); setSection(''); setEditId(null); setOpen(false); };

  const handleDelete = async (id: string) => {
    await supabase.from('students').delete().eq('id', id);
    toast({ title: 'Student deleted' }); fetchData();
  };

  const openEdit = (s: any) => {
    setEditId(s.id); setName(s.name); setRollNo(String(s.roll_no)); setClassId(s.class_id); setSection(s.section || ''); setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header mb-0">Students</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Student</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Student</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Student name" /></div>
              <div><Label>Roll No</Label><Input type="number" value={rollNo} onChange={e => setRollNo(e.target.value)} placeholder="Roll number" /></div>
              <div><Label>Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Section</Label><Input value={section} onChange={e => setSection(e.target.value)} placeholder="Section (optional)" /></div>
              <Button onClick={handleSave} className="w-full">{editId ? 'Update' : 'Add'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mb-4 w-48">
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Roll</TableHead><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Section</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {students.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.roll_no}</TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.classes?.name}</TableCell>
                <TableCell>{s.section || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default StudentsPage;
