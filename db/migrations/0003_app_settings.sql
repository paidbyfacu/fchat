-- Datos sueltos de la app, como la huella del último token importado desde IG_ACCESS_TOKEN.
create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
