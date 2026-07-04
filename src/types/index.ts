export type AppointmentStatus = 'en_attente' | 'envoye' | 'confirme' | 'termine' | 'absent' | 'annule';

export interface Doctor {
  id: string;
  clinic_name: string;
  doctor_name: string;
  phone: string | null;
  email: string;
  message_template: string;
  created_at: string;
}

export interface Patient {
  id: string;
  doctor_id: string;
  name: string;
  phone: string;
  notes: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  created_at: string;
}

export interface AppointmentWithPatient extends Appointment {
  patients: Patient;
}
