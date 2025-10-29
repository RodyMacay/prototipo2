CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(20) CHECK (role IN ('psychologist', 'child')) NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS psychologists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  date_of_birth DATE,
  sex VARCHAR(20),
  phone_number VARCHAR(50),
  address TEXT,
  specializations TEXT[] DEFAULT '{}',
  assigned_children TEXT[] DEFAULT '{}',
  hospital VARCHAR(255),
  years_experience INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  age INTEGER NOT NULL,
  sex VARCHAR(20),
  date_of_birth DATE,
  address TEXT,
  guardian_name VARCHAR(255),
  guardian_phone VARCHAR(50),
  asd_level VARCHAR(50),
  diagnosis TEXT[] DEFAULT '{}',
  guardian_email VARCHAR(255),
  assigned_psychologist UUID REFERENCES psychologists(id),
  preferences JSONB DEFAULT '{}',
  current_emotion VARCHAR(20) DEFAULT 'neutral',
  clinical_history_file TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biometric_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  heart_rate INTEGER,
  stress_level VARCHAR(10) CHECK (stress_level IN ('low', 'medium', 'high')),
  skin_temperature NUMERIC(5,2),
  activity VARCHAR(20) CHECK (activity IN ('resting', 'active', 'excited', 'agitated')),
  face_count INTEGER DEFAULT 0,
  dominant_emotion VARCHAR(30),
  dominant_confidence NUMERIC(6,2),
  microexpression_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS heart_rate INTEGER;
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS stress_level VARCHAR(10);
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS skin_temperature NUMERIC(5,2);
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS activity VARCHAR(20);
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS face_count INTEGER DEFAULT 0;
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS dominant_emotion VARCHAR(30);
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS dominant_confidence NUMERIC(6,2);
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS microexpression_data JSONB DEFAULT '{}';
ALTER TABLE biometric_data ALTER COLUMN microexpression_data SET DEFAULT '{}';


ALTER TABLE biometric_data
  ADD CONSTRAINT IF NOT EXISTS chk_biometric_stress_level
  CHECK (stress_level IS NULL OR stress_level IN ('low', 'medium', 'high'));

ALTER TABLE biometric_data
  ADD CONSTRAINT IF NOT EXISTS chk_biometric_activity
  CHECK (activity IS NULL OR activity IN ('resting', 'active', 'excited', 'agitated'));

CREATE TABLE IF NOT EXISTS biometric_alerts (
  id VARCHAR(255) PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  type VARCHAR(30) CHECK (type IN ('emotional_distress', 'microexpression_anomaly')) NOT NULL,
  severity VARCHAR(10) CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emotion_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  emotion VARCHAR(20) CHECK (emotion IN ('joy', 'sadness', 'anger', 'fear', 'disgust', 'neutral')) NOT NULL,
  intensity INTEGER CHECK (intensity >= 0 AND intensity <= 100) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  triggers TEXT[] DEFAULT '{}',
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapy_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  psychologist_id UUID REFERENCES psychologists(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) CHECK (status IN ('active', 'paused', 'completed', 'cancelled')) DEFAULT 'active',
  objectives TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emotional_islands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  emotion VARCHAR(20) CHECK (emotion IN ('joy', 'sadness', 'anger', 'fear', 'disgust', 'neutral')) NOT NULL,
  name VARCHAR(255) NOT NULL,
  unlocked BOOLEAN DEFAULT FALSE,
  visit_count INTEGER DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE,
  progress JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biometric_data_child_timestamp ON biometric_data(child_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_biometric_alerts_child_timestamp ON biometric_alerts(child_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_records_child_timestamp ON emotion_records(child_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_children_psychologist ON children(assigned_psychologist);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychologists ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_islands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Psychologists can view assigned children" ON children;
CREATE POLICY "Psychologists can view assigned children" ON children
  FOR SELECT USING (
    assigned_psychologist IN (
      SELECT id FROM psychologists WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Children can view their own data" ON children;
CREATE POLICY "Children can view their own data" ON children
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Biometric data access" ON biometric_data;
CREATE POLICY "Biometric data access" ON biometric_data
  FOR ALL USING (
    child_id IN (
      SELECT id FROM children 
      WHERE user_id = auth.uid() 
      OR assigned_psychologist IN (
        SELECT id FROM psychologists WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Alerts access" ON biometric_alerts;
CREATE POLICY "Alerts access" ON biometric_alerts
  FOR ALL USING (
    child_id IN (
      SELECT id FROM children 
      WHERE user_id = auth.uid() 
      OR assigned_psychologist IN (
        SELECT id FROM psychologists WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Emotion records access" ON emotion_records;
CREATE POLICY "Emotion records access" ON emotion_records
  FOR ALL USING (
    child_id IN (
      SELECT id FROM children 
      WHERE user_id = auth.uid() 
      OR assigned_psychologist IN (
        SELECT id FROM psychologists WHERE user_id = auth.uid()
      )
    )
  );

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO users (id, name, email, role) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Dr. María González', 'maria.gonzalez@mindbridge.com', 'psychologist'),
  ('22222222-2222-2222-2222-222222222222', 'Lucas Martínez', 'lucas.martinez@email.com', 'child')
ON CONFLICT (email) DO NOTHING;

INSERT INTO psychologists (user_id, license_number, specializations, years_experience) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'PSY-2021-0456', ARRAY['Terapia Cognitivo-Conductual', 'Psicología Infantil', 'TEA'], 8)
ON CONFLICT (license_number) DO NOTHING;

INSERT INTO children (user_id, age, diagnosis, parent_email, assigned_psychologist) VALUES 
  ('22222222-2222-2222-2222-222222222222', 8, ARRAY['TEA', 'Ansiedad'], 'parent@email.com', 
   (SELECT id FROM psychologists WHERE license_number = 'PSY-2021-0456'))
ON CONFLICT DO NOTHING;
