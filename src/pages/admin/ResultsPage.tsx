import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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

const AdminResultsPage: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [examId, setExamId] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [c, e] = await Promise.all([
        supabase.from('classes').select('*').order('name'),
        supabase.from('exams').select('*').order('name'),
      ]);
      setClasses(c.data || []);
      setExams(e.data || []);
    };
    fetch();
  }, []);

  const fetchResults = async () => {
    if (!classId || !examId) return;
    const { data: students } = await supabase.from('students').select('*').eq('class_id', classId).order('roll_no');
    const { data: marks } = await supabase.from('marks').select('*, subjects(name)').eq('exam_id', examId);
    const { data: subs } = await supabase.from('subjects').select('*').order('name');

    const subjectList = subs || [];
    setSubjects(subjectList);

    const studentResults = (students || []).map(student => {
      const studentMarks = (marks || []).filter(m => m.student_id === student.id);
      const total = studentMarks.reduce((sum, m) => sum + (m.marks || 0), 0);
      const maxMarks = subjectList.length * 100;
      const percentage = maxMarks > 0 ? (total / maxMarks) * 100 : 0;
      return {
        ...student,
        marks: studentMarks,
        total,
        percentage: percentage.toFixed(1),
        grade: getGrade(percentage),
      };
    });
    setResults(studentResults);
  };

  useEffect(() => { fetchResults(); }, [classId, examId]);

  const generatePDF = (student: any) => {
    const doc = new jsPDF();
    const className = classes.find(c => c.id === classId)?.name || '';
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

    const tableData = subjects.map(sub => {
      const mark = student.marks.find((m: any) => m.subject_id === sub.id);
      return [sub.name, mark?.marks ?? '-', '100'];
    });
    tableData.push(['Total', student.total, subjects.length * 100]);
    tableData.push(['Percentage', student.percentage + '%', '']);
    tableData.push(['Grade', student.grade, '']);

    autoTable(doc, {
      startY: 70,
      head: [['Subject', 'Marks Obtained', 'Full Marks']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 98, 155] },
    });

    doc.save(`result_${student.name}_${examName}.pdf`);
  };

  return (
    <div>
      <h1 className="page-header">Results</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
          <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
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
                {subjects.map(s => <TableHead key={s.id}>{s.name}</TableHead>)}
                <TableHead>Total</TableHead><TableHead>%</TableHead><TableHead>Grade</TableHead><TableHead>PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.roll_no}</TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  {subjects.map(s => {
                    const mark = r.marks.find((m: any) => m.subject_id === s.id);
                    return <TableCell key={s.id}>{mark?.marks ?? '-'}</TableCell>;
                  })}
                  <TableCell className="font-medium">{r.total}</TableCell>
                  <TableCell>{r.percentage}%</TableCell>
                  <TableCell className="font-medium">{r.grade}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => generatePDF(r)}><FileDown className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminResultsPage;
