-- Update handle_new_user function to include philasimelane@capaciti.org.za as admin
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
      WHEN NEW.email IN ('simelanephila30@gmail.com', 'philasimelane@capaciti.org.za') THEN 'admin'
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
      WHEN NEW.email IN ('simelanephila30@gmail.com', 'philasimelane@capaciti.org.za') THEN 'admin'
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

-- Update existing user philasimelane@capaciti.org.za to admin if they exist
UPDATE public.users 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'philasimelane@capaciti.org.za'
);

UPDATE public.profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'philasimelane@capaciti.org.za'
);