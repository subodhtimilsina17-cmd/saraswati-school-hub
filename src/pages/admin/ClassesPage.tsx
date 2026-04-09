import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface ClassItem { id: string; name: string; }

const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchClasses = async () => {
    const { data } = await supabase.from('classes').select('*').order('name');
    setClasses(data || []);
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editId) {
      await supabase.from('classes').update({ name }).eq('id', editId);
      toast({ title: 'Class updated' });
    } else {
      await supabase.from('classes').insert({ name });
      toast({ title: 'Class added' });
    }
    setName(''); setEditId(null); setOpen(false);
    fetchClasses();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('classes').delete().eq('id', id);
    toast({ title: 'Class deleted' });
    fetchClasses();
  };

  const openEdit = (c: ClassItem) => {
    setEditId(c.id); setName(c.name); setOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header mb-0">Classes</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setName(''); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Class</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Add'} Class</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Class name" value={name} onChange={e => setName(e.target.value)} />
              <Button onClick={handleSave} className="w-full">{editId ? 'Update' : 'Add'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {classes.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default ClassesPage;
