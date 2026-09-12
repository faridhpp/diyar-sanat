-- Keep RLS policy evaluation working after restores and role/grant changes.
-- These functions remain private and are intentionally not executable by app_visitor.
revoke all on function private.current_staff_role() from public, app_visitor;
revoke all on function private.has_staff_role(text[]) from public, app_visitor;
grant usage on schema private to app_staff;
grant execute on function private.current_staff_role() to app_staff;
grant execute on function private.has_staff_role(text[]) to app_staff;
