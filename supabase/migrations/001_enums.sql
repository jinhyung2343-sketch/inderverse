-- 001_enums.sql
-- 공용 enum 타입 정의

CREATE TYPE user_role AS ENUM ('reader', 'creator', 'admin');
CREATE TYPE age_verify_provider AS ENUM ('pass', 'phone', 'manual');
CREATE TYPE channel_status AS ENUM ('draft', 'publishing', 'completed', 'suspended');
CREATE TYPE tag_category AS ENUM ('genre', 'mood', 'warning');
CREATE TYPE episode_pricing AS ENUM ('free', 'paid', 'wait_free');
CREATE TYPE episode_status AS ENUM ('draft', 'published', 'hidden');
CREATE TYPE coin_tx_type AS ENUM ('charge', 'use', 'refund', 'expire', 'bonus');
CREATE TYPE coin_type AS ENUM ('paid', 'free');
CREATE TYPE payout_method AS ENUM ('bank_transfer', 'paypal');
CREATE TYPE settlement_status AS ENUM ('pending', 'processing', 'completed', 'failed');
