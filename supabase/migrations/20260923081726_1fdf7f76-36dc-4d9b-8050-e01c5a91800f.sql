
CREATE TABLE public.issuers (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 100
);
GRANT SELECT ON public.issuers TO anon, authenticated;
GRANT ALL ON public.issuers TO service_role;
ALTER TABLE public.issuers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "issuers public read" ON public.issuers FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.issuer_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_slug TEXT NOT NULL REFERENCES public.issuers(slug) ON DELETE CASCADE,
  month DATE NOT NULL,
  cards_m NUMERIC NOT NULL,
  spend_cr NUMERIC NOT NULL,
  net_adds_12m_m NUMERIC,
  yoy_spend_pct NUMERIC,
  badge TEXT NOT NULL DEFAULT 'reported',
  UNIQUE (issuer_slug, month)
);
GRANT SELECT ON public.issuer_monthly TO anon, authenticated;
GRANT ALL ON public.issuer_monthly TO service_role;
ALTER TABLE public.issuer_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "issuer_monthly public read" ON public.issuer_monthly FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.market_metrics (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  badge TEXT NOT NULL,
  source TEXT NOT NULL,
  note TEXT,
  sort_order INT NOT NULL DEFAULT 100
);
GRANT SELECT ON public.market_metrics TO anon, authenticated;
GRANT ALL ON public.market_metrics TO service_role;
ALTER TABLE public.market_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_metrics public read" ON public.market_metrics FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.funnel_steps (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sublabel TEXT,
  value_m NUMERIC NOT NULL,
  badge TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'public',
  sort_order INT NOT NULL
);
GRANT SELECT ON public.funnel_steps TO anon, authenticated;
GRANT ALL ON public.funnel_steps TO service_role;
ALTER TABLE public.funnel_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "funnel_steps public read" ON public.funnel_steps FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.personas (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  who TEXT NOT NULL,
  size_m NUMERIC NOT NULL,
  primary_issuers TEXT NOT NULL,
  city_tier TEXT NOT NULL,
  cards_held NUMERIC NOT NULL,
  typical_spend TEXT NOT NULL,
  brand_status TEXT NOT NULL,
  penetration_pct NUMERIC NOT NULL,
  wants TEXT NOT NULL,
  channels TEXT NOT NULL,
  message TEXT NOT NULL,
  hooks TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 100
);
GRANT SELECT ON public.personas TO anon, authenticated;
GRANT ALL ON public.personas TO service_role;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personas public read" ON public.personas FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.persona_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_slug TEXT NOT NULL REFERENCES public.personas(slug) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  index_score NUMERIC NOT NULL,
  audience_size_m NUMERIC,
  UNIQUE (persona_slug, platform)
);
GRANT SELECT ON public.persona_platforms TO anon, authenticated;
GRANT ALL ON public.persona_platforms TO service_role;
ALTER TABLE public.persona_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "persona_platforms public read" ON public.persona_platforms FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.overlap_segments (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  value_m NUMERIC NOT NULL,
  badge TEXT NOT NULL DEFAULT 'modeled',
  sort_order INT NOT NULL DEFAULT 100
);
GRANT SELECT ON public.overlap_segments TO anon, authenticated;
GRANT ALL ON public.overlap_segments TO service_role;
ALTER TABLE public.overlap_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "overlap_segments public read" ON public.overlap_segments FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.issuer_penetration (
  issuer_slug TEXT PRIMARY KEY REFERENCES public.issuers(slug) ON DELETE CASCADE,
  brand_penetration_pct NUMERIC NOT NULL,
  prime_share_pct NUMERIC NOT NULL,
  badge TEXT NOT NULL DEFAULT 'modeled'
);
GRANT SELECT ON public.issuer_penetration TO anon, authenticated;
GRANT ALL ON public.issuer_penetration TO service_role;
ALTER TABLE public.issuer_penetration ENABLE ROW LEVEL SECURITY;
CREATE POLICY "issuer_penetration public read" ON public.issuer_penetration FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.upi_share (
  app TEXT PRIMARY KEY,
  share_pct NUMERIC NOT NULL,
  month DATE NOT NULL,
  sort_order INT NOT NULL DEFAULT 100
);
GRANT SELECT ON public.upi_share TO anon, authenticated;
GRANT ALL ON public.upi_share TO service_role;
ALTER TABLE public.upi_share ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upi_share public read" ON public.upi_share FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.plays (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  segment TEXT NOT NULL,
  lever TEXT NOT NULL,
  channel TEXT NOT NULL,
  owner TEXT NOT NULL,
  reach_m NUMERIC NOT NULL,
  conversion_pct NUMERIC NOT NULL,
  effort INT NOT NULL,
  impact INT NOT NULL,
  rationale TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 100
);
GRANT SELECT ON public.plays TO anon, authenticated;
GRANT ALL ON public.plays TO service_role;
ALTER TABLE public.plays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plays public read" ON public.plays FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.assumptions (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  value NUMERIC NOT NULL,
  default_value NUMERIC NOT NULL,
  min_value NUMERIC NOT NULL,
  max_value NUMERIC NOT NULL,
  step NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL,
  note TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 100
);
GRANT SELECT ON public.assumptions TO anon, authenticated;
GRANT ALL ON public.assumptions TO service_role;
ALTER TABLE public.assumptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assumptions public read" ON public.assumptions FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.sources (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  what_it_gives TEXT NOT NULL,
  cadence TEXT NOT NULL,
  feeds TEXT NOT NULL,
  refreshed_on DATE NOT NULL,
  badge TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 100
);
GRANT SELECT ON public.sources TO anon, authenticated;
GRANT ALL ON public.sources TO service_role;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sources public read" ON public.sources FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL
);
GRANT SELECT ON public.changelog TO anon, authenticated;
GRANT ALL ON public.changelog TO service_role;
ALTER TABLE public.changelog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "changelog public read" ON public.changelog FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.issuers (slug, name, category, sort_order) VALUES
('hdfc','HDFC Bank','Private',1),
('sbi','SBI Card','PSU',2),
('icici','ICICI Bank','Private',3),
('axis','Axis Bank','Private',4),
('kotak','Kotak Mahindra','Private',5),
('indusind','IndusInd Bank','Private',6),
('rbl','RBL Bank','Private',7),
('idfc','IDFC First Bank','Private',8),
('bob','Bank of Baroda','PSU',9),
('yes','Yes Bank','Private',10),
('amex','American Express','Foreign',11),
('sc','Standard Chartered','Foreign',12),
('federal','Federal Bank','Private',13),
('canara','Canara Bank','PSU',14),
('pnb','Punjab National Bank','PSU',15),
('au','AU Small Finance Bank','Small Finance',16);

INSERT INTO public.issuer_monthly (issuer_slug, month, cards_m, spend_cr, net_adds_12m_m, yoy_spend_pct, badge) VALUES
('hdfc','2026-07-01',26.97,60218,2.40,11.9,'reported'),
('sbi','2026-07-01',22.76,39592,2.90,21.6,'reported'),
('icici','2026-07-01',19.69,34025,0.85,-5.9,'reported'),
('axis','2026-07-01',16.26,23825,0.70,4.6,'reported'),
('kotak','2026-07-01',6.12,7450,0.35,8.2,'reported'),
('indusind','2026-07-01',6.02,7180,0.28,6.4,'reported'),
('rbl','2026-07-01',5.42,6920,0.22,3.1,'reported'),
('idfc','2026-07-01',3.51,3240,0.41,18.7,'reported'),
('bob','2026-07-01',4.08,2610,0.30,9.8,'reported'),
('yes','2026-07-01',3.10,3080,0.18,7.2,'reported'),
('amex','2026-07-01',1.62,4210,0.05,12.4,'reported'),
('sc','2026-07-01',1.04,2140,0.02,2.8,'reported'),
('federal','2026-07-01',1.58,1210,0.14,14.1,'reported'),
('canara','2026-07-01',1.49,690,0.09,5.5,'reported'),
('pnb','2026-07-01',1.12,520,0.06,4.0,'reported'),
('au','2026-07-01',1.02,880,0.16,22.3,'reported');

INSERT INTO public.issuer_monthly (issuer_slug, month, cards_m, spend_cr, badge) VALUES
('hdfc','2019-07-01',13.10,19800,'reported'),
('hdfc','2021-07-01',15.10,24900,'reported'),
('hdfc','2023-07-01',18.50,38400,'reported'),
('hdfc','2025-07-01',24.10,53800,'reported'),
('sbi','2019-07-01',9.00,11100,'reported'),
('sbi','2021-07-01',12.10,15600,'reported'),
('sbi','2023-07-01',17.30,24800,'reported'),
('sbi','2025-07-01',20.60,32600,'reported'),
('icici','2019-07-01',7.20,9200,'reported'),
('icici','2021-07-01',10.60,13800,'reported'),
('icici','2023-07-01',14.60,23100,'reported'),
('icici','2025-07-01',18.40,36200,'reported'),
('axis','2019-07-01',6.30,7100,'reported'),
('axis','2021-07-01',8.20,9400,'reported'),
('axis','2023-07-01',12.40,15600,'reported'),
('axis','2025-07-01',15.30,22800,'reported'),
('kotak','2019-07-01',1.70,1900,'reported'),
('kotak','2021-07-01',2.30,2600,'reported'),
('kotak','2023-07-01',4.60,5100,'reported'),
('kotak','2025-07-01',5.80,6900,'reported'),
('rbl','2019-07-01',2.30,3100,'reported'),
('rbl','2021-07-01',3.00,3900,'reported'),
('rbl','2023-07-01',4.30,5600,'reported'),
('rbl','2025-07-01',5.20,6700,'reported'),
('idfc','2019-07-01',0.10,90,'reported'),
('idfc','2021-07-01',0.40,320,'reported'),
('idfc','2023-07-01',1.60,1400,'reported'),
('idfc','2025-07-01',2.90,2700,'reported');

INSERT INTO public.market_metrics (key,label,value,unit,badge,source,note,sort_order) VALUES
('cards_in_force','Credit cards in force',121.6,'M','reported','RBI, Jun 2026','Cards, not people — RBI counts cards per bank.',1),
('monthly_spend','Monthly card spend',2.08,'trn','reported','RBI, Jul 2026','Total credit card spend across all issuers, in rupees.',2),
('cardholders','Unique cardholders',52,'M','reported','CIBIL, Mar 2026','At roughly 2.1 cards per holder.',3),
('brand_active','Acme active members',6,'M','modeled','Example figure',
 'Fictional company figure; replace with your own active count.',4);

INSERT INTO public.funnel_steps (key,label,sublabel,value_m,badge,tone,sort_order) VALUES
('cards','Credit cards in force','RBI, Jun 2026',121.6,'reported','public',1),
('holders','Unique cardholders','CIBIL, Mar 2026 (~2.1 cards each)',52,'reported','public',2),
('installed','Acme ever installed','example figure',20,'modeled','brand',3),
('gate','Cleared the 750 gate','example figure',14,'modeled','brand',4),
('still','Still installed','example figure',9,'modeled','brand',5),
('active','Active members','example figure',6,'modeled','brand',6);

INSERT INTO public.personas (slug,name,who,size_m,primary_issuers,city_tier,cards_held,typical_spend,brand_status,penetration_pct,wants,channels,message,hooks,sort_order) VALUES
('metro-multicarder','Metro multi-carder','3+ cards, metro, ₹25L+ household income',8,'HDFC, Amex, Axis','Tier 1',3.4,'₹85,000/mo','Mostly active',45,'One place to see every due date and reward',
 'Instagram, LinkedIn, YouTube, Zerodha/Groww','You are juggling four cards. Stop guessing which one to pay first.','Multi-card due-date view, reward optimiser, hidden-charge detection',1),
('virgin-prime','Virgin prime','750+, never installed Acme',10,'SBI Card, ICICI, Kotak','Tier 1 & 2',1.8,'₹32,000/mo','Never installed',0,'A reason to leave the bank app',
 'YouTube, Meta, Amazon, Flipkart','Your bank app pays the bill. It does not tell you what it costs you.','Hidden-charge detection, statement parsing, rewards on bill pay',2),
('lapsed-prime','Lapsed prime','Installed once, gone 6+ months',8,'HDFC, ICICI, Axis','Tier 1 & 2',2.4,'₹46,000/mo','Lapsed',0,'Proof something changed since they left',
 'Meta custom audiences, email, push','You left when Acme was a bill reminder. It is a lot more now.','What''s new digest, reactivation rewards, UPI on credit',3),
('credit-graduated','Credit-graduated','Rejected under 750, now above it',5,'SBI Card, IDFC, AU','Tier 2 & 3',1.5,'₹21,000/mo','Rejected earlier',0,'To be told they are in',
 'SMS, WhatsApp, Meta, vernacular YouTube','Your score crossed 750. You are in.','Soft-pull re-check, personalised re-invite, credit-building tracker',4),
('psu-tier2','PSU / tier-2 carder','SBI and PSU bank cards outside metros',9,'SBI Card, BoB, Canara, PNB','Tier 2 & 3',1.4,'₹14,500/mo','Rarely reached',4,'A product that speaks their language',
 'Vernacular YouTube, ShareChat, WhatsApp, SMS','Pay your SBI card bill and actually get something back.','Vernacular UI, SBI-specific reminders, UPI on credit',5),
('cobrand-shopper','Co-brand shopper','Shopping, food and travel co-brand cards',5,'ICICI, Axis, HDFC','Tier 1 & 2',2.1,'₹38,000/mo','Loyal to the partner app',12,'More value on spend they already make',
 'Amazon, Flipkart, Swiggy, Myntra','Earn Acme rewards on top of your co-brand card rewards.','Reward stacking, partner offers, spend analytics by merchant',6),
('young-high-earner','Young high earner','₹15-35L CTC, first card in last 2 years',3,'Axis, IDFC, Kotak','Tier 1',1.2,'₹27,000/mo','Thin file, may miss the gate',15,'A credit-building path, not a velvet rope',
 'Instagram, LinkedIn, YouTube, Zerodha/Groww','Build the score that gets you the card you actually want.','Credit-building path, UPI on credit, score coaching',7);

INSERT INTO public.persona_platforms (persona_slug, platform, index_score, audience_size_m) VALUES
('metro-multicarder','Swiggy/Zomato',178,7.4),('metro-multicarder','Amazon',165,8.0),('metro-multicarder','Flipkart',102,6.1),('metro-multicarder','Myntra',141,4.9),('metro-multicarder','MakeMyTrip',188,3.6),('metro-multicarder','Uber',172,5.2),('metro-multicarder','Zerodha/Groww',195,4.4),('metro-multicarder','LinkedIn',186,5.8),('metro-multicarder','Instagram',132,7.9),('metro-multicarder','YouTube',108,8.3),('metro-multicarder','Tata Neu',124,2.8),
('virgin-prime','Swiggy/Zomato',118,7.8),('virgin-prime','Amazon',134,9.6),('virgin-prime','Flipkart',128,9.1),('virgin-prime','Myntra',112,6.2),('virgin-prime','MakeMyTrip',96,3.1),('virgin-prime','Uber',88,4.0),('virgin-prime','Zerodha/Groww',104,3.4),('virgin-prime','LinkedIn',97,4.1),('virgin-prime','Instagram',121,9.8),('virgin-prime','YouTube',126,10.4),('virgin-prime','Tata Neu',109,3.6),
('lapsed-prime','Swiggy/Zomato',146,6.6),('lapsed-prime','Amazon',142,7.7),('lapsed-prime','Flipkart',119,6.4),('lapsed-prime','Myntra',124,4.6),('lapsed-prime','MakeMyTrip',131,2.8),('lapsed-prime','Uber',128,3.9),('lapsed-prime','Zerodha/Groww',137,3.1),('lapsed-prime','LinkedIn',133,3.7),('lapsed-prime','Instagram',139,8.0),('lapsed-prime','YouTube',115,8.3),('lapsed-prime','Tata Neu',101,2.1),
('credit-graduated','Swiggy/Zomato',84,2.9),('credit-graduated','Amazon',96,4.4),('credit-graduated','Flipkart',138,5.2),('credit-graduated','Myntra',89,2.2),('credit-graduated','MakeMyTrip',62,0.9),('credit-graduated','Uber',71,1.6),('credit-graduated','Zerodha/Groww',77,1.3),('credit-graduated','LinkedIn',64,1.1),('credit-graduated','Instagram',127,5.4),('credit-graduated','YouTube',148,5.7),('credit-graduated','Tata Neu',93,1.5),
('psu-tier2','Swiggy/Zomato',71,3.6),('psu-tier2','Amazon',88,6.1),('psu-tier2','Flipkart',151,8.2),('psu-tier2','Myntra',83,3.4),('psu-tier2','MakeMyTrip',58,1.2),('psu-tier2','Uber',54,1.8),('psu-tier2','Zerodha/Groww',66,1.9),('psu-tier2','LinkedIn',49,1.3),('psu-tier2','Instagram',118,7.8),('psu-tier2','YouTube',156,9.1),('psu-tier2','Tata Neu',87,2.4),
('cobrand-shopper','Swiggy/Zomato',192,4.1),('cobrand-shopper','Amazon',204,5.2),('cobrand-shopper','Flipkart',187,4.6),('cobrand-shopper','Myntra',168,3.3),('cobrand-shopper','MakeMyTrip',112,1.5),('cobrand-shopper','Uber',126,2.2),('cobrand-shopper','Zerodha/Groww',98,1.2),('cobrand-shopper','LinkedIn',103,1.6),('cobrand-shopper','Instagram',144,4.4),('cobrand-shopper','YouTube',109,4.6),('cobrand-shopper','Tata Neu',148,2.0),
('young-high-earner','Swiggy/Zomato',186,3.2),('young-high-earner','Amazon',151,3.0),('young-high-earner','Flipkart',109,2.2),('young-high-earner','Myntra',158,2.4),('young-high-earner','MakeMyTrip',134,1.1),('young-high-earner','Uber',177,2.1),('young-high-earner','Zerodha/Groww',212,2.5),('young-high-earner','LinkedIn',198,2.7),('young-high-earner','Instagram',167,3.3),('young-high-earner','YouTube',121,3.3),('young-high-earner','Tata Neu',96,0.8);

INSERT INTO public.overlap_segments (key,label,description,value_m,badge,sort_order) VALUES
('bank_only','Bank app only','Pays the card bill inside the issuer''s own app',22,'modeled',1),
('upi_only','UPI super-app only','Pays through a UPI super-app, never opens Acme',13,'modeled',2),
('brand_only','Acme only','Uses Acme as the single bill-pay surface',2.5,'modeled',3),
('bank_upi','Bank app + UPI app','Splits bill pay between the bank and a UPI app',7,'modeled',4),
('bank_brand','Bank app + Acme','Checks Acme but still pays some bills in the bank app',2,'modeled',5),
('upi_brand','UPI app + Acme','Moves between a UPI app and Acme',1,'modeled',6),
('all_three','All three','Uses bank app, UPI app and Acme',0.5,'modeled',7);

INSERT INTO public.issuer_penetration (issuer_slug, brand_penetration_pct, prime_share_pct) VALUES
('hdfc',22,62),('sbi',8,38),('icici',18,54),('axis',16,51),('kotak',14,49),
('indusind',12,46),('rbl',6,31),('idfc',10,42),('bob',4,29),('yes',9,40),
('amex',30,86),('sc',20,68),('federal',7,37),('canara',3,26),('pnb',2,24),('au',5,28);

INSERT INTO public.upi_share (app, share_pct, month, sort_order) VALUES
('PhonePe',46.3,'2026-05-01',1),('Google Pay',32.8,'2026-05-01',2),('Paytm',7.9,'2026-05-01',3),
('Navi',3.6,'2026-05-01',4),('super.money',1.8,'2026-05-01',5),('Others',7.6,'2026-05-01',6);

INSERT INTO public.plays (slug,name,segment,lever,channel,owner,reach_m,conversion_pct,effort,impact,rationale,sort_order) VALUES
('credit-graduated-reinvite','Credit-graduated re-invite','Credit-graduated','Soft-pull re-check and personal "you''re in" message','SMS, WhatsApp, push','Growth',5,14,2,4,'They already wanted in and were turned away; the only barrier left is knowing they qualify.',1),
('lapsed-winback','Lapsed win-back','Lapsed prime','"What''s new" creative to uninstall cohorts','Meta custom audiences','Growth',8,7,2,4,'Cheapest addressable pool: they installed once and the product has changed since.',2),
('sbi-push','SBI Card push','PSU / tier-2 carder','Vernacular creative and SBI-specific reminders','Vernacular YouTube, ShareChat','Marketing',9,5,3,4,'SBI is the fastest-growing card base and Acme''s weakest penetration.',3),
('cobrand-stacking','Co-brand stacking','Co-brand shopper','Stack Acme rewards on co-brand spend','Partner apps, in-app','Product',5,11,3,3,'Loyalty sits with the partner, not the issuer — ride it instead of fighting it.',4),
('bank-app-switchers','Bank-app switchers','Virgin prime','Multi-card due-date view and hidden-charge detection','Product, YouTube, Meta','Product',10,4,4,5,'The largest pool is habit, not loyalty — it needs a switching reason before media.',5),
('young-earner-path','Young high earner path','Young high earner','Credit-building path and UPI on credit','Instagram, LinkedIn','Product',3,16,3,3,'Thin files fail the gate today and become prime members within two years.',6);

INSERT INTO public.assumptions (key,label,value,default_value,min_value,max_value,step,unit,note,sort_order) VALUES
('cards_per_holder','Cards per cardholder',2.1,2.1,1.5,3.0,0.1,'x','CIBIL average; drives the cards-to-people conversion on every screen.',1),
('prime_share','Share of cardholders above 750',52,52,30,80,1,'%','Modeled from CIBIL score bands and issuer mix.',2),
('bank_app_overlap','Cardholders paying inside the bank app',58,58,30,85,1,'%','Example value; the weakest number on the dashboard until your own cohort data lands.',3),
('upi_overlap','Cardholders paying via a UPI super-app',34,34,10,70,1,'%','Example value; replace with your own bill-pay channel research.',4),
('reinvite_conversion','Re-invite conversion',14,14,2,40,1,'%','Share of a re-invited cohort that becomes active within a quarter.',5),
('winback_conversion','Win-back conversion',7,7,1,25,1,'%','Share of a lapsed cohort reactivated by a campaign.',6),
('acquisition_conversion','Cold acquisition conversion',4,4,0.5,15,0.5,'%','Share of newly reached cardholders that become active.',7);

INSERT INTO public.sources (key,name,what_it_gives,cadence,feeds,refreshed_on,badge,sort_order) VALUES
('rbi_bankwise','RBI bank-wise ATM/POS/Card statistics','Credit cards outstanding, PoS and e-com volume and value per bank','Monthly','Screens 1, 2','2026-07-01','reported',1),
('rbi_entitywise','RBI entity-wise UPI / BBPS statistics','Bill-pay and UPI volumes by operating unit','Monthly','Screen 4','2026-07-01','reported',2),
('rbi_ppi','RBI PPI statistics and NEFT bank-wise','Wallet usage; NEFT as a proxy for bank-app bill-pay intensity','Monthly','Screen 4 (context)','2026-07-01','reported',3),
('npci','NPCI UPI ecosystem statistics','App-wise UPI share','Monthly','Screen 4','2026-05-01','reported',4),
('cibil','TransUnion CIBIL reports','Unique cardholders, cards per holder, delinquency','Quarterly','Screens 1, 3','2026-03-01','reported',5),
('survey','Primary survey (example)','Bill-pay channel, apps used, issuer, income, Acme status','Quarterly','Screens 3, 4, 5','2026-06-01','modeled',6),
('ad_planners','Meta / Google ad planners','Audience sizes per persona spec','On demand','Screens 5, 6','2026-07-01','modeled',7),
('internal_data','Your company data','Cohort totals by issuer and city tier, uploaded on the Upload screen','Monthly','Screens 1, 3, 4','2026-07-01','modeled',8);

INSERT INTO public.changelog (entry_date,title,detail) VALUES
('2026-07-15','July 2026 RBI refresh','Bank-wise card and spend figures updated; HDFC crosses 26.9M cards, SBI Card net adds lead the market.'),
('2026-05-20','NPCI May share','UPI app share updated: PhonePe 46.3%, Google Pay 32.8%.'),
('2026-03-31','CIBIL cardholder base','Unique cardholders revised to 52M at ~2.1 cards each.');
