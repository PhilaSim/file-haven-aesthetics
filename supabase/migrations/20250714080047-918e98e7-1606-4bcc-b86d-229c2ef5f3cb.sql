-- Fix the handle_new_user function to use correct column names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Insert into profiles table using 'id' column (not user_id)
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  RETURN NEW;
END;
$function$;

-- Fix the add_first_admin function to use correct column names  
CREATE OR REPLACE FUNCTION public.add_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Make "simelanephila30@gmail.com" the first admin
  -- Use 'role' column instead of 'is_super_admin'
  IF NEW.email = 'simelanephila30@gmail.com' THEN
    INSERT INTO public.admins (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;

  RETURN NEW;
END;
$function$;