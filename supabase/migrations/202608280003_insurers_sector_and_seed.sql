-- IRDAI-regulated Indian insurers, grouped by regulatory sector.
-- Logo files are served by Next.js from public/insurer-logos.
alter table public.insurers add column if not exists sector text;

do $$ begin
  alter table public.insurers add constraint insurers_sector_check
    check (sector in ('life', 'general', 'health'));
exception when duplicate_object then null;
end $$;

create index if not exists insurers_sector_active_idx
  on public.insurers(sector, active, name);

insert into public.insurers(name, slug, sector, logo_url, website_url, description, active)
values
  -- Life insurers
  ('Life Insurance Corporation of India','life-insurance-corporation-of-india','life','/insurer-logos/life-insurance-corporation-of-india.webp','https://www.licindia.in/','Life insurer regulated by IRDAI.',true),
  ('Axis Max Life Insurance Limited','axis-max-life-insurance','life','/insurer-logos/axis-max-life-insurance.webp','https://www.axismaxlife.com/','Life insurer regulated by IRDAI.',true),
  ('HDFC Life Insurance Company Limited','hdfc-life-insurance','life','/insurer-logos/hdfc-life-insurance.webp','https://www.hdfclife.com/','Life insurer regulated by IRDAI.',true),
  ('ICICI Prudential Life Insurance Company Limited','icici-prudential-life-insurance','life','/insurer-logos/icici-prudential-life-insurance.webp','https://www.iciciprulife.com/','Life insurer regulated by IRDAI.',true),
  ('Kotak Mahindra Life Insurance Company Limited','kotak-mahindra-life-insurance','life','/insurer-logos/kotak-mahindra-life-insurance.webp','https://www.kotaklife.com/','Life insurer regulated by IRDAI.',true),
  ('Aditya Birla Sun Life Insurance Company Limited','aditya-birla-sun-life-insurance','life','/insurer-logos/aditya-birla-sun-life-insurance.webp','https://lifeinsurance.adityabirlacapital.com/','Life insurer regulated by IRDAI.',true),
  ('Tata AIA Life Insurance Company Limited','tata-aia-life-insurance','life','/insurer-logos/tata-aia-life-insurance.webp','https://www.tataaia.com/','Life insurer regulated by IRDAI.',true),
  ('SBI Life Insurance Company Limited','sbi-life-insurance','life','/insurer-logos/sbi-life-insurance.webp','https://www.sbilife.co.in/','Life insurer regulated by IRDAI.',true),
  ('Bajaj Life Insurance Limited','bajaj-life-insurance','life','/insurer-logos/bajaj-life-insurance.webp','https://www.bajajlifeinsurance.com/','Life insurer regulated by IRDAI.',true),
  ('PNB MetLife India Insurance Company Limited','pnb-metlife-india-insurance','life','/insurer-logos/pnb-metlife-india-insurance.webp','https://www.pnbmetlife.com/','Life insurer regulated by IRDAI.',true),
  ('IndusInd Nippon Life Insurance Company Limited','indusind-nippon-life-insurance','life','/insurer-logos/indusind-nippon-life-insurance.webp','https://www.indusindnipponlife.com/','Life insurer regulated by IRDAI.',true),
  ('Aviva Life Insurance Company India Limited','aviva-life-insurance-india','life','/insurer-logos/aviva-life-insurance-india.webp','https://www.avivaindia.com/','Life insurer regulated by IRDAI.',true),
  ('Sahara India Life Insurance Company Limited','sahara-india-life-insurance','life','/insurer-logos/sahara-india-life-insurance.webp','https://www.saharalife.com/','Life insurer regulated by IRDAI.',true),
  ('Shriram Life Insurance Company Limited','shriram-life-insurance','life','/insurer-logos/shriram-life-insurance.webp','https://www.shriramlife.com/','Life insurer regulated by IRDAI.',true),
  ('Bharti Life Insurance Company Limited','bharti-life-insurance','life','/insurer-logos/bharti-life-insurance.webp','https://www.bhartiaxa.com/','Life insurer regulated by IRDAI.',true),
  ('Generali Central Life Insurance Company Limited','generali-central-life-insurance','life','/insurer-logos/generali-central-life-insurance.webp','https://www.generalicentrallife.com/','Life insurer regulated by IRDAI.',true),
  ('Ageas Federal Life Insurance Company Limited','ageas-federal-life-insurance','life','/insurer-logos/ageas-federal-life-insurance.webp','https://www.ageasfederal.com/','Life insurer regulated by IRDAI.',true),
  ('Canara HSBC Life Insurance Company Limited','canara-hsbc-life-insurance','life','/insurer-logos/canara-hsbc-life-insurance.webp','https://www.canarahsbclife.com/','Life insurer regulated by IRDAI.',true),
  ('Bandhan Life Insurance Limited','bandhan-life-insurance','life','/insurer-logos/bandhan-life-insurance.webp','https://www.bandhanlife.com/','Life insurer regulated by IRDAI.',true),
  ('Pramerica Life Insurance Company Limited','pramerica-life-insurance','life','/insurer-logos/pramerica-life-insurance.webp','https://www.pramericalife.in/','Life insurer regulated by IRDAI.',true),
  ('Star Union Dai-ichi Life Insurance Company Limited','star-union-dai-ichi-life-insurance','life','/insurer-logos/star-union-dai-ichi-life-insurance.webp','https://www.sudlife.in/','Life insurer regulated by IRDAI.',true),
  ('IndiaFirst Life Insurance Company Limited','indiafirst-life-insurance','life','/insurer-logos/indiafirst-life-insurance.webp','https://www.indiafirstlife.com/','Life insurer regulated by IRDAI.',true),
  ('Edelweiss Life Insurance Company Limited','edelweiss-life-insurance','life','/insurer-logos/edelweiss-life-insurance.webp','https://www.edelweisslife.in/','Life insurer regulated by IRDAI.',true),
  ('CreditAccess Life Insurance Limited','creditaccess-life-insurance','life','/insurer-logos/creditaccess-life-insurance.webp','https://www.creditaccesslife.in/','Life insurer regulated by IRDAI.',true),
  ('Acko Life Insurance Limited','acko-life-insurance','life','/insurer-logos/acko-life-insurance.webp','https://www.acko.com/life-insurance/','Life insurer regulated by IRDAI.',true),
  ('Go Digit Life Insurance Limited','go-digit-life-insurance','life','/insurer-logos/go-digit-life-insurance.webp','https://www.godigit.com/life/','Life insurer regulated by IRDAI.',true),

  -- General insurers
  ('Acko General Insurance Limited','acko-general-insurance','general','/insurer-logos/acko-general-insurance.webp','https://www.acko.com/','General insurer regulated by IRDAI.',true),
  ('Agriculture Insurance Company of India Limited','agriculture-insurance-company-of-india','general','/insurer-logos/agriculture-insurance-company-of-india.webp','https://www.aicofindia.com/','General insurer regulated by IRDAI.',true),
  ('Bajaj Allianz General Insurance Company Limited','bajaj-allianz-general-insurance','general','/insurer-logos/bajaj-allianz-general-insurance.webp','https://www.bajajallianz.com/','General insurer regulated by IRDAI.',true),
  ('Cholamandalam MS General Insurance Company Limited','cholamandalam-ms-general-insurance','general','/insurer-logos/cholamandalam-ms-general-insurance.webp','https://www.cholainsurance.com/','General insurer regulated by IRDAI.',true),
  ('ECGC Limited','ecgc','general','/insurer-logos/ecgc.webp','https://www.ecgc.in/','Specialised general insurer regulated by IRDAI.',true),
  ('Generali Central Insurance Company Limited','generali-central-insurance','general','/insurer-logos/generali-central-insurance.webp','https://www.generalicentralinsurance.com/','General insurer regulated by IRDAI.',true),
  ('Go Digit General Insurance Limited','go-digit-general-insurance','general','/insurer-logos/go-digit-general-insurance.webp','https://www.godigit.com/','General insurer regulated by IRDAI.',true),
  ('HDFC ERGO General Insurance Company Limited','hdfc-ergo-general-insurance','general','/insurer-logos/hdfc-ergo-general-insurance.webp','https://www.hdfcergo.com/','General insurer regulated by IRDAI.',true),
  ('ICICI Lombard General Insurance Company Limited','icici-lombard-general-insurance','general','/insurer-logos/icici-lombard-general-insurance.webp','https://www.icicilombard.com/','General insurer regulated by IRDAI.',true),
  ('IFFCO Tokio General Insurance Company Limited','iffco-tokio-general-insurance','general','/insurer-logos/iffco-tokio-general-insurance.webp','https://www.iffcotokio.co.in/','General insurer regulated by IRDAI.',true),
  ('Zurich Kotak General Insurance Company (India) Limited','zurich-kotak-general-insurance','general','/insurer-logos/zurich-kotak-general-insurance.webp','https://www.zurichkotak.com/','General insurer regulated by IRDAI.',true),
  ('Kshema General Insurance Limited','kshema-general-insurance','general','/insurer-logos/kshema-general-insurance.webp','https://www.kshema.co/','General insurer regulated by IRDAI.',true),
  ('Liberty General Insurance Limited','liberty-general-insurance','general','/insurer-logos/liberty-general-insurance.webp','https://www.libertyinsurance.in/','General insurer regulated by IRDAI.',true),
  ('Magma General Insurance Limited','magma-general-insurance','general','/insurer-logos/magma-general-insurance.webp','https://www.magmainsurance.com/','General insurer regulated by IRDAI.',true),
  ('Navi General Insurance Limited','navi-general-insurance','general','/insurer-logos/navi-general-insurance.webp','https://navi.com/insurance/','General insurer regulated by IRDAI.',true),
  ('National Insurance Company Limited','national-insurance-company','general','/insurer-logos/national-insurance-company.webp','https://nationalinsurance.nic.co.in/','General insurer regulated by IRDAI.',true),
  ('The New India Assurance Company Limited','new-india-assurance-company','general','/insurer-logos/new-india-assurance-company.webp','https://www.newindia.co.in/','General insurer regulated by IRDAI.',true),
  ('The Oriental Insurance Company Limited','oriental-insurance-company','general','/insurer-logos/oriental-insurance-company.webp','https://orientalinsurance.org.in/','General insurer regulated by IRDAI.',true),
  ('Raheja QBE General Insurance Company Limited','raheja-qbe-general-insurance','general','/insurer-logos/raheja-qbe-general-insurance.webp','https://www.rahejaqbe.com/','General insurer regulated by IRDAI.',true),
  ('Reliance General Insurance Company Limited','reliance-general-insurance','general','/insurer-logos/reliance-general-insurance.webp','https://www.reliancegeneral.co.in/','General insurer regulated by IRDAI.',true),
  ('Royal Sundaram General Insurance Company Limited','royal-sundaram-general-insurance','general','/insurer-logos/royal-sundaram-general-insurance.webp','https://www.royalsundaram.in/','General insurer regulated by IRDAI.',true),
  ('SBI General Insurance Company Limited','sbi-general-insurance','general','/insurer-logos/sbi-general-insurance.webp','https://www.sbigeneral.in/','General insurer regulated by IRDAI.',true),
  ('Shriram General Insurance Company Limited','shriram-general-insurance','general','/insurer-logos/shriram-general-insurance.webp','https://www.shriramgi.com/','General insurer regulated by IRDAI.',true),
  ('Tata AIG General Insurance Company Limited','tata-aig-general-insurance','general','/insurer-logos/tata-aig-general-insurance.webp','https://www.tataaig.com/','General insurer regulated by IRDAI.',true),
  ('United India Insurance Company Limited','united-india-insurance-company','general','/insurer-logos/united-india-insurance-company.webp','https://uiic.co.in/','General insurer regulated by IRDAI.',true),
  ('Universal Sompo General Insurance Company Limited','universal-sompo-general-insurance','general','/insurer-logos/universal-sompo-general-insurance.webp','https://www.universalsompo.com/','General insurer regulated by IRDAI.',true),

  -- Standalone health insurers
  ('Aditya Birla Health Insurance Company Limited','aditya-birla-health-insurance','health','/insurer-logos/aditya-birla-health-insurance.webp','https://www.adityabirlahealthinsurance.com/','Standalone health insurer regulated by IRDAI.',true),
  ('Care Health Insurance Limited','care-health-insurance','health','/insurer-logos/care-health-insurance.webp','https://www.careinsurance.com/','Standalone health insurer regulated by IRDAI.',true),
  ('Galaxy Health Insurance Company Limited','galaxy-health-insurance','health','/insurer-logos/galaxy-health-insurance.webp','https://www.galaxyhealth.com/','Standalone health insurer regulated by IRDAI.',true),
  ('Narayana Health Insurance Limited','narayana-health-insurance','health','/insurer-logos/narayana-health-insurance.webp','https://narayanahealth.insurance/','Standalone health insurer regulated by IRDAI.',true),
  ('ManipalCigna Health Insurance Company Limited','manipalcigna-health-insurance','health','/insurer-logos/manipalcigna-health-insurance.webp','https://www.manipalcigna.com/','Standalone health insurer regulated by IRDAI.',true),
  ('Niva Bupa Health Insurance Company Limited','niva-bupa-health-insurance','health','/insurer-logos/niva-bupa-health-insurance.webp','https://www.nivabupa.com/','Standalone health insurer regulated by IRDAI.',true),
  ('Star Health and Allied Insurance Company Limited','star-health-and-allied-insurance','health','/insurer-logos/star-health-and-allied-insurance.webp','https://www.starhealth.in/','Standalone health insurer regulated by IRDAI.',true)
on conflict(name) do update set
  slug = excluded.slug,
  sector = excluded.sector,
  logo_url = excluded.logo_url,
  website_url = excluded.website_url,
  description = excluded.description,
  active = excluded.active;
