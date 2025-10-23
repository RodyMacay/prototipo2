-- Eliminar TODAS las políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Psychologists can view assigned children" ON children;
DROP POLICY IF EXISTS "Children can view their own data" ON children;
DROP POLICY IF EXISTS "Biometric data access" ON biometric_data;
DROP POLICY IF EXISTS "Alerts access" ON biometric_alerts;
DROP POLICY IF EXISTS "Emotion records access" ON emotion_records;
DROP POLICY IF EXISTS "psychologists_insert_policy" ON psychologists;
DROP POLICY IF EXISTS "psychologists_select_policy" ON psychologists;
DROP POLICY IF EXISTS "psychologists_update_policy" ON psychologists;
DROP POLICY IF EXISTS "children_insert_policy" ON children;
DROP POLICY IF EXISTS "children_select_policy" ON children;
DROP POLICY IF EXISTS "children_update_policy" ON children;
DROP POLICY IF EXISTS "Psychologists can insert children" ON users;
DROP POLICY IF EXISTS "Psychologists can insert children" ON children;

-- USERS TABLE
-- Allow users to see their own data
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow psychologists to create new users with the 'child' role
CREATE POLICY "Psychologists can insert children" ON users
  FOR INSERT WITH CHECK (
    role = 'child' AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'psychologist'
  );

-- CHILDREN TABLE
-- Allow psychologists to see children assigned to them
CREATE POLICY "Psychologists can view assigned children" ON children
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'psychologist' AND
    assigned_psychologist IN (SELECT id FROM psychologists WHERE user_id = auth.uid())
  );

-- Allow children to see their own data
CREATE POLICY "Children can view their own data" ON children
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'child' AND
    user_id = auth.uid()
  );

-- Allow psychologists to create new children
CREATE POLICY "Psychologists can insert children" ON children
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'psychologist'
  );
