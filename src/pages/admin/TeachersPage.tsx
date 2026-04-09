import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

interface Teacher { id: string; profile_id: string; profiles?: { email: string; full_name?: string }; }

const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchTeachers = async () => {
    const { data } = await supabase.from('teachers').select('*, profiles(email, full_name)');
    setTeachers(data || []);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleAdd = async () => {
    if (!email || !password) return;
    // Create user via Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } }
    });
    if (authError) {
      toast({ title: 'Error', description: authError.message, variant: 'destructive' });
      return;
    }
    if (authData.user) {
      // Update profile role
      await supabase.from('profiles').upsert({
        id: authData.user.id, email, role: 'teacher', full_name: fullName
      });
      // Create teacher record
      await supabase.from('teachers').insert({ profile_id: authData.user.id });
      toast({ title: 'Teacher added' });
    }
    setEmail(''); setPassword(''); setFullName(''); setOpen(false);
    fetchTeachers();
  };

  const handleDelete = async (t: Teacher) => {
    await supabase.from('teachers').delete().eq('id', t.id);
    toast({ title: 'Teacher removed' });
    fetchTeachers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-header mb-0">Teachers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Teacher</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Teacher</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" /></div>
              <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" /></div>
              <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" /></div>
              <Button onClick={handleAdd} className="w-full">Add Teacher</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead className="w-20">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {teachers.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.profiles?.full_name || '-'}</TableCell>
                <TableCell>{t.profiles?.email}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TeachersPage;
