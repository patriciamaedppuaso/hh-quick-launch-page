-- Replaces the single generic placeholder template with real, multi-template
-- support -- H&H actually uses (at least) two distinct documents, each with
-- its own set of named blanks (e.g. {{name_of_hospice}}, {{date_of_contract}}).
-- A contract instance now references which template it was created from and
-- stores the recipient's answers as a flexible key/value map (field_values)
-- instead of a fixed set of columns, since different templates need
-- different fields.

alter table contract_templates add column fields jsonb not null default '[]'::jsonb;

alter table service_contracts add column template_id text references contract_templates(id);
alter table service_contracts add column field_values jsonb not null default '{}'::jsonb;
alter table service_contracts drop column full_name;
alter table service_contracts drop column address;
alter table service_contracts drop column phone;
alter table service_contracts drop column email;
alter table service_contracts drop column equipment;
alter table service_contracts drop column start_date;

delete from contract_templates where id = 'default';

insert into contract_templates (id, title, body, fields) values (
  'guaranty-agreement',
  'Guaranty Agreement',
  $doc$GUARANTY AGREEMENT

This Guaranty Agreement (this "Guaranty") is made effective as of {{date_of_agreement}}, by {{name_of_guarantor}}, (the "Guarantor") of {{name_of_business}}

This Guaranty is being given to Home & Health Medical Supply, (the "Creditor") of 13112 Hadley St #110, Whittier, California 90601.

This Guaranty is being given for the benefit of the Guarantor for {{name_of_hospice}} (the "Debtor") of {{hospice_address}}

I. OBLIGATIONS. This Guaranty is given by the Guarantor to induce the Creditor to enter into a contract with the Debtor for the purpose of {{name_of_hospice}} will be renting medical equipment from Home & Health Medical Supply. (a copy of the proposed contract is attached as Exhibit A) and in consideration of the Creditor doing so, and for other good and valuable consideration, the receipt and sufficiency of which is hereby acknowledged, and further acknowledging that the Creditor intends to rely on this Guaranty, the Guarantor absolutely and unconditionally guarantees prompt and satisfactory performance of the contract, in accordance with all of its terms and conditions, by the Debtor, under the terms set forth below. If the Debtor should default in the performance of its obligations under the contract according to the contract's terms and conditions, the Guarantor shall be liable to the Creditor for all expenses, costs, and damages that the Creditor is entitled to recover from the Debtor, including, to the extent not prohibited by law, all costs and attorney's fees incurred in attempting to realize upon this Guaranty.

II. DURATION. This is a continuing Guaranty and shall not be revoked by the Guarantor. This Guaranty will remain effective until all obligations guaranteed by this Guaranty are completely discharged.

III. NOTICE OF DEFAULT. The Creditor shall not be required to notify the Guarantor of a default by the Debtor in the Debtor's commitments to the Creditor before proceeding against the Guarantor under this Guaranty.

IV. CREDITOR PROVISIONS. The Guarantor expressly waives diligence on the part of the Creditor in the collection of any part of the debt or other obligation owed by the Debtor. Further, the Creditor has no duty to bring suit against the Debtor (for collection of the debt or other performance which is due) before proceeding against the Guarantor. The Guarantor waives notice of the acceptance of this Guaranty and of any and all such indebtedness and liability. The Guarantor waives presentment, protest, notice, demand, or action on delinquency in respect of any such indebtedness or liability, including any right to require the Creditor to sue or otherwise enforce payment. Until all obligations of the Debtor to the Creditor have been satisfied in full, the Guarantor waives all rights of subrogation to any collateral and remedies of the Creditor against the Debtor, and other persons or entities. Any indebtedness of the Debtor now or hereafter owed to the Guarantor is hereby subrogated to the indebtedness of the Debtor to the Creditor, and such indebtedness of the Debtor to the Guarantor, if the Creditor so requests, shall be collected, enforced, and received by the Guarantor as trustee for the Creditor and be paid over to the Creditor on account of the indebtedness of the Debtor to the Creditor, but without reducing or affecting in any manner the liability of the Guarantor under the provisions of this Guaranty.

V. AUTHORITY TO ALTER OBLIGATION. The Guarantor agrees that, without notice to the Guarantor, the Creditor may (a) change the terms of payment or performance by the Debtor to the Creditor, and/or (b) release any security. In either event, the Guarantor shall not be released from any responsibility on the obligations of the Debtor. Liability under this Guaranty is not dependent or conditioned upon this instrument being signed by any person or persons. The Guarantor's liability under this Guaranty is several and is independent of any other guarantees. Guarantees of others, if any, may be released or modified, with or without consideration, without affecting the liability of the Guarantor.

VI. ASSIGNMENT. This Guaranty (a) shall bind the successors and assigns of the Guarantor (this Guaranty is not assignable by the Guarantor without the express written consent of the Creditor, and is not affected by the death of the Guarantor), (b) shall inure to the Creditor, its successors and assigns, and (c) may be enforced by any party to whom all or any part of the liabilities may be sold, transferred, or assigned by the Creditor.

VII. FINANCIAL CONDITION. The Creditor has no duty to advise the Guarantor of the Debtor's financial condition.

VIII. CORPORATE AUTHORITY. The Guarantor certifies that it is not prohibited under its articles of incorporation or bylaws (or its articles of organization or operating agreement, if a limited liability company) to act as the Guarantor.

IX. ENTIRE AGREEMENT. This Guaranty contains the entire agreement of the parties with respect to the subject matter of this Guaranty and there are no other promises or conditions in any other agreement, whether oral or written. This Guaranty supersedes any prior written or oral agreements between the parties with respect to the subject matter of this Guaranty.

X. AMENDMENT. This Guaranty may be modified or amended if the amendment is made in writing and is signed by both parties.

XI. SEVERABILITY. If any provision of this Guaranty shall be held to be invalid or unenforceable for any reason, the remaining provisions shall remain valid and enforceable. If a court finds that any provision of this Guaranty is invalid or unenforceable, but that by limiting such provision it would become valid or enforceable, then such provision shall be deemed to be written, construed, and enforced as so limited.

XII. WAIVER OF CONTRACTUAL RIGHT. The failure of either party to enforce any provision of this Guaranty shall not be construed as a waiver or limitation of that party's right to subsequently enforce and compel strict compliance with every provision of this Guaranty.

XIII. APPLICABLE LAW. This Guaranty shall be governed by the laws of the State of California.

XIV. RECEIPT. The Guarantor acknowledges receipt of a copy of this Guaranty.

XV. SIGNATURES. This Guaranty shall be signed for the Guarantor by the undersigned.

Print Name: {{name_of_guarantor}}
Driver License Number and State: {{drivers_license}}
Home Address, City, and State: {{home_address}}$doc$,
  $fields$[
    {"key":"date_of_agreement","label":"Date of agreement","type":"date"},
    {"key":"name_of_guarantor","label":"Name of guarantor","type":"text"},
    {"key":"name_of_business","label":"Name of business","type":"text"},
    {"key":"name_of_hospice","label":"Name of hospice (debtor)","type":"text"},
    {"key":"hospice_address","label":"Hospice address","type":"text"},
    {"key":"drivers_license","label":"Driver license number and state","type":"text"},
    {"key":"home_address","label":"Home address, city, and state","type":"text"}
  ]$fields$::jsonb
);

insert into contract_templates (id, title, body, fields) values (
  'hospice-equipment-agreement',
  'Hospice Home Medical Equipment Provision Agreement',
  $doc$HOSPICE HOME MEDICAL EQUIPMENT PROVISION AGREEMENT

This Professional Services Agreement (this "Agreement") dated as of {{date_of_contract}} is entered into by and between {{name_of_hospice}} ("Hospice") and Home & Health Medical Supply ("Contractor").

RECITALS

A. Hospice owns and operates a licensed and certified Hospice that provides Hospice services to patients in Los Angeles and Orange Counties.
B. Contractor is a provider of durable medical equipment and respiratory services.
C. Hospice desires to contract with Contractor to provide those services more specifically described in Article II below to the patients of the Hospice, and Contractor desires to provide such services under the terms and conditions set forth in this Agreement.
D. Hospice believes that high standards of patient care can be achieved if Contractor assumes responsibilities set forth in this Agreement.

THEREFORE, THE PARTIES AGREE:

I. DEFINITIONS

Attending Physician: a doctor of medicine or osteopathy, licensed to practice medicine in the State of California, who is identified by the patient, at the time he or she elects to receive Hospice care, as having the most significant role in the management and delivery of the individual's medical care.

Hospice Medical Director: a duly licensed doctor of medicine or osteopathy employed by the Hospice who assumes overall responsibility for the medical component of Hospice's patient care program and acts as consultant to the patient's attending physician when requested.

Hospice Interdisciplinary Group: a group of Hospice employees, consisting at a minimum of a doctor of medicine or osteopathy, a registered nurse, a social worker, and a counselor, who provide or supervise the care and services offered by the Hospice.

Hospice Patient: an individual who elects, directly or through such individual's legal representative, to receive Hospice services, and is accepted by Hospice to receive Hospice services. The Hospice Patient's certified by his/her attending physician to be a terminally ill person with six months or less life expectancy and has been admitted to the Hospice in accordance with the Hospice admission criteria.

Hospice Plan of Care: a written care plan established by the Hospice Medical Director, attending physician, and Hospice Interdisciplinary Group; maintained, reviewed, and modified, if necessary, at regular intervals, which includes (a) an assessment of each Hospice Patient's needs with intervention and evaluation, (b) an identification of the Hospice Services, including management of discomfort and symptom relief, needed to meet such Hospice Patient's needs and the related needs of the Hospice Patient's family, and (c) details concerning the scope and frequency of such Hospice Services.

II. CONTRACTOR ROLE AND RESPONSIBILITIES

2.1 Services
A. Contractor shall, with the express authorization of Hospice and subject to the coordination, supervision, and evaluation of services
B. By Hospice, provide durable medical equipment, oxygen, and respiratory equipment, and related supplies, as listed on Schedule 1, attached hereto and incorporated herein.
C. All items designated as "STAT" or "Emergency" shall be provided within 4 hours. Delivery times may vary due to natural disasters or circumstances beyond the Contractor's control.
D. Contractor shall provide such instruction as may be necessary on the use and care of such durable medical equipment and oxygen and respiratory equipment upon delivery.
E. Contractor shall be available to provide services to meet the needs of Hospice patients on a 24-hour a day basis, 7 days a week basis for emergency services.
F. Contractor shall communicate to Hospice Patient Care Manager, or designee, any changes in patient's status, compliance, or instructions on a timely basis.

2.02 Qualifications
A. Contractor shall at all times maintain throughout the terms of this Agreement, all licenses, certification, and accreditations necessary to provide Services in accordance with this Agreement.
B. All personnel utilized by Contractor in the provision of Services shall maintain throughout the terms of the Agreement all necessary licenses, certifications and accreditations necessary to provide Services. Contractor shall maintain and provide upon request to Hospice documentation of the competence, and verification of all appropriate licenses, certifications, and other permissions necessary lawfully to provide their services to the Hospice patients for all staff working under this Agreement.
C. In the event that the licensure, certification, or accreditation of any Contractor personnel is revoked, suspended, limited, or subject to any other adverse action, such individual shall be immediately removed from the provision of Services under this Agreement.
D. Pursuant to 42 C.F.R. §411.351, the services provided under this contract are excluded from the definition of designated health services under the federal Stark law as they are services that are reimbursed by Medicare as part of a composite rate. As such, this relationship does not have to comply with the Stark law. In the event that there are changes to the federal Stark law (or the interpretation of that law by either a court or a regulatory agency) or if Hospice no longer received payment from Medicare on a composite basis, this contract may be terminated by either party according to the special termination provisions of Section 6.02. If compliance with the Stark law were to require a change in ownership of the Contractor, this will be considered to be "impossible" or "unfeasible" within the meaning in the special termination provision.
E. The prices listed in the attached fee schedule are within fair market value. The prices are not based on the volume or value of any past referrals between the parties (or their respective owners, members, or employees) or the anticipated value of any future referrals between the parties (or their respective owners, members or employees).

2.03 Standards of Practice and Compliance with Laws
A. Contractor shall furnish Services under this Agreement in accordance with applicable federal and state statutes and regulations
B. Contractor shall adhere to established Standards of Practice, policies, and procedures, applicable laws, rules and regulations and manufacturer's guidelines relative to care and maintenance of equipment.
C. Contractor shall maintain personnel policies consistent with industry practice and applicable law. Contractor shall not be required to maintain personnel policies identical to those of Hospice.

2.04 Monthly Reports
Contractor shall prepare and furnish to Hospice a Monthly Service Report describing the Services provided by the Contractor during the preceding month. Such Monthly Report shall be in a form acceptable to Hospice and shall include such information as Hospice deems necessary to monitor the provision of Service by the Contractor, coordinate the provision of such Services with the provision of those other patient care services provided to Hospice patients in furtherance of their individual plans of care and fulfill such other goals as identified by Hospice.

III. INDEPENDENT CONTRACTORS

In the performance of this Agreement it is mutually understood and agreed that the Contractor is at all times acting and performing as an independent contractor and not as an employee, joint venture or lessee of Hospice. Hospice shall neither have nor exercise any control or direction over the specific methods by which Contractor performs Services under this Agreement. The sole interest and responsibility of Hospice shall be to ensure that the services covered by this Agreement are rendered in a competent, efficient, and satisfactory manner by persons meeting the required qualifications and in accordance with the Hospice Patient's Plan of Care. Neither Contractor nor any of Contractors employees, contractors, or agents shall have any claim under this Agreement or otherwise against Hospice for workers' compensation, unemployment compensation, vacation pay, sick leave, retirement benefits, Social Security benefits, disability benefits, all of which shall be the sole responsibility of Contractor. Hospice shall not withhold on behalf of Contractor or any of Contractors employees, contractors, or agents any sums for income tax, unemployment insurance, Social Security, or otherwise pursuant to any law or requirement of any government agency, and all such withholding, if any is required, shall be the sole responsibility of Contractor. Contractor shall indemnify and hold harmless Hospice from any and all loss or liability, if any, arising with respect to any of the foregoing benefits or withholding requirements.

IV. HOSPICE RESPONSIBILITIES

A. Hospice shall be solely responsible for the admission of patients to the Hospice Program for the provision of Hospice Services, including, without limitation, Services furnished by the Contractor under this Agreement.
B. In accordance with the applicable federal and state laws. Hospice shall be responsible for the initial and ongoing assessments, development of each Hospice Patient's Plan of Care, and the coordination, supervision, and evaluation of all Services needed to fulfill such Plans of Care.
C. Hospice shall designate and make available the person(s) responsible for developing, reviewing, and revising the Plan of Care.
D. Hospice shall designate an on-call clinician familiar with the patient's Plan of Care to be available 24 hours a day to consult with Contractor.
E. The Hospice Patient Care Manager is responsible for the coordinations, supervisions and evaluations of care provided under this agreement.

V. COMPENSATION

5.01 Compensation
Hospice shall pay Contractor in accordance with the compensation methodology set forth in Schedule 1.

5.02 Monthly Report
In accordance with section 2.04 above, payment of the compensation described in section 5.01 is conditioned on Contractor maintaining Monthly Service Reports, Hospice's timely receipt of such Monthly Service Reports, and Hospice's reasonable verification of such Monthly Reports.

5.03 Billing for Services
Contractor shall assign to the Hospice all claims, demands, and right of Contractor to bill and collect for Services rendered to Hospice Patients under this Agreement for which Hospice has assumed responsibility for payment. Contractor shall bill Hospice within thirty (30) calendar days after the provision of Covered Services. Hospice shall remit payment to Contractor within thirty (30) calendar days after receipt of Contractor's claim for services for which Hospice has assumed responsibility for payment. Contractor shall bill and collect for Services rendered to Hospice Patients under this Agreement for which Hospice does not hold responsibility for payment.

VI. TERM AND TERMINATION

6.01 Term
The term of the Agreement shall commence on the date first written above, and shall continue in effect until {{date_of_expiration}}, unless terminated sooner pursuant to the terms of this Agreement.

6.02 Termination
This Agreement may be terminated by reason of any of the following:

A. Mutual Agreement
Mutual agreement of the parties

B. Material Breach
In the event of a material breach of this Agreement by any party hereto, the other party shall have the right to terminate this Agreement by service of written notice upon the defaulting party (the "Default Notice"). In the event such breach is not cured within thirty (30) days after service of the Default Notice, this Agreement may terminate at the election of the no defaulting party.

C. Termination for cause
Notwithstanding any other provision hereof, this agreement shall be automatically terminated in the event of
i. The revocation, suspension, nonrenewable, termination, or other restriction of the license, accreditation, or certification of Contractor;
ii. The indictment or conviction of Contractor of a felony or any crime involving moral turpitude;
iii. The cancellation, termination, or no renewal of Contractor's professional liability insurance; or
iv. The death or disability of Contractor for purposes of this Agreement, the term "disability" shall mean Contractor's inability to perform his or her duties under this Agreement with reasonable accommodation for three (3) consecutive months during the term of this Agreement due to illness, accident or other incapacities as determined in good faith by Hospice.

D. Termination for cause
Either party may terminate this Agreement without cause upon thirty (30) days prior written notice to the other party.

E. Special Termination
If (1) any legislation, regulations, rule or procedures are duly passed, adopted or implemented by any federal, state or local government or legislative body or any private agencies, or (2) Contractor or Hospice shall receive notice of any actual or threatened decision, finding or action by any governmental or private agency, court, or third parties (collectively referred to herein as "Action") which Action would result in the effect of, (1) revoking or jeopardizing the health license, certification or accreditation granted to Hospice; (2) revoking or jeopardizing the tax-exempt status of Hospice, its properties or any of its tax-exempt obligations, or imposing an unrelated business income tax on Hospice; or (3) subjecting Hospice or Contractor, or any of their employees or agents to civil or criminal prosecution, or other adverse proceedings on the basis of their participation herein, Contractor and Hospice shall attempt to amend this Agreement so as to avoid the Action. If the parties hereto, acting in good faith, are unable to meet the requirements of the agency, court, or third party in question, or if the parties determine in good faith that the compliance with such requirements is impossible or unfeasible, this Agreement shall be terminated. It is the intent of the parties that no party will terminate this Agreement in reliance on this subparagraph (e) unless the decision to terminate is based upon a reasonable concern. At the request of either party, the party requesting termination under this subparagraph (e) shall obtain written advice from legal counsel that substantiates the basis for the termination before exercising its right under this paragraph.

6.03 Effect of Termination
The expiration or earlier termination of this Agreement shall not release or discharge either party from any obligation, debt, or liability which shall have previously accrued and remain to be performed upon the date of expiration or termination.

VII. INSURANCE AND INDEMNIFICATION

7.01 Insurance
Contractor will maintain general liability insurance, including incidental professional liability, in the minimum amounts of $1,000,000 per occurrence and $3,000,000 annual aggregate. Contractor will immediately notify Hospice of any material changes in Contractor's insurance coverage and provide Hospice with a certificate of insurance annually. Said insurance shall not be materially adversely changed or canceled without at least thirty (30) days' written notice to the Hospice. Such cancellation or material change should be received by hospice via certified mail at its address specified in this Agreement. Hospice will maintain general liability insurance, including incidental professional liability, in the minimum amounts of $1,000,000 per occurrence and $3,000,000 annual aggregate. Hospice will immediately notify Contractor of any material changes in Hospice's insurance coverage and provide Contractor with a certificate of insurance annually. Said insurance shall not be materially adversely changed or canceled without at least thirty (30) days' written notice to the Contractor. Such cancellation or material change should be received by Contractor via certified mail at its address specified in the Agreement.

7.02 Indemnification
Each party shall indemnify, defend and hold harmless the other party from any and all liability, loss, claim, lawsuit, injury, cost, damage, or expense whatsoever (including reasonable attorney's fees and court costs) arising from any act or omission of such indemnifying party, or any of its employees, agents, contractors or subcontractors, during performance of any activities provided for this Agreement.

VIII. ACCESS TO BOOKS AND RECORDS

Pursuant to Section 952 of the Omnibus Budget Reconciliation Act of 1980, Public Law 696-499, as contained in Section 1861 (v)(1) of the Social Security Act, and implementing regulations at 42 C.F.R. Part 420, upon written request any time within four (4) Years after the rendering of Services under this Agreement. Contractor makes available to the Secretary of Health and Human Services or to the Controller General, or to any of their duly authorized representatives, access to this Agreement and to the books and records (Including all writings, transcripts, and tapes in any form) of Contractor as may be necessary to verify the nature and extent of the services furnished pursuant to this Agreement and the costs of such services. Contractor shall notify Hospice in writing of any such request and all materials described in such request within ten (10) calendar days after the receipt of such a request by Contractor.

IX. NON-SOLICITATION

During the term of this Agreement, Contractor shall not, without the prior written consent of Hospice, directly or indirectly, recruit, solicit or otherwise induce any employee or independent contractor of Hospice to discontinue such employment or independent contractor agreement with Hospice. Contractor acknowledges that a breach of this Section IX by Contractor shall be deemed to be a material injury to Hospice, the precise amount of which is not readily ascertainable in monetary damages, and that Hospice, in addition to any other remedies, shall be entitled to injunctive relief.

X. CONFIDENTIAL INFORMATION

Contractor recognizes and understands that, during the term of this Agreement, Contractor shall receive, have access to or otherwise become acquainted with various trade secrets, materials, and other proprietary information related to Hospice which is of a secret or confidential nature ("Confidential Information"). During and after the term of this Agreement, Contractor shall not use the Confidential Information for any purposes other than the performance of this Agreement, and shall not disclose such Confidential Information received by Contractor to any third party, without the prior written consent of Hospice. Contractor acknowledges that a breach of this Section X by Contractor will result in irreparable injury to Hospice, the precise amount of which is not readily ascertainable in monetary damages, and that Hospice, in addition to any other remedies, shall, be entitled to injunctive relief. The provision of the Agreement will not operate to waive or limit any restriction of release or disclosure of patient records as required by law.

XI. NOTICES

Any notice or other communication by either party to the other shall be in writing and shall be deemed to have been duly given on the date of delivery, if delivered in person to the party named below, or if delivered by certified or registered mail, postage prepaid, return receipt requested, or other reputable delivery services such as Federal Express, upon the date indicated on the return receipt if addressed as follows:

If to Hospice:
{{name_of_hospice}}
{{hospice_street_address}}
{{hospice_city_state_zip}}
{{hospice_phone}}

If to Contractor:
Home & Health Medical Supply
13112 Hadley St STE 110
Whittier, CA 90601
(562) 693-2800

Or to such other address, and to the attention of such other person as either party may designate in writing from time to time in accordance with this Section XI.

XII. ENTIRE AGREEMENT; AMENDMENTS

This Agreement supersedes and all other agreements, whether oral or written, between the parties with respect to the subject matter hereof and there are no representations, covenants or undertakings other than those expressly set forth in this Agreement. This Agreement may not be modified or amended except by a written document executed by both parties to this Agreement, and any such written modifications shall be attached hereto.

XIII. STATE LAW; SEVERABILITY

This Agreement shall be construed and governed by the laws of the State of California. In the event any provision of this Agreement is rendered invalid or unenforceable by the enactment of any applicable statute or ordinance or by any official action duly promulgated or is made or declared unenforceable by any court of competent jurisdiction, the remainder of this Agreement shall, subject to the following, remain in full force and effect. If such action, however, has the effect of materially altering the obligations of either part in such matter as, in the judgment of the party affected: (a) will cause financial hardship to such party, (b) will cause the party to act in violation of its corporate articles or bylaws or (c) will materially reduce the benefits of entering into this Agreement, the party so affected shall have the right to terminate this Agreement upon ten (10) days written notice to the other party.

XIV. CONFIDENTIALITY

Neither party shall disclose this Agreement nor any terms hereof to any third party accept as provided herein or accept as otherwise required by law, without the prior written consent of the other party. Notwithstanding anything in the Agreement to the contrary, Hospice shall not use contractors' name in any press releases, advertisements, trade shows, posters, or similar public announcements without Contractors' prior written consent.

The restrictions herein shall not apply with respect to Confidential information which (i) is already available to the public; (ii) becomes available to the public through no fault of the receiving party, its employees, or associates; (iii) s already known to the receiving party as shown by written records in the receiving parties possession at the time that the confidential information was received, provided that the source of such information was not bound by a confidentiality agreement with another party; or (iv) the receiving party is required to disclose by a governmental or judicial entity, provided that the receiving party notifies the disclosing party of the pending disclosure prior to such disclosure.

XV. NON-WAIVER

The waiver by either party of any breach of any term, covenant, or condition contained herein shall not be deemed to be a waiver of any subsequent breach of the same or any other term, covenant, or condition contained herein. The subsequent acceptance of performance hereunder by a party shall not be deemed to be a waiver of any preceding breach by the other party of any term, covenant, or condition of this agreement, other than the failure of such party to perform the particular duties so accepted, regardless of such parties knowledge of such preceding breach at the time of acceptance of such performance.

XVI. CAPTIONS

Any captions to or headings of the articles, sections, subsections, paragraphs, or subparagraphs of this Agreement are solely for the convenience of the parties, are not a part of this Agreement, and shall not be used for the interpretation or determination of validity of this Agreement or provision hereof.

XVII. TAX EXEMPT FINANCING

In the event Hospice intends to seek to obtain tax-exempt financing, Contractor agrees to amend this agreement as may be required to comply with the requirement or procedures set forth in the applicable guidelines or revenue procedures established by the Internal Revenue Service or other governmental agency with jurisdiction in order for Hospice to obtain and maintain the tax-exempt financing, including the necessary opinions from Hospice's bond counsel.

XVIII. CONFORMANCE TO THE FEDERAL ANTI-KICKBACK STATUE

It is in the intention of the parties that this Agreement complies in every respect with the provisions of the federal Anti-Kickback Statute (42 U.S.C. §1320a-7b), as well as related federal and state laws prohibiting and/or regulating patient referrals and payment arrangements among providers.

XIX. NO RECIPROCATION

The parties hereby acknowledge and agree that benefits provided to the parties hereunder neither require nor are in any way contingent upon the recommendation, referral or any other arrangement for the provision of any item of service offered by either party or its respective owners, members or employees. Nothing in this Agreement is intended to limit or restrict either party from referring any service to, or otherwise generating any business for any other person or entity.

XX. ASSIGNMENT

Contractor shall not assign any of his/her rights or delegate any of his or her duties under this Agreement without the prior written consent of Hospice, except, Contractor may assign this Agreement to a parent company or affiliate of Contractor with appropriate notification to Hospice as stated in Section XI (Notices) of this Agreement. Any unauthorized attempted assignment by Contractor shall be null and void and of no force or effect.

XXI. ARBITRATION AND ATTORNEYS' FEES

Any dispute between the parties concerning the subject matter of this Agreement shall be submitted to binding arbitration for resolution. Such arbitration shall be final, binding, and conducted in the County of Orange, California, before an arbitrator mutually selected by the parties from the Commercial Panel of the American Arbitration Association, and shall be conducted in accordance with the rules and regulations of the Commercial Panel of the American Arbitration Association then in effect; except that the parties shall be entitled to the same discovery rights normally available to parties involved in civil suits in Superior Court in Orange County. The parties to the arbitration shall share the costs of arbitration, although the parties agree that the arbitration shall have the discretion to award costs and reasonable attorney's fees to the prevailing party. Should any legal proceeding be commenced between the parties to this Agreement concerning the subject manner of this Agreement for the rights and duties of either in relationship thereto, the party prevailing in such proceeding shall be entitled, in addition to such other relief as may be granted, to a reasonable sum as and for such parties attorney's fees and court costs actually incurred and paid.

XXII. FORCE MAJEURE

Neither party shall be liable or deemed to be in default for any delay or failure in performance under this Agreement or other interruption of service or employment that results directly or indirectly, from: an Act of God; acts of civil or military authority; acts of public enemy, war; accidents; fires; explosions; earthquakes; floods; failure of transportation; machinery or supplies; vandalism; strikes or other work interruptions by Hospice's employees; or any similar or dissimilar causes beyond the reasonable control of either party. Both parties shall, however, make good faith efforts to perform under this Agreement in the event of any such circumstance.

XXIII. COUNTERPARTS

This Agreement may be executed in counterparts, each of which shall be deemed to be an original, and all of such counterparts shall together constitute one and the same Agreement.

ELIGIBILITY, AUTHORIZATIONS, OTHER RESPONSIBILITIES:

1. Eligibility, Benefit Determination, and Pre-Authorization are the responsibility of Payor.
2. All orders require specific prior authorization and re-authorization as mutually agreed to by Payor, which shall constitute obligation for payment. This includes reimbursement under Contractor for services provided to patients, as ordered by Payor, who do not sign on to Hospice.
3. Home & Health Medical Supply and Payor agree to further delineate accepted responsibilities as to procurement of physician orders, training, etc.

LOST/STOLEN/DAMAGED BEYOND REPAIR EQUIPMENT:

Should equipment or products be lost/stolen/damaged beyond repair by Payor's membership, and all efforts to recover same have been exhausted, Hospice shall compensate H&H Medical Supply at its discounted purchase default rate.

IN WITNESS WHEREOF, the parties hereto have caused this Agreement to be executed on the day and year first written above.

"Hospice"                                              "Contractor"

{{name_of_hospice}}                                    Home & Health Medical Supply
a California Corporation                               a California corporation

By: (signed above)                                     By: ___________________________
Name: {{signer_name}}                                  Name: _________________________
Title: {{signer_title}}                                Title: ________________________$doc$,
  $fields$[
    {"key":"date_of_contract","label":"Date of contract","type":"date"},
    {"key":"name_of_hospice","label":"Name of hospice","type":"text"},
    {"key":"hospice_street_address","label":"Hospice street address","type":"text"},
    {"key":"hospice_city_state_zip","label":"Hospice city, state, zip","type":"text"},
    {"key":"hospice_phone","label":"Hospice phone number","type":"text"},
    {"key":"date_of_expiration","label":"Date of expiration","type":"date"},
    {"key":"signer_name","label":"Signer's printed name","type":"text"},
    {"key":"signer_title","label":"Signer's title","type":"text"}
  ]$fields$::jsonb
);

-- Rebuild the public capability-link functions around the new shape.
drop function if exists submit_contract(text, text, text, text, text, text, date, boolean, text);

create or replace function submit_contract(
  p_token text,
  p_field_values jsonb,
  p_agreed boolean,
  p_signature_data_url text
)
returns service_contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  result service_contracts;
begin
  update service_contracts
  set field_values = p_field_values,
      agreed = p_agreed,
      signature_data_url = p_signature_data_url,
      status = 'completed',
      signed_at = now()
  where share_token = p_token and status = 'pending'
  returning * into result;

  if result.id is null then
    raise exception 'This contract link is invalid or has already been submitted.';
  end if;

  return result;
end;
$$;
grant execute on function submit_contract(text, jsonb, boolean, text) to anon, authenticated;
-- get_contract_by_token(text) is unchanged (still `select * from service_contracts
-- where share_token = p_token`) -- it picks up the new columns automatically.
