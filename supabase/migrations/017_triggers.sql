-- 017_triggers.sql
-- 공통 Trigger (updated_at 자동 갱신 및 회원가입 시 프로필/지갑 생성)

CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_channels_updated BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_episodes_updated BEFORE UPDATE ON episodes
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_revenue_updated BEFORE UPDATE ON revenue_settings
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_coin_wallets_updated BEFORE UPDATE ON coin_wallets
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();


-- 회원 가입 시 profile 및 coin_wallets 자동 생성
CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', '유저'), 'reader');
  
  INSERT INTO public.coin_wallets (id, user_id)
  VALUES (gen_random_uuid(), NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();
