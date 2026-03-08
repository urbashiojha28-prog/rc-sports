
-- Create games table (admin-managed)
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create registrations table
CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_name TEXT NOT NULL,
  tower TEXT NOT NULL,
  flat_no TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create registration_games junction table
CREATE TABLE public.registration_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  UNIQUE(registration_id, game_id)
);

-- Create site_settings table for editable content
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin role type and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Games: anyone can read active games, only admin can manage
CREATE POLICY "Anyone can view active games" ON public.games
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage games" ON public.games
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Registrations: anyone can insert, only admin can view
CREATE POLICY "Anyone can register" ON public.registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view registrations" ON public.registrations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete registrations" ON public.registrations
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Registration games: anyone can insert, only admin can view
CREATE POLICY "Anyone can insert registration games" ON public.registration_games
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view registration games" ON public.registration_games
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete registration games" ON public.registration_games
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Site settings: anyone can read, only admin can modify
CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User roles: only viewable by the user themselves
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_title', 'Society Games Championship 2026'),
  ('site_subtitle', 'Register now and compete with your neighbors!'),
  ('registration_open', 'true');

-- Insert default games
INSERT INTO public.games (name, description, image_url, display_order) VALUES
  ('Cricket', 'Show your batting and bowling skills in our exciting cricket tournament!', 'cricket', 1),
  ('Badminton', 'Smash your way to victory in singles badminton matches!', 'badminton', 2),
  ('Chess', 'Outsmart your opponents in this classic game of strategy!', 'chess', 3),
  ('Carrom', 'Flick, strike, and pocket your way to the carrom championship!', 'carrom', 4),
  ('Table Tennis', 'Fast-paced rallies and quick reflexes — are you ready?', 'table-tennis', 5),
  ('Tug of War', 'Unite with your team and pull your way to glory!', 'tug-of-war', 6);
