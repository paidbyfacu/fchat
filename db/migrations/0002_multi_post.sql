-- Hito 2: un trigger puede escuchar varios posts puntuales.
-- media_id queda para el alcance 'next' (el post que se asigna al publicarse).

alter table triggers add column media_ids text[] not null default '{}';

update triggers set media_ids = array[media_id] where post_scope = 'specific' and media_id is not null;

alter table triggers drop constraint specific_needs_media;
alter table triggers add constraint specific_needs_media
  check (post_scope is distinct from 'specific' or cardinality(media_ids) > 0);

create index triggers_media_ids on triggers using gin (media_ids);
