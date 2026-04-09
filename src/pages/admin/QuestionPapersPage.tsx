import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const QuestionPapersPage: React.FC = () => {
  const [papers, setPapers] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('question_papers')
        .select('*, classes(name), subjects(name), exams(name), profiles:uploaded_by(email)')
        .order('created_at', { ascending: false });
      setPapers(data || []);
    };
    fetch();
  }, []);

  return (
    <div>
      <h1 className="page-header">Question Papers</h1>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead><TableHead>Subject</TableHead><TableHead>Exam</TableHead><TableHead>Uploaded By</TableHead><TableHead className="w-24">Download</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {papers.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.classes?.name}</TableCell>
                <TableCell>{p.subjects?.name}</TableCell>
                <TableCell>{p.exams?.name}</TableCell>
                <TableCell>{p.profiles?.email}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={p.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default QuestionPapersPage;
