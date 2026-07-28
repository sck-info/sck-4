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

-- (5) About Slides Trigger
CREATE OR REPLACE TRIGGER about_slides_app_event AFTER INSERT OR UPDATE OR DELETE
ON about_slides FOR EACH ROW EXECUTE FUNCTION notify_app_event ();

-- (6) Gallery Trigger
CREATE OR REPLACE TRIGGER gallery_app_event AFTER INSERT OR UPDATE OR DELETE
ON gallery FOR EACH ROW EXECUTE FUNCTION notify_app_event ();

-- (7) Password Reset Tokens Trigger
CREATE OR REPLACE TRIGGER password_reset_tokens_app_event AFTER INSERT OR UPDATE OR DELETE
ON password_reset_tokens FOR EACH ROW EXECUTE FUNCTION notify_app_event ();
-- (8) User Queries Trigger
CREATE OR REPLACE TRIGGER user_queries_app_event AFTER INSERT OR UPDATE OR DELETE
ON user_queries FOR EACH ROW EXECUTE FUNCTION notify_app_event ();
