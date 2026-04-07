-- ============================================
-- v2 マイグレーション: マネージャー・承認フロー・画像対応
-- ============================================
-- Supabase Dashboard → SQL Editor で実行してください
-- ※ schema.sql を先に実行済みであること

-- 1. profiles にマネージャー関連カラム追加
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'manager', 'admin'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. skill_progress に承認フロー・画像カラム追加
ALTER TABLE public.skill_progress
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS feedback text DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- 3. マネージャーが担当メンバーの進捗を更新できるポリシー
CREATE POLICY "Managers can update member progress"
  ON public.skill_progress FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = skill_progress.user_id
      AND profiles.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = skill_progress.user_id
      AND profiles.manager_id = auth.uid()
    )
  );

-- 自分の進捗を更新できるポリシー（メモ編集用）
CREATE POLICY "Users can update own progress"
  ON public.skill_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. admin は全 profiles を更新可能
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 5. Storage バケット作成（画像アップロード用）
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Storage ポリシー: 認証ユーザーがアップロード可能
CREATE POLICY "Authenticated users can upload evidence"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'evidence');

-- Storage ポリシー: 誰でも閲覧可能（public bucket）
CREATE POLICY "Anyone can view evidence"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'evidence');

-- ============================================
-- 実行後、マネージャーを設定するには:
--
-- UPDATE profiles SET role = 'manager'
-- WHERE display_name = 'マネージャーの名前';
--
-- メンバーにマネージャーを紐づけるには:
-- UPDATE profiles SET manager_id = (
--   SELECT id FROM profiles WHERE display_name = 'マネージャーの名前'
-- ) WHERE display_name = 'メンバーの名前';
-- ============================================
