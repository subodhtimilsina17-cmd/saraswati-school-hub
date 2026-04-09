import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Subject { id: string; name: string; }

const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetch = async () => {
    const { data } = await supabase.from('subjects').select('*').order('name');
    setSubjects(data || []);
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editId) {
      await supabase.from('subjects').update({ name }).eq('id', editId);
      toast({ title: 'Subject updated' });
    } else {
      await supabase.from('subjects').insert({ name });
      toast({ title: 'Subject added' });
    }
    setName(''); setEditId(null); setOpen(false); fetch();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('subjects').delete().eq('id', id);
    toast({ title: 'Subject deleted' }); fetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header mb-0">Subjects</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setName(''); setEditId(null); } }}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Subject</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Subject</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Subject name" value={name} onChange={e => setName(e.target.value)} />
              <Button onClick={handleSave} className="w-full">{editId ? 'Update' : 'Add'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {subjects.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditId(s.id); setName(s.name); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
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

export default SubjectsPage;
