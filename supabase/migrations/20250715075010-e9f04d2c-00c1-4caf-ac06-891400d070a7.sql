-- Update the add_first_admin function to handle the admin user
CREATE OR REPLACE FUNCTION public.add_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Make "simelanephila30@gmail.com" the first admin
  IF NEW.email = 'simelanephila30@gmail.com' THEN
    INSERT INTO public.admins (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;

  RETURN NEW;
END;
$function$;

-- Update the handle_new_user function to set default role based on email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Insert into profiles table with role based on email
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN NEW.email = 'simelanephila30@gmail.com' THEN 'admin'
      ELSE 'user'
    END
  );
  
  RETURN NEW;
END;
$function$;