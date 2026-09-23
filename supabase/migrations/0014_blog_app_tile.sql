-- 0013 created hh_blog_posts as a standalone table before the "Blog" app
-- tile existed. This adds app_id so it fits the same app_id-scoped pattern
-- as every other builtin (leads, contacts, ...) -- see
-- src/components/BlogPage.tsx -- without touching the already-applied 0013.

-- 0001_init.sql's apps.builtin check constraint predates this builtin kind.
alter table apps drop constraint apps_builtin_check;
alter table apps add constraint apps_builtin_check
  check (builtin in ('contacts', 'leads', 'announcements', 'tasks', 'timeclock', 'users', 'receivables', 'blog'));

insert into apps (id, name, type, initial, category, description, icon, tint_bg, tint_fg, builtin, sort_order, unit_label)
values ('blog', 'Blog', 'list', 'BL', 'Marketing', 'Manage blog posts for hhmedicalsupply.com', 'newspaper', '#EAF1FD', '#5B8DEF', 'blog', 14, 'posts');

alter table hh_blog_posts add column app_id text references apps(id) on delete cascade;
update hh_blog_posts set app_id = 'blog';
alter table hh_blog_posts alter column app_id set not null;

create index hh_blog_posts_app_id_idx on hh_blog_posts(app_id);

alter publication supabase_realtime add table hh_blog_posts;
