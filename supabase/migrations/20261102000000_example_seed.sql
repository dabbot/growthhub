-- Example data for the fictional company "Acme".
-- Fills the tables the dashboard reads that the earlier migrations create but do not seed.
-- Every Acme figure here is made up. Replace it with your own data.

INSERT INTO public.assumptions (key,label,value,default_value,min_value,max_value,step,unit,note,sort_order) VALUES
('active_card_rate','Cardholders active in the last 90 days',70,70,40,95,1,'%','Example value; share of cardholders with at least one transaction in 90 days.',8)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.score_bands (key,label,band,size_m,has_card,on_brand_m,note,badge,sort_order) VALUES
('800_plus','800 and above','Prime',14,true,3.2,'Highest-spending cardholders; most already have a bill-pay habit.','modeled',1),
('750_799','750 to 799','Prime',16,true,2.8,'Clears the gate; the core of the winnable base.','modeled',2),
('700_749','700 to 749','Near prime',12,true,0,'Within reach of the gate inside a year.','modeled',3),
('below_700','Below 700','Sub-prime',16,true,0,'Holds a card but well short of the gate.','modeled',4),
('prime_no_card','750+ without a card','Prime, no card',20,false,0,'Good score but no credit card yet — a future member once they get one.','modeled',5),
('thin_file','No score yet','New to credit',40,false,0,'No bureau history; not reachable by a score-gated product.','modeled',6);

INSERT INTO public.targetability_tiers (key,label,verdict,who,why,basis,share_pct,cost_to_win,play,badge,sort_order) VALUES
('low_hanging','Low hanging','Go now','Lapsed and credit-graduated 750+ cardholders who already know Acme','They have installed before or were turned away only by the gate.','addressable',30,'Low — push, email and re-invites','Re-invite and win-back','modeled',1),
('difficult','Difficult','Worth a campaign','Active 750+ cardholders paying in their bank app','Habit, not loyalty, keeps them there; they need a reason to switch.','addressable',45,'Medium — paid media plus a product hook','Bank-app switchers','modeled',2),
('impossible','Impossible today','Not yet','Cardholders below 700','They cannot pass the gate this year whatever the message.','cardholders',30,'High — credit-building first','Credit-building path','modeled',3),
('useless','Not worth chasing','Ignore','Dormant cards with no recent spend','Cards in force that nobody is using.','cards',40,'Very high','None','modeled',4);

INSERT INTO public.brand_monthly (month, mau_m, badge) VALUES
('2025-08-01',5.0,'modeled'),('2025-09-01',5.1,'modeled'),('2025-10-01',5.2,'modeled'),
('2025-11-01',5.3,'modeled'),('2025-12-01',5.3,'modeled'),('2026-01-01',5.4,'modeled'),
('2026-02-01',5.5,'modeled'),('2026-03-01',5.6,'modeled'),('2026-04-01',5.7,'modeled'),
('2026-05-01',5.8,'modeled'),('2026-06-01',5.9,'modeled'),('2026-07-01',6.0,'modeled');

INSERT INTO public.ad_campaigns (platform,campaign_name,format,offer,creative_note,landing_page,running_since,persona_target,offer_clarity,persona_fit,proof,cta,landing_match,verdict,fix,badge,sort_order) VALUES
('Meta','Pay bills, earn rewards','Single image','Rewards on every card bill','Product screenshot on a dark background, small text','Home page','Example','Metro multi-carder',3,4,2,3,3,'Clear offer, but no proof the rewards are worth anything.','Show a rupee value for a typical month of rewards.','modeled',1),
('Meta','Never miss a due date','Short video','Reminders for every card','Animated calendar, no voice-over','Reminders page','Example','Virgin prime',4,3,2,4,4,'Good hook for multi-card holders; weak on why to leave the bank app.','Lead with the hidden-charge saving, not the reminder.','modeled',2),
('Google','Credit card bill payment','Search','Pay any card bill in one app','Three headlines, generic description','Home page','Example','Bank-app switchers',4,3,1,3,2,'Lands on the home page instead of a bill-pay page.','Send search traffic to a dedicated bill-pay landing page.','modeled',3),
('Google','Check credit score','Search','Free credit score check','Two headlines, no mention of the 750 gate','Score page','Example','Credit-graduated',3,4,2,3,4,'Right intent, but hides that membership needs 750+.','Say the gate up front and offer the re-check.','modeled',4);

INSERT INTO public.marketing_plan_items (channel,audience,message,action,success_metric,priority,sort_order) VALUES
('Push and email','Lapsed prime','What has changed since you left','Send a what''s-new digest to installed lapsed members','Reactivation rate','now',1),
('SMS and WhatsApp','Credit-graduated','Your score crossed 750. You are in.','Soft-pull re-check and personal re-invite','Re-invite conversion','now',2),
('Google search','Bank-app switchers','One app for every card bill','Build a bill-pay landing page and move search traffic to it','Cost per new active','next',3),
('Meta','Metro multi-carder','Stop guessing which card to pay first','Test a multi-card due-date creative against the current one','Install-to-active rate','next',4),
('Vernacular video','PSU / tier-2 carder','Pay your card bill and get something back','Pilot regional-language creative in two states','Cost per 750+ active','later',5);

INSERT INTO public.assumption_provenance (key,label,value_text,source,derivation,confidence,replaces_with,sort_order) VALUES
('cards_per_holder','Cards per cardholder','2.1','Credit bureau reports','Cards in force divided by unique cardholders','high','Latest bureau release',1),
('prime_share','Share above 750','52%','Example estimate','Score-band mix applied to all cardholders','medium','Bureau score-band data',2),
('bank_app_overlap','Paying inside the bank app','58%','Example estimate','Assumed share of cardholders using the issuer app to pay','low','Your own survey or cohort data',3),
('upi_overlap','Paying via a UPI super-app','34%','Example estimate','Assumed share paying through a UPI app','low','Your own survey or cohort data',4),
('active_card_rate','Active cardholders','70%','Example estimate','Share of cardholders with a transaction in 90 days','medium','Bureau activity data',5);

UPDATE public.issuer_penetration
SET survey_brand_share_pct = ROUND(brand_penetration_pct * 0.9, 1),
    confidence = 'low',
    method_note = 'Example figure for the fictional Acme.';

-- Private bucket for AI-generated ad creatives (served through signed URLs).
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-creatives', 'campaign-creatives', false)
ON CONFLICT (id) DO NOTHING;
