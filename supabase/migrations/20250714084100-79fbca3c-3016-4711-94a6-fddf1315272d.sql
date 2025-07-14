-- Add soft delete functionality to files table
ALTER TABLE public.files ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL;

-- Create index for better performance when querying non-deleted files
CREATE INDEX idx_files_deleted_at ON public.files(deleted_at) WHERE deleted_at IS NULL;

-- Create index for better performance when querying deleted files
CREATE INDEX idx_files_deleted_at_not_null ON public.files(deleted_at) WHERE deleted_at IS NOT NULL;