-- Authentication tables for OmniPost
-- These are required for the JWT authentication system

-- Create users table
CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE public.sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ip VARCHAR(255) NOT NULL,
    user_agent VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    refresh_at TIMESTAMP WITH TIME ZONE
);

-- Refresh tokens table
CREATE TABLE public.refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token TEXT NOT NULL,
    session_id BIGINT NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User passcode table (for email verification)
CREATE TABLE public.user_passcode (
    id BIGSERIAL PRIMARY KEY,
    passcode VARCHAR(255) NOT NULL,
    passcode_type VARCHAR(255) NOT NULL DEFAULT 'EMAIL',
    pass_object VARCHAR(255) NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '3 minutes'),
    retry_count INTEGER NOT NULL DEFAULT 0,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens(token);
CREATE INDEX idx_user_passcode_pass_object ON public.user_passcode(pass_object);
CREATE INDEX idx_user_passcode_valid_until ON public.user_passcode(valid_until);

-- Enable RLS for security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passcode ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (id::text = auth.uid()::text);

CREATE POLICY "Users can update their own data" ON public.users
    FOR UPDATE USING (id::text = auth.uid()::text);

-- Create RLS policies for sessions table
CREATE POLICY "Users can manage their sessions" ON public.sessions
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Create RLS policies for refresh_tokens table
CREATE POLICY "Users can manage their refresh tokens" ON public.refresh_tokens
    FOR ALL USING (user_id::text = auth.uid()::text);

-- Create RLS policies for user_passcode table (more permissive for auth flow)
CREATE POLICY "Anyone can read passcodes for verification" ON public.user_passcode
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create passcodes" ON public.user_passcode
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update passcodes for verification" ON public.user_passcode
    FOR UPDATE USING (true);

-- Insert default admin user (for development/demo purposes)
INSERT INTO public.users (id, email, password, role) 
VALUES (1, 'admin@omnipost.app', '$2b$10$rQZ9QjZ9QjZ9QjZ9QjZ9QjZ9QjZ9QjZ9QjZ9QjZ9QjZ9QjZ9QjZ9Q', 'admin')
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    role = EXCLUDED.role;
