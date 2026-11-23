-- Milestone 2: a trigger can listen to several specific posts.
-- media_id stays for the 'next' scope, the post assigned once it is published.

alter table triggers add column media_ids text[] not null default '{}';

update triggers set media_ids = array[media_id] where post_scope = 'specific' and media_id is not null;

alter table triggers drop constraint specific_needs_media;
alter table triggers add constraint specific_needs_media
  check (post_scope is distinct from 'specific' or cardinality(media_ids) > 0);

create index triggers_media_ids on triggers using gin (media_ids);
