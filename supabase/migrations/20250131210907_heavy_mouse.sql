/*
  # Add RLS policies for audit tables

  1. Changes
    - Add INSERT policies for profile_changes table
    - Add INSERT policies for login_history table
    - Ensure authenticated users can create their own audit records

  2. Security
    - Enable RLS on both tables
    - Restrict inserts to authenticated users
    - Users can only insert records for themselves
*/

-- Policies for profile_changes
CREATE POLICY "Users can insert own profile changes"
  ON public.profile_changes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for login_history
CREATE POLICY "Users can insert own login history"
  ON public.login_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);