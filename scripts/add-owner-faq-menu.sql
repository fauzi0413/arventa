DO $$
DECLARE
  v_role_id TEXT;
  v_menu_id TEXT;
BEGIN
  SELECT id INTO v_role_id FROM roles WHERE code = 'OWNER';
  SELECT id INTO v_menu_id FROM menu_items WHERE path = '/owner/faq';

  IF v_role_id IS NULL THEN
    RAISE NOTICE 'Role OWNER tidak ditemukan';
    RETURN;
  END IF;

  IF v_menu_id IS NULL THEN
    v_menu_id := gen_random_uuid()::text;
    INSERT INTO menu_items (id, title, path, icon, "order", parent_id, created_at, "group")
    VALUES (v_menu_id, 'FAQ & Bantuan', '/owner/faq', 'IconHelpCircle', 12, NULL, NOW(), 'BANTUAN');
    RAISE NOTICE 'MenuItem FAQ & Bantuan dibuat: %', v_menu_id;
  ELSE
    RAISE NOTICE 'MenuItem FAQ sudah ada: %', v_menu_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM role_menus WHERE role_id = v_role_id AND menu_item_id = v_menu_id
  ) THEN
    INSERT INTO role_menus (role_id, menu_item_id) VALUES (v_role_id, v_menu_id);
    RAISE NOTICE 'Berhasil di-link ke role OWNER';
  ELSE
    RAISE NOTICE 'Sudah ter-link ke role OWNER';
  END IF;
END $$;
