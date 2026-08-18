-- ====================================================================
-- FINANCE RISK ANALYTICS — AUTHORITATIVE SUPABASE POSTGRESQL SCHEMA
-- ====================================================================
-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE (Tied 1:1 to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'user' -- Hardcoded default: clients CANNOT override role on signup
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PREVENT ROLE MUTATION TRIGGER FROM CLIENT UPDATES
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF current_setting('role', true) IS DISTINCT FROM 'service_role' AND current_user IS DISTINCT FROM 'postgres' THEN
      RAISE EXCEPTION 'Role modification is restricted to administrative mechanisms.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_profile_role_update ON public.profiles;
CREATE TRIGGER check_profile_role_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();

-- 2. FINANCIAL PROFILES TABLE (1:1 per user with UNIQUE constraint)
CREATE TABLE IF NOT EXISTS public.financial_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    monthly_net_income NUMERIC NOT NULL DEFAULT 0 CHECK (monthly_net_income >= 0),
    monthly_debt_payments NUMERIC NOT NULL DEFAULT 0 CHECK (monthly_debt_payments >= 0),
    essential_expenses NUMERIC NOT NULL DEFAULT 0 CHECK (essential_expenses >= 0),
    discretionary_expenses NUMERIC NOT NULL DEFAULT 0 CHECK (discretionary_expenses >= 0),
    liquid_savings NUMERIC NOT NULL DEFAULT 0 CHECK (liquid_savings >= 0),
    emergency_fund NUMERIC NOT NULL DEFAULT 0 CHECK (emergency_fund >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    date DATE DEFAULT CURRENT_DATE,
    is_essential BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DEBTS TABLE
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    debt_type TEXT NOT NULL,
    original_amount NUMERIC NOT NULL CHECK (original_amount >= 0),
    outstanding_balance NUMERIC NOT NULL CHECK (outstanding_balance >= 0),
    interest_rate NUMERIC NOT NULL CHECK (interest_rate >= 0),
    monthly_emi NUMERIC NOT NULL CHECK (monthly_emi >= 0),
    remaining_months INT NOT NULL DEFAULT 12 CHECK (remaining_months >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PORTFOLIO HOLDINGS TABLE
CREATE TABLE IF NOT EXISTS public.portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    quantity NUMERIC NOT NULL CHECK (quantity >= 0),
    purchase_price NUMERIC NOT NULL CHECK (purchase_price >= 0),
    current_price NUMERIC NOT NULL CHECK (current_price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FINANCIAL GOALS TABLE
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL CHECK (target_amount >= 0),
    current_savings NUMERIC NOT NULL DEFAULT 0 CHECK (current_savings >= 0),
    target_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RISK HISTORY SNAPSHOTS TABLE
CREATE TABLE IF NOT EXISTS public.risk_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    overall_score INT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    dti_ratio NUMERIC NOT NULL,
    cash_flow NUMERIC NOT NULL,
    savings_rate NUMERIC NOT NULL
);

-- 8. WHAT-IF SCENARIOS TABLE
CREATE TABLE IF NOT EXISTS public.what_if_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scenario_name TEXT NOT NULL,
    parameters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. REPORTS METADATA TABLE
CREATE TABLE IF NOT EXISTS public.reports_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_title TEXT NOT NULL,
    report_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.what_if_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports_metadata ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User-Owned Tables Policies (auth.uid() = user_id)
CREATE POLICY "Users CRUD own financial_profiles" ON public.financial_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users CRUD own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users CRUD own debts" ON public.debts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users CRUD own portfolio" ON public.portfolio_holdings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users CRUD own goals" ON public.financial_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users CRUD own risk_history" ON public.risk_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users CRUD own what_if_scenarios" ON public.what_if_scenarios FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users CRUD own reports_metadata" ON public.reports_metadata FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- HARDENED ADMIN AGGREGATE FUNCTION
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  result JSON;
BEGIN
  -- Verify caller is authenticated admin
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Unauthorized admin access attempt.';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_financial_profiles', (SELECT COUNT(*) FROM public.financial_profiles),
    'total_expenses_recorded', (SELECT COUNT(*) FROM public.expenses),
    'total_debts_recorded', (SELECT COUNT(*) FROM public.debts),
    'total_portfolio_holdings', (SELECT COUNT(*) FROM public.portfolio_holdings),
    'avg_dti_ratio', (
      SELECT ROUND(AVG((monthly_debt_payments / NULLIF(monthly_net_income, 0)) * 100), 2)
      FROM public.financial_profiles WHERE monthly_net_income > 0
    ),
    'avg_savings_rate', (
      SELECT ROUND(AVG(((monthly_net_income - essential_expenses - discretionary_expenses - monthly_debt_payments) / NULLIF(monthly_net_income, 0)) * 100), 2)
      FROM public.financial_profiles WHERE monthly_net_income > 0
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- REVOKE EXECUTION FROM PUBLIC / ANON, GRANT TO AUTHENTICATED
REVOKE EXECUTE ON FUNCTION public.get_admin_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_metrics() TO authenticated;
