-- Settings enhancements: theme preference + account deletion RPC.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'dark';

-- Delete all user data (called by the settings page when user confirms deletion).
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.focus_sessions WHERE user_id = auth.uid();
  DELETE FROM public.projects WHERE user_id = auth.uid();
  DELETE FROM public.push_subscriptions WHERE user_id = auth.uid();
  DELETE FROM public.assistant_chats WHERE user_id = auth.uid();
  DELETE FROM public.profiles WHERE id = auth.uid();
  DELETE FROM auth.users WHERE id = auth.uid();
END $$;
