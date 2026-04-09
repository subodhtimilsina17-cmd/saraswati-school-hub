import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const MarksEntryPage: React.FC = () => {
  const { profile } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [exams, setExams] = useState<any[]>([]);
  const [examId, setExamId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      if (!profile) return;
      const { data: t } = await supabase.from('teachers').select('id').eq('profile_id', profile.id).single();
      if (!t) return;
      setTeacher(t);

      const { data: assignments } = await supabase.from('teacher_subjects')
        .select('class_id, classes(id, name)').eq('teacher_id', t.id);
      const uniqueClasses = Object.values(
        (assignments || []).reduce((acc: any, a: any) => {
          acc[a.class_id] = a.classes;
          return acc;
        }, {})
      );
      setAssignedClasses(uniqueClasses);

      const { data: examData } = await supabase.from('exams').select('*').order('name');
      setExams(examData || []);
    };
    init();
  }, [profile]);

  useEffect(() => {
    if (!teacher || !classId) { setSubjects([]); return; }
    const fetchSubjects = async () => {
      const { data } = await supabase.from('teacher_subjects')
        .select('subject_id, subjects(id, name)')
        .eq('teacher_id', teacher.id)
        .eq('class_id', classId);
      setSubjects((data || []).map(d => d.subjects));
      setSubjectId('');
    };
    fetchSubjects();
  }, [teacher, classId]);

  useEffect(() => {
    if (!classId) { setStudents([]); return; }
    const fetchStudents = async () => {
      const { data } = await supabase.from('students').select('*').eq('class_id', classId).order('roll_no');
      setStudents(data || []);
    };
    fetchStudents();
  }, [classId]);

  useEffect(() => {
    if (!subjectId || !examId || students.length === 0) { setMarksMap({}); return; }
    const fetchMarks = async () => {
      const { data } = await supabase.from('marks')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('exam_id', examId)
        .in('student_id', students.map(s => s.id));
      const map: Record<string, string> = {};
      (data || []).forEach(m => { map[m.student_id] = String(m.marks); });
      setMarksMap(map);
    };
    fetchMarks();
  }, [subjectId, examId, students]);

  const handleSave = async () => {
    if (!subjectId || !examId) return;
    const entries = students.map(s => ({
      student_id: s.id,
      subject_id: subjectId,
      exam_id: examId,
      marks: parseInt(marksMap[s.id] || '0') || 0,
    }));

    // Upsert marks
    for (const entry of entries) {
      const { data: existing } = await supabase.from('marks')
        .select('id')
        .eq('student_id', entry.student_id)
        .eq('subject_id', entry.subject_id)
        .eq('exam_id', entry.exam_id)
        .single();
      if (existing) {
        await supabase.from('marks').update({ marks: entry.marks }).eq('id', existing.id);
      } else {
        await supabase.from('marks').insert(entry);
      }
    }
    toast({ title: 'Marks saved successfully' });
  };

  return (
    <div>
      <h1 className="page-header">Enter Marks</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
          <SelectContent>
            {assignedClasses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
          <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
          <SelectContent>
            {subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={examId} onValueChange={setExamId}>
          <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
          <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {students.length > 0 && subjectId && examId && (
        <>
          <div className="rounded-lg border bg-card mb-4">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Roll</TableHead><TableHead>Name</TableHead><TableHead className="w-32">Marks</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.roll_no}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={marksMap[s.id] || ''}
                        onChange={e => setMarksMap(prev => ({ ...prev, [s.id]: e.target.value }))}
                        className="w-24"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Save Marks</Button>
        </>
      )}
    </div>
  );
};

export default MarksEntryPage;
