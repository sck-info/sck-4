-- (1) Roles Trigger
CREATE OR REPLACE TRIGGER roles_app_event AFTER INSERT OR UPDATE OR DELETE
ON roles FOR EACH ROW EXECUTE FUNCTION notify_app_event ();

-- (2) Users Trigger
CREATE OR REPLACE TRIGGER users_app_event AFTER INSERT OR UPDATE OR DELETE
ON users FOR EACH ROW EXECUTE FUNCTION notify_app_event ();

-- (3) Contacts Trigger
CREATE OR REPLACE TRIGGER contacts_app_event AFTER INSERT OR UPDATE OR DELETE
ON contacts FOR EACH ROW EXECUTE FUNCTION notify_app_event ();

-- (4) Metrics Trigger
CREATE OR REPLACE TRIGGER metrics_app_event AFTER INSERT OR UPDATE OR DELETE
ON metrics FOR EACH ROW EXECUTE FUNCTION notify_app_event ();

