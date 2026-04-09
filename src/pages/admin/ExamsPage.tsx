import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetch = async () => {
    const { data } = await supabase.from('exams').select('*').order('name');
    setExams(data || []);
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editId) {
      await supabase.from('exams').update({ name }).eq('id', editId);
    } else {
      await supabase.from('exams').insert({ name });
    }
    toast({ title: editId ? 'Exam updated' : 'Exam added' });
    setName(''); setEditId(null); setOpen(false); fetch();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('exams').delete().eq('id', id);
    toast({ title: 'Exam deleted' }); fetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header mb-0">Exams</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setName(''); setEditId(null); } }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Exam</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Exam</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Exam name" value={name} onChange={e => setName(e.target.value)} />
              <Button onClick={handleSave} className="w-full">{editId ? 'Update' : 'Add'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {exams.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.name}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditId(e.id); setName(e.name); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default ExamsPage;
