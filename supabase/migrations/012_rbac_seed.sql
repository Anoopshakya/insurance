-- 012_rbac_seed.sql
-- Seeds roles + permissions from the Phase 0 RBAC matrix.
-- Extend this as you add modules; treat it as the source of truth,
-- not the UI screens.

insert into roles (name) values
  ('super_admin'), ('operations'), ('finance'), ('compliance'), ('agent');

-- module, action pairs. action in: view, create, edit, approve, delete
insert into permissions (module, action) values
  ('agents','view'), ('agents','create'), ('agents','edit'), ('agents','approve'), ('agents','delete'),
  ('kyc','view'), ('kyc','create'), ('kyc','approve'),
  ('crm','view'), ('crm','create'), ('crm','edit'),
  ('catalog','view'), ('catalog','edit'),
  ('quotes_policies','view'), ('quotes_policies','create'), ('quotes_policies','edit'),
  ('renewals','view'), ('renewals','edit'),
  ('network','view'),
  ('commission_rules','view'), ('commission_rules','propose'), ('commission_rules','approve'),
  ('earnings','view'), ('earnings','create'),
  ('payouts','view'), ('payouts','request'), ('payouts','approve'), ('payouts','process'),
  ('audit_logs','view'),
  ('system','manage_roles');

-- super_admin: everything
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p where r.name = 'super_admin';

-- operations: agents/kyc(submit)/crm/quotes/policies/renewals full-ish, view network
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'operations'
  and (p.module, p.action) in (
    ('agents','view'),('agents','create'),('agents','edit'),
    ('kyc','view'),('kyc','create'),
    ('crm','view'),('crm','create'),('crm','edit'),
    ('catalog','view'),
    ('quotes_policies','view'),('quotes_policies','create'),('quotes_policies','edit'),
    ('renewals','view'),('renewals','edit'),
    ('network','view'),
    ('earnings','view')
  );

-- finance: earnings + payouts full, commission propose, view elsewhere
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'finance'
  and (p.module, p.action) in (
    ('agents','view'),('crm','view'),('catalog','view'),
    ('quotes_policies','view'),('renewals','view'),('network','view'),
    ('commission_rules','view'),('commission_rules','propose'),
    ('earnings','view'),('earnings','create'),
    ('payouts','view'),('payouts','approve'),('payouts','process'),
    ('audit_logs','view')
  );

-- compliance: KYC full, audit full, view elsewhere
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'compliance'
  and (p.module, p.action) in (
    ('agents','view'),('kyc','view'),('kyc','create'),('kyc','approve'),
    ('crm','view'),('quotes_policies','view'),('renewals','view'),
    ('network','view'),('commission_rules','view'),
    ('earnings','view'),('payouts','view'),
    ('audit_logs','view')
  );

-- agent: own-scope only. "Own scope" is enforced in app/query layer via
-- agent_id = current_agent(), not via this permission table alone.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.name = 'agent'
  and (p.module, p.action) in (
    ('crm','view'),('crm','create'),('crm','edit'),
    ('catalog','view'),
    ('quotes_policies','view'),('quotes_policies','create'),
    ('renewals','view'),
    ('network','view'),
    ('earnings','view'),
    ('payouts','view'),('payouts','request')
  );
