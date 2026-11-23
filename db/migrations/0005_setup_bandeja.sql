-- Guided installation and inbox.
-- users: name for the greeting and acceptance of the terms.
alter table users add column if not exists name text;
alter table users add column if not exists terms_accepted_at timestamptz;
alter table users add column if not exists terms_version text;

-- contacts: conversation state in the inbox, favorites and reminders.
alter table contacts add column if not exists inbox_status text not null default 'open';
alter table contacts drop constraint if exists contacts_inbox_status_check;
alter table contacts add constraint contacts_inbox_status_check check (inbox_status in ('open','closed'));
alter table contacts add column if not exists starred boolean not null default false;
alter table contacts add column if not exists remind_at timestamptz;
create index if not exists contacts_inbox_idx on contacts (ig_account_id, inbox_status, last_message_at desc);

-- messages: internal inbox notes, which are never sent.
alter table messages drop constraint if exists messages_kind_check;
alter table messages add constraint messages_kind_check
  check (kind in ('text','template','quick_reply','postback','media','private_reply','story_reply','note'));
