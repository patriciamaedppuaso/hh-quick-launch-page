-- hh_contact_submissions: messages sent through the hhmedicalsupply.com
-- contact form. id is text (not uuid) for the same reason as 0015/0016.

create table hh_contact_submissions (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  submitted_at timestamptz not null default now()
);
create index hh_contact_submissions_submitted_at_idx on hh_contact_submissions(submitted_at desc);

alter table hh_contact_submissions enable row level security;
create policy "authenticated full access" on hh_contact_submissions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- hh_contact_submissions (16 rows)
insert into hh_contact_submissions (id, name, email, phone, message, submitted_at) values
  ('d54f0281-ae68-4396-b752-9740b57391e0', 'Patricia Puaso', 'patriciadelapena515@gmail.com', '123-456-789', 'sample email', '2026-07-17 17:21:49.697738+00'),
  ('5145c1d8-a11f-472d-b500-544defefc624', 'Patricia Puaso', 'patriciatestemail@gmail.com', '123-456-789', 'sample email', '2026-07-17 17:35:25.657162+00'),
  ('08d0ee58-282d-4f3a-884f-d360d89505e5', 'Patricia Puaso', 'patriciadelapena515@gmail.com', '123-456-789', 'sample email', '2026-07-17 17:37:51.440546+00'),
  ('a0ab16a4-9d58-4f41-a037-224ea79c4edd', 'Patricia Puaso', 'patriciadelapena515@gmail.com', null, 'sample email', '2026-07-17 17:39:16.143448+00'),
  ('9c959316-fceb-4b2d-bbf6-b91c2787d98d', 'Patricia Puaso', 'patriciadelapena515@gmail.com', null, 'Sample message.', '2026-07-24 21:13:26.80958+00'),
  ('65a3c308-2536-4c6b-9f02-917061af7a9a', 'Pat', 'p@gmail.com', '123-456-7899', 'sample email message', '2026-08-11 20:55:29.712248+00'),
  ('deee0960-f243-4a2e-a62d-3fd26a8f17af', 'Patt', 'p@gmail.com', '(123) -456-7890', 'sample', '2026-08-11 21:10:17.405829+00'),
  ('758b082c-4465-40a7-86c9-771762ac6219', 'Test Notification', 'test@hhmedicalsupply.com', '(123) 456-7890', 'This is a TEST submission to confirm the 3-recipient email notification and new sender domain are working correctly. Please disregard.', '2026-08-11 21:16:10.809419+00'),
  ('77764b7f-c122-4b40-a00d-7ff3107934db', 'Pat', 'p@gmail.com', '(123) -456-7980', 'sample', '2026-08-12 20:19:19.775897+00'),
  ('c0af3135-8f47-469d-a450-57eb96232d9a', 'Pat', 'p@gmail.com', '123 -456-7890', 'sample', '2026-08-12 21:19:33.166156+00'),
  ('9d94e9ad-c684-4f5a-9771-c13eaffbb153', 'Pat', 'pat@gmail.com', '123-456-7890', 'sample message', '2026-08-12 21:38:37.785394+00'),
  ('85dde266-22b1-4163-9970-2a1c8d118d97', 'CHERRY', 'customerservice@hhmedicalsupply.com', '15626932800', 'HEYKJBDKJABKFJAKJHKAHDFLAMD', '2026-08-12 22:06:02.062884+00'),
  ('7b4b2460-050c-48d4-99cd-8752c6ac7c7d', 'MYKA', 'tamanganmyka03@gmail.com', '857-123-4569', 'hello', '2026-08-12 22:06:40.700366+00'),
  ('2f3eb0c3-f85e-4274-9373-725a4c8ce62f', 'Patricia', 'pat@gmail.com', '123-456-7890', 'sample message', '2026-08-12 22:26:25.26253+00'),
  ('5d6f19ac-dc71-4111-875c-04fef8c69114', 'Jackson Pan', 'jackson.pan@seedagent.ai', '+1 765 476 6176', 'Hi H&H Medical Supply team,

I''m reaching out to explore a potential collaboration partnership.

At SeedAgent AI Studio, we specialize in AI-native video production, including cinematic commercials, branded storytelling, social content, AI avatars, product videos, localization, and episodic vertical dramas. Our team handles the full production pipeline, from concept and script adaptation to AI video generation, voiceover, sound design, post-production, and final delivery.

We work with agencies, studios, and content teams as a specialized AI production partner, helping them expand their capabilities, handle additional production capacity, or deliver AI-powered content for client projects, including behind the scenes or on a white-label basis.

To make it easy to evaluate our capabilities, we''re also happy to produce a proof-of-concept based on one of your ideas or client use cases.

You can see some of our recent work here:
https://www.seedagent.ai/gallery

If this type of partnership sounds relevant to your team, I''d be happy to schedule a brief call to explore the possibilities:
https://calendar.app.google/sVz3v2cxHgPeVmBc9

Best regards,
Jackson Pan
Cofounder@SeedAgent.ai
+1(765)476-6176
https://www.linkedin.com/in/zeyupan1995
535 Mission St 14th floor
San Francisco, CA 94105, USA', '2026-08-25 02:25:53.490824+00'),
  ('4ae8f018-3b6f-493b-ab35-22a92e712e2e', 'Stephen Morrison', 'stephen.morrison@jmailservice.com', '8054002077', 'We can position your brand above competitors within 24 hours - no waiting, no complicated setup.
Would you like to get more details about it?', '2026-09-01 06:06:18.977996+00');
