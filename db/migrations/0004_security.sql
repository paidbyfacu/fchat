-- Sesiones del panel guardadas en la base: salir, cambiar la contraseña o cerrar
-- una sesión desde Ajustes la anula de verdad, aunque alguien haya copiado la cookie.
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  ip text,
  user_agent text,
  revoked_at timestamptz
);
create index if not exists sessions_user_idx on sessions (user_id);

-- Intentos de entrar, para frenar a quien prueba contraseñas. Cada intento se anota
-- antes de revisar la contraseña; checked marca los que de verdad se revisaron.
create table if not exists login_attempts (
  id bigserial primary key,
  ip text not null,
  email text not null,
  checked boolean not null default false,
  at timestamptz not null default now()
);
create index if not exists login_attempts_ip_idx on login_attempts (ip, at);
create index if not exists login_attempts_at_idx on login_attempts (at);
