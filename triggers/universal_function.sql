CREATE OR REPLACE FUNCTION notify_app_event()
RETURNS trigger AS $$
DECLARE
  rec RECORD;
  safe_data jsonb;
BEGIN
  rec := COALESCE(NEW, OLD);

  safe_data := to_jsonb(rec) - 'password' - 'two_factor_secret';

  PERFORM pg_notify(
    'app_events',
    json_build_object(
      'table', TG_TABLE_NAME,
      'action', TG_OP,
      'id', rec.id,
      'data', safe_data,
      'timestamp', now()
    )::text
  );

  RETURN rec;
END;
$$ LANGUAGE plpgsql;
