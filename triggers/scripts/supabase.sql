DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    -- ✅ Replica identity
    EXECUTE format(
      'ALTER TABLE public.%I REPLICA IDENTITY FULL;',
      t.tablename
    );

    -- ✅ Add to publication (safe)
    BEGIN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;',
        t.tablename
      );
    EXCEPTION
      WHEN duplicate_object THEN
        -- already added, ignore
        NULL;
    END;

    -- ✅ Enable RLS
    EXECUTE format(
      'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;',
      t.tablename
    );

    -- ✅ Drop old policy if exists
    EXECUTE format(
      'DROP POLICY IF EXISTS "realtime_select_%I" ON public.%I;',
      t.tablename,
      t.tablename
    );

    -- ✅ Create policy
    EXECUTE format(
      'CREATE POLICY "realtime_select_%I"
       ON public.%I
       FOR SELECT
       TO anon
       USING (true);',
      t.tablename,
      t.tablename
    );

  END LOOP;
END;
$$;
