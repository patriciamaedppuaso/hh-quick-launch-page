-- hh_blog_posts.id was created as uuid (matching the originally-pasted
-- data), but BlogPostForm generates new post ids the same way every other
-- form in this app does -- a string like "post-abc123", via newId() in
-- src/utils.ts -- which Postgres rejected with "invalid input syntax for
-- type uuid" (22P02). Since syncing does a delete-then-reinsert, the
-- delete succeeded and the insert failed, wiping the 4 original posts
-- with nothing to replace them.
--
-- Widen the column to text (existing uuid values are valid text, so this
-- is safe) and restore the 4 posts that got wiped, this time correctly
-- tagged with app_id = 'blog' from the start.

alter table hh_blog_posts alter column id type text using id::text;
alter table hh_blog_posts alter column id set default gen_random_uuid()::text;

insert into hh_blog_posts (id, app_id, slug, title, excerpt, content, cover_image_url, author_name, is_active, published_at, created_at) values
  ('2634ce79-af0b-48da-b5d0-dff4e76b1344', 'blog', 'dme-rentals-guide-for-hospice-agencies', 'Hospital Bed, Wheelchair, or Both? A Hospice Agency''s Guide to DME Rentals', 'A practical guide to renting durable medical equipment for hospice patients — what to rent, when, and how to keep it simple. Serving Southern California since 2006.', '# Hospital Bed, Wheelchair, or Both? A Hospice Agency''s Guide to DME Rentals

Every hospice patient''s equipment needs are different, and they rarely stay the same for long. That''s why renting durable medical equipment (DME) — rather than committing to a purchase — is standard practice for most hospice agencies. But knowing what to rent, when to rent it, and how to keep the process simple for your team isn''t always straightforward.

Here''s a practical breakdown for hospice coordinators and case managers working across Southern California.

## Why Renting Makes Sense for Hospice Care

Hospice care plans shift based on a patient''s condition, and equipment needs shift with them. Renting instead of purchasing gives your agency:

- **Flexibility** to scale equipment up or down as a patient''s needs change
- **Lower upfront cost** compared to purchasing equipment your agency may only need for weeks
- **Simplified logistics** — no need to store, maintain, or dispose of equipment after a patient''s care plan ends

For agencies managing dozens of active patients at once, rental models also make budgeting and billing far more predictable.

## What Hospice Patients Typically Need, and When

### Early Stage: Mobility and Comfort
As patients begin to lose mobility but are still relatively independent, agencies typically start with:

- Walkers, canes, and rollators
- Bedside commodes
- Grab bars and bathroom safety equipment

### Mid Stage: Bedroom and Mobility Equipment
As a patient becomes more bed-bound or needs more support getting around:

- Hospital beds with adjustable positioning
- Wheelchairs and wheelchair accessories
- Pressure-relief mattresses and cushions

### Later Stage: Respiratory and Wound Care Support
As symptoms progress, equipment needs often shift toward comfort and symptom management:

- Oxygen concentrators and respiratory equipment
- Wound care supplies
- Incontinence and urological supplies
- Nutrition support equipment

Because these transitions can happen quickly — sometimes within days — the ability to request STAT delivery on updated equipment matters as much as the rental terms themselves.

## Questions to Ask Before Choosing a Rental Partner

1. **How fast can equipment be delivered once a rental is requested?** Same-day or STAT delivery avoids gaps in patient comfort during time-sensitive transitions.
2. **Can rental terms adjust as a patient''s needs change,** without renegotiating a new contract each time?
3. **Is there a single point of contact** who can process changes quickly, rather than routing every request through a general line?
4. **Does the supplier serve your full coverage area** — not just one county, but everywhere your agency operates?
5. **Is support available in the languages your patients and families speak?** Equipment instructions and delivery coordination shouldn''t be a language barrier during an already difficult time.

## Keeping the Rental Process Simple for Your Team

The best hospice DME rental relationships remove friction rather than adding steps. Look for a supplier that offers:

- A streamlined way to place orders — phone, fax, email, or an online portal
- Clear visibility into what equipment is currently rented for each patient
- A dedicated account contact who already understands your agency''s ordering patterns

When the rental process is simple, your clinical team can stay focused on patient care instead of equipment logistics.

## How H&H Medical Supply Supports Hospice Rentals

Based in Whittier, California, H&H Medical Supply has provided equipment rentals to hospice agencies across Los Angeles, Orange, San Bernardino, Riverside, and San Diego Counties since 2006. Wheelchairs, hospital beds, walkers, and more are available by the day or month, with STAT delivery for urgent transitions and a dedicated account contact for every agency we work with.

Ready to simplify equipment rentals for your patients? [Request a quote](https://hhmedicalsupply.com/contact) or call (562) 693-2800 to get started.', 'https://trfaedilmjxpgbwadjgp.supabase.co/storage/v1/object/public/b2bwebsite/blog_posts/blog_post1.jpg', 'H&H Medical Supply Team', true, '2026-08-17 16:39:21.631378+00', '2026-08-17 16:39:21.631378+00'),
  ('862df5c3-f46e-489b-a62c-fae6474f9cd8', 'blog', 'choosing-a-hospice-dme-supplier-southern-california', 'How to Choose a Reliable Hospice DME Supplier in Southern California', 'Choosing a hospice DME supplier in Southern California? Here''s what to look for — STAT delivery, dedicated support, and multilingual care — from H&H Medical Supply.', '# How to Choose a Reliable Hospice DME Supplier in Southern California

When a hospice patient needs a hospital bed, oxygen concentrator, or wound care supplies, timing isn''t a convenience — it''s part of the care plan. For hospice agencies across Los Angeles, Orange, San Bernardino, Riverside, and San Diego Counties, the durable medical equipment (DME) supplier behind the scenes can make the difference between a smooth admission and a stressful one.

If your agency is evaluating hospice DME suppliers, or wondering whether your current one is still the right fit, here''s what actually matters.

## 1. Delivery Speed — Especially for STAT and After-Hours Orders

Hospice admissions don''t wait for business hours. A patient discharged on a Friday evening still needs a hospital bed set up before the weekend. Ask any potential supplier:

- What''s the actual turnaround time for STAT orders — not the marketing promise, but the real number?
- Is after-hours and weekend delivery available, or does it stop at 5 p.m.?
- Do they serve your full coverage area, or just the county closest to their warehouse?

A supplier that can''t answer these clearly probably can''t deliver on them either. Look for a DME partner that commits to specific windows — for example, STAT delivery within 2 to 4 hours — rather than vague same-day language.

## 2. A Dedicated Account Contact, Not a Call Center

Hospice coordinators and nurses don''t have time to explain their agency''s account history every time they call. A dedicated account contact who already knows your agency, your ordering patterns, and your patients'' needs saves real time on every single order.

When evaluating a supplier, ask whether you''ll be assigned one point of contact or routed through a general queue. This one factor tends to predict how smooth the relationship will be six months in.

## 3. Multilingual Support for Patients and Families

Southern California''s hospice population is linguistically diverse, and equipment instructions, delivery coordination, and family questions often need to happen in more than one language. Suppliers who offer support in English, Filipino, and Spanish remove a friction point that families and caregivers otherwise have to navigate alone.

## 4. Breadth of Inventory Across Care Categories

A hospice patient''s equipment needs shift as their condition changes — from mobility aids early on to respiratory care and wound care supplies later. A supplier with deep inventory across categories like:

- Hospital beds and bedroom equipment
- Bathroom safety equipment
- Mobility aids and wheelchairs
- Incontinence and urological supplies
- Nutrition and respiratory care
- Wound care

means your team isn''t juggling multiple vendors, or waiting on backorders, as a patient''s care plan evolves.

## 5. Rental Flexibility

Hospice care is often short-term and equipment needs change quickly, so rental terms matter as much as pricing. Look for a supplier that offers equipment rentals by the day or month, with a straightforward process for scaling equipment up or down as a patient''s needs change — not a rigid, long-term contract structure.

## 6. A True B2B Partnership Model

Hospice agencies aren''t retail customers, and shouldn''t be treated like one. A supplier built for hospice B2B partnerships will offer:

- Streamlined ordering (phone, fax, email, or an online portal)
- Account-based pricing and terms
- A process for tracking patient orders across your caseload

If a supplier''s entire model is built around one-off retail purchases, hospice-specific workflows tend to feel like an afterthought.

## What This Looks Like at H&H Medical Supply

Based in Whittier, California, H&H Medical Supply has served hospice agencies across Los Angeles, Orange, San Bernardino, Riverside, and San Diego Counties since 2006. STAT delivery, a dedicated account contact for every agency, multilingual support in English, Filipino, and Spanish, and equipment rentals built around hospice timelines aren''t add-ons — they''re the standard for every account.

If your agency is ready for a DME partner that treats every order like it matters, [request a quote](https://hhmedicalsupply.com/contact) or call (562) 693-2800 to talk with our team.', 'https://trfaedilmjxpgbwadjgp.supabase.co/storage/v1/object/public/b2bwebsite/blog_posts/blog_post2.jpg', 'H&H Medical Supply Team', true, '2026-08-17 16:39:21.631378+00', '2026-08-17 16:39:21.631378+00'),
  ('df908938-f212-4c38-8b85-dbd561e70031', 'blog', 'stationary-vs-portable-oxygen-concentrators', 'Stationary vs. Portable Oxygen Concentrators: Which Is Right for the Patient?', 'Learn the differences between stationary and portable oxygen concentrators, including portability, oxygen delivery, power requirements, and considerations for hospice patients.', 'For patients who require supplemental oxygen, choosing the right oxygen concentrator can help improve comfort, mobility, and daily care. Two common options are stationary oxygen concentrators and portable oxygen concentrators (POCs). While both provide concentrated oxygen, they are designed for different situations.

## Stationary Oxygen Concentrators

Stationary concentrators are primarily designed for home or facility use. They plug into a standard electrical outlet and are well suited for patients who need oxygen for extended periods.

They may be a good choice for patients who:
- Spend most of their time at home
- Require continuous-flow oxygen
- Need oxygen for extended periods or overnight
- Have higher prescribed oxygen requirements

Because these units depend on electricity, patients and caregivers should also have an appropriate backup plan for power outages or equipment issues.

## Portable Oxygen Concentrators

Portable oxygen concentrators are smaller, lighter, and typically battery-powered, making them more convenient for patients who need oxygen while away from home.

They may be helpful for patients who:
- Regularly attend appointments or leave home
- Want greater mobility and independence
- Can safely use a portable device
- Have oxygen requirements that the selected portable unit can support

Many portable concentrators use pulse-dose oxygen delivery, while some models also provide continuous flow. Because capabilities vary, the device should always match the patient''s prescribed oxygen needs.

## Which Option Is Right?

There is no single concentrator that is best for every patient. The appropriate choice depends on factors such as:
- Prescribed oxygen flow or setting
- Continuous-flow versus pulse-dose requirements
- Amount of time oxygen is needed each day
- Patient mobility and activity level
- Home environment and available power
- Caregiver and transportation needs

Some patients may benefit from a stationary concentrator at home and a portable concentrator for outings, depending on their care plan.

## Dependable Respiratory Equipment Support from H&H Medical Supply

At H&H Medical Supply, we understand how important dependable equipment and responsive service are for hospice agencies and their patients.

We provide oxygen equipment and other durable medical equipment throughout Southern California, helping hospice teams coordinate equipment needs with patients, families, and caregivers.

From equipment delivery and setup to ongoing service and support, our team is here to help hospice agencies focus on what matters most: providing quality patient care.

## Need Oxygen Equipment for a Patient?

Contact H&H Medical Supply to discuss your agency''s DME and respiratory equipment needs.[request a quote](https://hhmedicalsupply.com/contact) or call (562) 693-2800 to talk with our team.

**Fast delivery • Equipment setup • Responsive support • Southern California**', 'https://trfaedilmjxpgbwadjgp.supabase.co/storage/v1/object/public/b2bwebsite/blog_posts/blog_post3.png', 'H&H Medical Supply Team', true, '2026-08-31 04:00:00+00', '2026-08-31 22:36:02.19249+00'),
  ('0fa16f37-ff3b-4382-9e60-0548838502be', 'blog', 'bariatric-dme-explained-when-patients-need-more-than-standard-equipment', 'Bariatric DME Explained: When Patients Need More Than Standard Equipment', 'Learn when standard medical equipment may not be enough and how properly selected bariatric DME can support patient comfort, safer transfers, mobility, caregiver assistance, and dignity.', 'When it comes to patient care, the right equipment is about more than convenience. It can play an important role in **comfort, safety, mobility, and dignity**.

For patients who need equipment designed to accommodate higher weight capacities or larger body dimensions, standard durable medical equipment (DME) may not be appropriate. That is where **bariatric DME** becomes essential.

At **H&H Medical Supply**, we work with hospice agencies and care teams to help ensure patients receive equipment that fits their individual needs.

## What Is Bariatric DME?

Bariatric DME refers to medical equipment specifically designed with **higher weight capacities, wider dimensions, and reinforced construction** compared with standard equipment.

Depending on the patient''s needs, bariatric equipment may include:

* Bariatric hospital beds
* Heavy-duty or extra-wide wheelchairs
* Bariatric bedside commodes
* Bariatric walkers and rollators
* Heavy-duty patient lifts
* Bariatric transfer equipment
* Bariatric support surfaces and mattresses

Choosing appropriate equipment depends on more than a patient''s weight alone. Width, mobility level, transfer needs, positioning requirements, home environment, and caregiver considerations may all affect equipment selection.

## When Standard Equipment May Not Be Enough

Standard DME has manufacturer-specified weight capacities and dimensions. Using equipment that does not appropriately accommodate the patient can make everyday activities—such as transfers, repositioning, toileting, and mobility—more difficult.

For example:

* A wheelchair may technically support a patient''s weight but still be too narrow for comfortable positioning.
* A hospital bed may require additional width or a higher weight capacity.
* A patient lift may require both a higher-capacity frame and an appropriately sized sling.

This is why simply choosing the next available piece of equipment is not always the best solution.

## How Bariatric Equipment Can Support Safer Care

Properly selected bariatric DME can help care teams and families create an environment better suited to the patient''s needs.

### Patient Comfort

Adequate width and proper positioning can improve the patient''s overall experience while resting, sitting, or moving.

### Safer Transfers

Appropriately rated lifts, slings, beds, and mobility equipment can assist caregivers during transfers and repositioning.

### Mobility and Independence

The correct wheelchair, walker, or rollator can help patients participate in daily activities when appropriate for their condition.

### Caregiver Support

Equipment designed for the patient''s size and mobility needs may make routine care, repositioning, and transfers more manageable for caregivers.

### Patient Dignity

Equipment that properly fits the patient can help create a more respectful and comfortable care experience.

## What Should Hospice Teams Consider?

Before ordering bariatric DME, care teams should consider the patient''s overall needs and the environment where the equipment will be used.

Important details may include:

* The patient''s weight and body dimensions
* Mobility and transfer needs
* Required equipment weight capacity
* Room size
* Doorway clearance
* Available caregiver assistance
* Whether the equipment must move through hallways, elevators, stairs, or other restricted spaces

Providing these details early can help prevent delays, equipment exchanges, and situations where equipment arrives but cannot be safely or practically used in the patient''s home or facility.

## Communication Makes a Difference

Bariatric DME orders often require additional planning compared with standard equipment.

Clear communication between the hospice agency, DME provider, caregivers, family, and facility can help ensure the correct equipment is selected and the delivery location is prepared before arrival.

At **H&H Medical Supply**, our team coordinates with hospice agencies, patients, and families to help make the delivery and setup process as smooth as possible.

## The Right Equipment for the Right Patient

Every patient''s needs are different.

When standard equipment is not enough, choosing properly sized and appropriately rated bariatric DME can make a meaningful difference in patient comfort and day-to-day care.

**H&H Medical Supply** is proud to support hospice agencies throughout Southern California with reliable DME, responsive service, and equipment solutions tailored to patient needs.

## Need Help Determining the Right Equipment for Your Patient?

Contact the **H&H Medical Supply** team:

* **Phone:** [562-693-2800](tel:5626932800)
* **Email:** [customerservice@hhmedicalsupply.com](mailto:customerservice@hhmedicalsupply.com)

*You focus on care. We''ll handle the equipment.*
', 'https://trfaedilmjxpgbwadjgp.supabase.co/storage/v1/object/public/b2bwebsite/blog_posts/1789420917802-d7oi6fjj5lq.png', 'H&H Medical Supply Team', true, '2026-09-14 04:00:00+00', '2026-09-14 21:22:01.73302+00');
