-- one row per clinic account
CREATE TABLE doctors (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  clinic_name text NOT NULL,
  doctor_name text NOT NULL,
  phone text,
  email text NOT NULL,
  message_template text DEFAULT 'Bonjour {patient_name}, rappel de votre rendez-vous le {date} à {heure}. — Cabinet {clinic_name}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) NOT NULL,
  name text NOT NULL,
  phone text NOT NULL, -- normalized to +212XXXXXXXXX
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors(id) NOT NULL,
  patient_id uuid REFERENCES patients(id) NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'en_attente',
  -- allowed: en_attente, envoye, confirme, termine, absent, annule
  created_at timestamptz DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Each doctor can only access their own data
CREATE POLICY "Doctors can only access their own profile" ON doctors
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Doctors can only access their own patients" ON patients
  FOR ALL USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can only access their own appointments" ON appointments
  FOR ALL USING (auth.uid() = doctor_id);
