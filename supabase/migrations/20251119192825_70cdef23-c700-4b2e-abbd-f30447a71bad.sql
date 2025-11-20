-- Add bio field to analyses table
ALTER TABLE public.analyses 
ADD COLUMN bio text;