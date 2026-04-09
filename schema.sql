-- =============================================
-- Shree Saraswati Secondary School
-- Result Management System - Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('super_admin', 'teacher')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teacher-Subject-Class assignments
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  UNIQUE(teacher_id, subject_id, class_id)
);

-- Students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  roll_no INTEGER NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exams table
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marks table
CREATE TABLE IF NOT EXISTS public.marks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  marks INTEGER NOT NULL DEFAULT 0 CHECK (marks >= 0 AND marks <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id, exam_id)
);

-- Question Papers table
CREATE TABLE IF NOT EXISTS public.question_papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_url TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Enable Row Level Security
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_papers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies (simplified: authenticated users can CRUD)
-- =============================================
CREATE POLICY "Authenticated users can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated can read classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage classes" ON public.classes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage subjects" ON public.subjects FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read teachers" ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage teachers" ON public.teachers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read teacher_subjects" ON public.teacher_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage teacher_subjects" ON public.teacher_subjects FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage students" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read exams" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage exams" ON public.exams FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read marks" ON public.marks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage marks" ON public.marks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can read question_papers" ON public.question_papers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage question_papers" ON public.question_papers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Default Data
-- =============================================
INSERT INTO public.classes (name) VALUES
  ('Class 1'), ('Class 2'), ('Class 3'), ('Class 4'),
  ('Class 5'), ('Class 6'), ('Class 7'), ('Class 8'),
  ('Class 9'), ('Class 10'), ('Class 11'), ('Class 12')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.exams (name) VALUES
  ('First Mid Term'), ('First Term'),
  ('Second Mid Term'), ('Second Term'),
  ('Third Mid Term'), ('Third Term'),
  ('Fourth Mid Term'), ('Final Term')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- Storage bucket for question papers
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-papers', 'question-papers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can upload question papers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'question-papers');

CREATE POLICY "Anyone can read question papers"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'question-papers');
