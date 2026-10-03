-- 현재 데이터베이스의 사용자 테이블마다 앞에서부터 20행을 한 결과로 모읍니다.
-- specpulse 데이터베이스에 연결한 뒤 실행하세요.
--   SELECT * FROM preview_all_tables();
CREATE OR REPLACE FUNCTION preview_all_tables(row_limit integer DEFAULT 20)
RETURNS TABLE (
    table_schema text,
    table_name text,
    shown_rows integer,
    rows jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
    target record;
    safe_limit integer;
BEGIN
    safe_limit := COALESCE(row_limit, 20);
    IF safe_limit < 1 THEN
        safe_limit := 20;
    ELSIF safe_limit > 1000 THEN
        safe_limit := 1000;
    END IF;

    FOR target IN
        SELECT n.nspname AS schema_name, c.relname AS rel_name
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'r'
          AND n.nspname NOT IN ('pg_catalog', 'information_schema')
          AND n.nspname NOT LIKE 'pg\_%' ESCAPE '\'
        ORDER BY n.nspname, c.relname
    LOOP
        RETURN QUERY EXECUTE format(
            'SELECT %L::text, %L::text, COUNT(*)::integer, '
            'COALESCE(jsonb_agg((to_jsonb(preview) - ''preview_ord'') ORDER BY preview.preview_ord), ''[]''::jsonb) '
            'FROM ('
            '    SELECT row_number() OVER () AS preview_ord, limited.* '
            '    FROM (SELECT * FROM %I.%I ORDER BY ctid LIMIT %s) AS limited'
            ') AS preview',
            target.schema_name,
            target.rel_name,
            target.schema_name,
            target.rel_name,
            safe_limit
        );
    END LOOP;
END;
$$;
