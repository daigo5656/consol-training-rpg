-- ============================================
-- 新人ディレクター育成RPG - Supabase Schema
-- ============================================
-- Supabase Dashboard → SQL Editor で実行してください

-- 1. profiles テーブル（ユーザー情報）
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  department text default 'コンテンツソリューション部',
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. skill_progress テーブル（クエスト達成記録）
create table if not exists public.skill_progress (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  skill_id integer not null,
  memo text default '',
  completed_at timestamptz default now(),
  unique(user_id, skill_id)
);

-- 3. RLS（Row Level Security）有効化
alter table public.profiles enable row level security;
alter table public.skill_progress enable row level security;

-- 4. profiles ポリシー
-- 全認証ユーザーが全プロフィールを閲覧可能（リーダーボード用）
create policy "Authenticated users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- 自分のプロフィールのみ更新可能
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 自分のプロフィールを作成可能
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- 5. skill_progress ポリシー
-- 全認証ユーザーが全進捗を閲覧可能（リーダーボード用）
create policy "Authenticated users can view all progress"
  on public.skill_progress for select
  to authenticated
  using (true);

-- 自分の進捗のみ追加可能
create policy "Users can insert own progress"
  on public.skill_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 自分の進捗のみ削除可能
create policy "Users can delete own progress"
  on public.skill_progress for delete
  to authenticated
  using (auth.uid() = user_id);

-- 6. 新規ユーザー登録時に自動でプロフィール作成するトリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'ユーザー')
  );
  return new;
end;
$$ language plpgsql security definer;

-- 既存トリガーがあれば削除してから作成
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. updated_at 自動更新トリガー
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================
-- 初回セットアップ後、最初に登録したユーザーを
-- 管理者にするには以下を実行:
--
-- update public.profiles
-- set role = 'admin'
-- where display_name = 'あなたの名前';
-- ============================================
