import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getGrade = (pct: number): string => {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C+';
  if (pct >= 40) return 'C';
  if (pct >= 30) return 'D';
  return 'F';
};

const TeacherResultsPage: React.FC = () => {
  const { profile } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [examId, setExamId] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      if (!profile) return;
      const { data: t } = await supabase.from('teachers').select('id').eq('profile_id', profile.id).single();
      if (!t) return;
      setTeacher(t);
      const { data: assignments } = await supabase.from('teacher_subjects')
        .select('class_id, classes(id, name)').eq('teacher_id', t.id);
      const unique = Object.values((assignments || []).reduce((acc: any, a: any) => { acc[a.class_id] = a.classes; return acc; }, {}));
      setClasses(unique);
      const { data: examData } = await supabase.from('exams').select('*').order('name');
      setExams(examData || []);
    };
    init();
  }, [profile]);

  useEffect(() => {
    if (!classId || !examId || !teacher) return;
    const fetchResults = async () => {
      const { data: assignedSubs } = await supabase.from('teacher_subjects')
        .select('subject_id, subjects(id, name)')
        .eq('teacher_id', teacher.id).eq('class_id', classId);
      const subs = (assignedSubs || []).map(a => a.subjects);
      setSubjects(subs);

      const { data: students } = await supabase.from('students').select('*').eq('class_id', classId).order('roll_no');
      const { data: marks } = await supabase.from('marks').select('*')
        .eq('exam_id', examId)
        .in('student_id', (students || []).map(s => s.id))
        .in('subject_id', subs.map((s: any) => s.id));

      setResults((students || []).map(student => {
        const studentMarks = (marks || []).filter(m => m.student_id === student.id);
        const total = studentMarks.reduce((sum, m) => sum + (m.marks || 0), 0);
        const pct = subs.length > 0 ? (total / (subs.length * 100)) * 100 : 0;
        return { ...student, marks: studentMarks, total, percentage: pct.toFixed(1), grade: getGrade(pct) };
      }));
    };
    fetchResults();
  }, [classId, examId, teacher]);

  const generatePDF = (student: any) => {
    const doc = new jsPDF();
    const className = classes.find((c: any) => c.id === classId)?.name || '';
    const examName = exams.find(e => e.id === examId)?.name || '';
    doc.setFontSize(18);
    doc.text('Shree Saraswati Secondary School', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text('Changunarayan-8, Bhaktapur, Nepal', 105, 28, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Result Sheet', 105, 38, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Student: ${student.name}`, 20, 52);
    doc.text(`Roll No: ${student.roll_no}`, 20, 60);
    doc.text(`Class: ${className}`, 120, 52);
    doc.text(`Exam: ${examName}`, 120, 60);
    const tableData = subjects.map((sub: any) => {
      const mark = student.marks.find((m: any) => m.subject_id === sub.id);
      return [sub.name, mark?.marks ?? '-', '100'];
    });
    tableData.push(['Total', student.total, subjects.length * 100]);
    tableData.push(['Percentage', student.percentage + '%', '']);
    tableData.push(['Grade', student.grade, '']);
    autoTable(doc, { startY: 70, head: [['Subject', 'Marks Obtained', 'Full Marks']], body: tableData, theme: 'grid', headStyles: { fillColor: [41, 98, 155] } });
    doc.save(`result_${student.name}_${examName}.pdf`);
  };

  return (
    <div>
      <h1 className="page-header">Results</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
          <SelectContent>{classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={examId} onValueChange={setExamId}>
          <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
          <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {results.length > 0 && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll</TableHead><TableHead>Name</TableHead>
                {subjects.map((s: any) => <TableHead key={s.id}>{s.name}</TableHead>)}
                <TableHead>Total</TableHead><TableHead>%</TableHead><TableHead>Grade</TableHead><TableHead>PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.roll_no}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  {subjects.map((s: any) => {
                    const mark = r.marks.find((m: any) => m.subject_id === s.id);
                    return <TableCell key={s.id}>{mark?.marks ?? '-'}</TableCell>;
                  })}
                  <TableCell className="font-medium">{r.total}</TableCell>
                  <TableCell>{r.percentage}%</TableCell>
                  <TableCell className="font-medium">{r.grade}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => generatePDF(r)}><FileDown className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TeacherResultsPage;
