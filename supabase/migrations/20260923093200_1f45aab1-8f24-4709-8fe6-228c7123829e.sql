CREATE TABLE public.segment_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment text NOT NULL,
  dimension text NOT NULL,
  bucket text NOT NULL,
  share_pct numeric NOT NULL,
  badge text NOT NULL DEFAULT 'modeled',
  note text,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (segment, dimension, bucket)
);

GRANT SELECT ON public.segment_profiles TO anon;
GRANT SELECT ON public.segment_profiles TO authenticated;
GRANT ALL ON public.segment_profiles TO service_role;

ALTER TABLE public.segment_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read segment profiles"
  ON public.segment_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.segment_profiles (segment, dimension, bucket, share_pct, badge, note, sort_order) VALUES
('active','card_ownership','No credit card',0,'modeled','Membership requires a card on file, so this is zero by definition.',1),
('active','card_ownership','One card',22,'modeled','Example split of active members.',2),
('active','card_ownership','Two cards',36,'modeled','Example split of active members.',3),
('active','card_ownership','Three or more',42,'modeled','Heavy multi-card holders are over-represented among actives.',4),
('active','credit_score','Below 700',0,'modeled','Cannot be an active member below the gate.',1),
('active','credit_score','700 to 749',0,'modeled','Cannot be an active member below the gate.',2),
('active','credit_score','750 to 799',46,'modeled','CIBIL band mix applied to the active base.',3),
('active','credit_score','800 plus',54,'modeled','CIBIL band mix applied to the active base.',4),
('active','engagement','Opens weekly',48,'modeled','Example figure.',1),
('active','engagement','Opens monthly',35,'modeled','Example figure.',2),
('active','engagement','Quiet 90 days plus',17,'modeled','At risk of sliding into the lapsed group.',3),
('active','engagement','Uninstalled',0,'modeled','Uninstalled members are counted as lapsed, not active.',4),

('lapsed','card_ownership','No credit card',4,'modeled','Closed or never replaced a card after lapsing.',1),
('lapsed','card_ownership','One card',31,'modeled','Example split of lapsed members.',2),
('lapsed','card_ownership','Two cards',39,'modeled','Example split of lapsed members.',3),
('lapsed','card_ownership','Three or more',26,'modeled','Fewer heavy multi-card holders than the active group.',4),
('lapsed','credit_score','Below 700',11,'modeled','Cleared the gate once and has since slipped below it.',1),
('lapsed','credit_score','700 to 749',17,'modeled','Slipped below the 750 gate since joining.',2),
('lapsed','credit_score','750 to 799',44,'modeled','Still clears the gate today.',3),
('lapsed','credit_score','800 plus',28,'modeled','Still clears the gate today, prime and winnable.',4),
('lapsed','engagement','Opens weekly',0,'modeled','Weekly openers are counted as active.',1),
('lapsed','engagement','Opens monthly',9,'modeled','Occasional openers on the edge of coming back.',2),
('lapsed','engagement','Quiet 90 days plus',34,'modeled','App still installed, reachable by push.',3),
('lapsed','engagement','Uninstalled',57,'modeled','Reachable only by paid media, email or SMS.',4),

('not_qualified','card_ownership','No credit card',46,'modeled','Applied or installed without ever holding a card.',1),
('not_qualified','card_ownership','One card',38,'modeled','Single entry-level card, often a co-brand.',2),
('not_qualified','card_ownership','Two cards',13,'modeled','Example split of rejected installs.',3),
('not_qualified','card_ownership','Three or more',3,'modeled','Rare in this group.',4),
('not_qualified','credit_score','Below 700',58,'modeled','Well short of the gate today.',1),
('not_qualified','credit_score','700 to 749',22,'modeled','Within reach of the gate inside a year.',2),
('not_qualified','credit_score','750 to 799',16,'modeled','Has since crossed the gate and can be re-invited now.',3),
('not_qualified','credit_score','800 plus',4,'modeled','Has since crossed the gate and can be re-invited now.',4),
('not_qualified','engagement','Opens weekly',0,'modeled','Never got past the gate screen.',1),
('not_qualified','engagement','Opens monthly',6,'modeled','Still checks in occasionally.',2),
('not_qualified','engagement','Quiet 90 days plus',21,'modeled','App still installed, reachable by push.',3),
('not_qualified','engagement','Uninstalled',73,'modeled','Reachable only by paid media, email or SMS.',4);