-- Add avatar_url and display_name columns to users table
ALTER TABLE public.users 
ADD COLUMN avatar_url TEXT,
ADD COLUMN display_name TEXT;

-- Update the handle_new_user function to set display_name from email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert into users table with role based on email and set display_name
  INSERT INTO public.users (id, full_name, role, display_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN NEW.email = 'simelanephila30@gmail.com' THEN 'admin'
      WHEN NEW.email IN (
        'athenkosi.ngcwazi@capaciti.org.za',
        'sibusiso.minenzima@capaciti.org.za', 
        'sithembele.bangani@capaciti.org.za',
        'debbie.baartman@capacitit.org.za'
      ) THEN 'user'
      ELSE 'user'
    END,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  -- Also insert into profiles for backward compatibility
  INSERT INTO public.profiles (id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.email = 'simelanephila30@gmail.com' THEN 'admin'
      WHEN NEW.email IN (
        'athenkosi.ngcwazi@capaciti.org.za',
        'sibusiso.minenzima@capaciti.org.za', 
        'sithembele.bangani@capaciti.org.za',
        'debbie.baartman@capacitit.org.za'
      ) THEN 'user'
      ELSE 'user'
    END
  );
  
  RETURN NEW;
END;
$$;

-- Add RLS policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" 
ON public.users 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.id = auth.uid() AND p.role = 'admin'
));