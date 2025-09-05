-- Admin policies for authentication tables
-- This replaces the functionality that was removed with Zoer chatbox RLS policies

-- Create admin role check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the current user has admin role
    -- This assumes we're using Supabase auth and have user metadata or role checking
    RETURN (
        SELECT role = 'admin' 
        FROM public.users 
        WHERE id::text = auth.uid()::text
    );
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for users table
CREATE POLICY "Admins can read all users" ON public.users
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (is_admin());

-- Admin policies for sessions table  
CREATE POLICY "Admins can manage all sessions" ON public.sessions
    FOR ALL USING (is_admin());

-- Admin policies for refresh_tokens table
CREATE POLICY "Admins can manage all refresh tokens" ON public.refresh_tokens
    FOR ALL USING (is_admin());

-- Admin policies for user_passcode table
CREATE POLICY "Admins can manage all passcodes" ON public.user_passcode
    FOR ALL USING (is_admin());

-- System tables that should be accessible to admins
-- These are for the main OmniPost functionality

-- Enable RLS for user_notifications if not already enabled
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- User notifications policies
CREATE POLICY "Users can manage their notifications" ON public.user_notifications
    FOR ALL USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage all notifications" ON public.user_notifications
    FOR ALL USING (is_admin());
