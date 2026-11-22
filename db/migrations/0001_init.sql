-- Esquema del clon (Instagram). Postgres 15+.
-- Todo en UTC (timestamptz). Dueño único: el acceso se chequea en la capa de
-- datos (cada consulta filtra por ig_account_id de una cuenta del usuario logueado).
-- Sin cola externa: webhook_events (pendientes) y flow_runs (esperas) son la cola.
-- gen_random_uuid() es nativo desde Postgres 13: no hace falta pgcrypto.


create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- 1. Usuarios del panel (hoy: solo vos)
create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Cuentas de Instagram conectadas (S02)
create table ig_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  ig_user_id text not null unique,          -- el id que llega en entry.id del webhook
  username text not null,
  profile_pic_url text,
  access_token_enc bytea not null,          -- AES-256-GCM con TOKEN_ENC_KEY
  token_expires_at timestamptz not null,
  scopes text[] not null default '{}',
  status text not null default 'ok'
    check (status in ('ok','expired','missing_perms','disconnected')),
  webhooks_subscribed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on ig_accounts (user_id);
create index on ig_accounts (token_expires_at) where status = 'ok';

-- 3. Automatizaciones (S04)
create table automations (
  id uuid primary key default gen_random_uuid(),
  ig_account_id uuid not null references ig_accounts(id) on delete cascade,
  name text not null,
  kind text not null default 'quick' check (kind in ('quick','flow')),
  template text check (template in ('comment_dm','dm_keyword','story_reply')),
  status text not null default 'draft' check (status in ('draft','live','stopped')),
  live_version_id uuid,                     -- FK abajo (referencia circular)
  wizard jsonb not null default '{}',       -- estado del asistente S05, si kind = quick
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on automations (ig_account_id, status);

-- 4. Versiones publicadas del grafo (S07). Inmutables: editar = versión nueva.
create table automation_versions (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references automations(id) on delete cascade,
  version int not null,
  graph jsonb not null,                     -- {nodes:[...], edges:[...], start:"node_id"}
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (automation_id, version)
);
alter table automations
  add constraint automations_live_version_fk
  foreign key (live_version_id) references automation_versions(id) on delete set null;

-- 5. Disparadores (S09)
create table triggers (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references automations(id) on delete cascade,
  ig_account_id uuid not null references ig_accounts(id) on delete cascade, -- copia para buscar rápido
  type text not null check (type in ('comment','dm_keyword','story_reply','ref_url')),
  post_scope text check (post_scope in ('specific','any','next')),
  media_id text,                            -- 'specific', o 'next' una vez que se publicó el post
  keywords_include text[] not null default '{}',  -- normalizadas: minúsculas, sin acentos
  keywords_exclude text[] not null default '{}',
  match text not null default 'contains' check (match in ('any','contains','exact')),
  public_replies text[] not null default '{}',
  ref text,                                 -- para ref_url (ig.me/m/usuario?ref=...)
  is_active boolean not null default false, -- = automations.status = 'live'
  armed_at timestamptz,                     -- 'next': solo posts publicados después de esto
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comment_needs_scope check (type <> 'comment' or post_scope is not null),
  constraint specific_needs_media check (post_scope is distinct from 'specific' or media_id is not null)
);
create index on triggers (ig_account_id, type, is_active);
create index on triggers (automation_id);
create index on triggers (media_id) where media_id is not null;
-- Solo un "próximo post" esperando por cuenta
create unique index one_armed_next_post on triggers (ig_account_id)
  where type = 'comment' and post_scope = 'next' and media_id is null and is_active;
create unique index one_ref_per_account on triggers (ig_account_id, ref) where ref is not null;

-- 6. Contactos (S11, S12)
create table contacts (
  id uuid primary key default gen_random_uuid(),
  ig_account_id uuid not null references ig_accounts(id) on delete cascade,
  igsid text not null,                      -- Instagram-scoped id del usuario
  username text,
  name text,
  profile_pic_url text,
  follows_business boolean,                 -- último valor leído; null = nunca chequeado
  follows_checked_at timestamptz,
  opted_in boolean not null default false,  -- tocó un botón / respondió alguna vez
  last_inbound_at timestamptz,              -- abre la ventana de 24 h
  email text,
  automation_paused_until timestamptz,      -- toma humana desde la bandeja (S13)
  blocked boolean not null default false,
  last_message_at timestamptz,
  unread_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ig_account_id, igsid)
);
create index on contacts (ig_account_id, last_message_at desc);
create index on contacts (ig_account_id, created_at desc);
create index on contacts (ig_account_id, lower(username));

-- 7–8. Etiquetas
create table tags (
  id uuid primary key default gen_random_uuid(),
  ig_account_id uuid not null references ig_accounts(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ig_account_id, name)
);
create table contact_tags (
  contact_id uuid not null references contacts(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contact_id, tag_id)
);
create index on contact_tags (tag_id);

-- 9–10. Campos personalizados
create table custom_fields (
  id uuid primary key default gen_random_uuid(),
  ig_account_id uuid not null references ig_accounts(id) on delete cascade,
  key text not null check (key ~ '^[a-z][a-z0-9_]{0,39}$'),
  label text not null,
  type text not null default 'text' check (type in ('text','number','date','boolean','email','url')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ig_account_id, key)
);
create table contact_field_values (
  contact_id uuid not null references contacts(id) on delete cascade,
  field_id uuid not null references custom_fields(id) on delete cascade,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (contact_id, field_id)
);
create index on contact_field_values (field_id);

-- 11. Mensajes (S13)
create table messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  direction text not null check (direction in ('in','out')),
  mid text,                                 -- id de Meta; null si el envío falló
  kind text not null check (kind in ('text','template','quick_reply','postback','media','private_reply','story_reply')),
  body jsonb not null,
  sent_by text check (sent_by in ('bot','human')),  -- solo para 'out'
  run_id uuid,                              -- FK abajo
  error jsonb,                              -- respuesta de Meta si falló
  created_at timestamptz not null default now()
);
create unique index messages_mid_unique on messages (mid) where mid is not null;
create index on messages (contact_id, created_at desc);

-- 12. Webhooks crudos: se guardan antes de procesar (idempotencia + re-procesar)
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,          -- comment:<id> | mid:<mid> | postback:<mid> | read:<mid>...
  ig_user_id text not null,
  field text not null,                      -- comments | messages | messaging_postbacks | ...
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','done','ignored','failed')),
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
create index on webhook_events (status, received_at) where status in ('pending','failed');
create index on webhook_events (received_at);

-- 13. Comentarios que vimos y qué hicimos con cada uno
create table comment_events (
  id uuid primary key default gen_random_uuid(),
  ig_account_id uuid not null references ig_accounts(id) on delete cascade,
  comment_id text not null,
  media_id text not null,
  igsid text not null,
  username text,
  text text not null,
  commented_at timestamptz not null,
  trigger_id uuid references triggers(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  public_reply_id text,
  private_reply_mid text,
  status text not null default 'received'
    check (status in ('received','ignored','matched','replied','failed','expired')),
  error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ig_account_id, comment_id)
);
create index on comment_events (ig_account_id, created_at desc);
create index on comment_events (trigger_id);
-- Una persona dispara una sola vez por post y trigger
create unique index one_reply_per_person_per_post on comment_events (trigger_id, media_id, igsid)
  where status in ('matched','replied');

-- 14. Ejecuciones de flujo: el motor con estado (delays, botones, recordatorios)
create table flow_runs (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  automation_id uuid not null references automations(id) on delete cascade,
  version_id uuid not null references automation_versions(id) on delete restrict,
  comment_event_id uuid references comment_events(id) on delete set null,
  current_node text,
  waiting_for text check (waiting_for in ('button','input','time','follow')),
  resume_at timestamptz,
  attempts int not null default 0,          -- p. ej. reintentos de "Ya te sigo"
  vars jsonb not null default '{}',
  status text not null default 'running'
    check (status in ('running','waiting','done','expired','failed','cancelled')),
  error jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on flow_runs (contact_id);
create index on flow_runs (automation_id, started_at desc);
create index on flow_runs (resume_at) where status = 'waiting' and resume_at is not null;
-- Un solo run vivo por contacto y automatización
create unique index one_live_run on flow_runs (contact_id, automation_id)
  where status in ('running','waiting');
alter table messages
  add constraint messages_run_fk foreign key (run_id) references flow_runs(id) on delete set null;
create index on messages (run_id);

-- 15. Links con seguimiento (/l/<code>)
create table tracked_links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                -- corto, aleatorio
  run_id uuid references flow_runs(id) on delete set null,
  contact_id uuid references contacts(id) on delete cascade,
  automation_id uuid references automations(id) on delete cascade,
  node_id text,
  target_url text not null check (target_url ~ '^https?://'),
  clicks int not null default 0,
  first_click_at timestamptz,
  created_at timestamptz not null default now()
);
create index on tracked_links (run_id);
create index on tracked_links (contact_id);
create index on tracked_links (automation_id);

-- 16. Eventos del embudo para Insights (S10)
create table automation_events (
  id bigint generated always as identity primary key,
  automation_id uuid not null references automations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  run_id uuid references flow_runs(id) on delete set null,
  step text not null check (step in (
    'triggered','public_replied','dm_sent','opened','email_collected',
    'follow_asked','followed','link_sent','link_clicked','reminder_sent','failed')),
  created_at timestamptz not null default now()
);
create index on automation_events (automation_id, step, created_at);
create index on automation_events (contact_id);
create index on automation_events (run_id);

-- updated_at automático
do $$
declare t text;
begin
  foreach t in array array['users','ig_accounts','automations','triggers','contacts','tags',
                           'custom_fields','contact_field_values','comment_events','flow_runs'] loop
    execute format('create trigger %I_updated_at before update on %I
                    for each row execute function set_updated_at()', t, t);
  end loop;
end $$;
