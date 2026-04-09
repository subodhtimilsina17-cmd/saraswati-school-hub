import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

const QuestionUploadPage: React.FC = () => {
  const { profile } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examId, setExamId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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
        (assignments || []).reduce((acc: any, a: any) => { acc[a.class_id] = a.classes; return acc; }, {})
      );
      setClasses(uniqueClasses);

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
    };
    fetchSubjects();
  }, [teacher, classId]);

  const handleUpload = async () => {
    if (!file || !classId || !subjectId || !examId) return;
    setUploading(true);

    const filePath = `question-papers/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('question-papers').upload(filePath, file);
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('question-papers').getPublicUrl(filePath);

    await supabase.from('question_papers').insert({
      file_url: publicUrl,
      class_id: classId,
      subject_id: subjectId,
      exam_id: examId,
      uploaded_by: profile?.id,
    });

    toast({ title: 'Question paper uploaded' });
    setFile(null); setUploading(false);
  };

  return (
    <div>
      <h1 className="page-header">Upload Question Paper</h1>
      <div className="max-w-lg space-y-4">
        <div><Label>Class</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
            <SelectContent>{classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Subject</Label>
          <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
            <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
            <SelectContent>{subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Exam</Label>
          <Select value={examId} onValueChange={setExamId}>
            <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
            <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>File (PDF/DOC)</Label>
          <Input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
        <Button onClick={handleUpload} disabled={uploading || !file}>
          <Upload className="h-4 w-4 mr-2" />{uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    </div>
  );
};

export default QuestionUploadPage;
