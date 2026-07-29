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

-- (9) Payment QRs Trigger
CREATE OR REPLACE TRIGGER payment_qrs_app_event AFTER INSERT OR UPDATE OR DELETE
ON payment_qrs FOR EACH ROW EXECUTE FUNCTION notify_app_event ();

-- (10) Session Locations Trigger
CREATE OR REPLACE TRIGGER session_locations_app_event AFTER INSERT OR UPDATE OR DELETE
ON session_locations FOR EACH ROW EXECUTE FUNCTION notify_app_event ();

-- (11) Form Questions Trigger
CREATE OR REPLACE TRIGGER form_questions_app_event AFTER INSERT OR UPDATE OR DELETE
ON form_questions FOR EACH ROW EXECUTE FUNCTION notify_app_event ();

-- (12) Offering Categories Trigger
CREATE OR REPLACE TRIGGER offering_categories_app_event AFTER INSERT OR UPDATE OR DELETE
ON offering_categories FOR EACH ROW EXECUTE FUNCTION notify_app_event ();

-- (13) Offering Sub Categories Trigger
CREATE OR REPLACE TRIGGER offering_sub_categories_app_event AFTER INSERT OR UPDATE OR DELETE
ON offering_sub_categories FOR EACH ROW EXECUTE FUNCTION notify_app_event ();

-- (14) Sub Category Questions Trigger
CREATE OR REPLACE TRIGGER sub_category_questions_app_event AFTER INSERT OR UPDATE OR DELETE
ON sub_category_questions FOR EACH ROW EXECUTE FUNCTION notify_app_event ();

-- (15) Offering Slots Trigger
CREATE OR REPLACE TRIGGER offering_slots_app_event AFTER INSERT OR UPDATE OR DELETE
ON offering_slots FOR EACH ROW EXECUTE FUNCTION notify_app_event ();

-- (16) Bookings Trigger
CREATE OR REPLACE TRIGGER bookings_app_event AFTER INSERT OR UPDATE OR DELETE
ON bookings FOR EACH ROW EXECUTE FUNCTION notify_app_event ();

-- (17) Feedbacks Trigger
CREATE OR REPLACE TRIGGER feedbacks_app_event AFTER INSERT OR UPDATE OR DELETE
ON feedbacks FOR EACH ROW EXECUTE FUNCTION notify_app_event ();
