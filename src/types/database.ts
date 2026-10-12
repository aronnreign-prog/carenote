// Drizzle ORM Domain Types

export interface ClinicalWorkspace {
  id: string
  user_id: string
  email: string
  name: string
  created_at: string | Date
}

export interface Patient {
  id: string
  workspace_id: string
  name: string
  date_of_birth: string
  biological_sex: string
  created_at: string | Date
}

export interface ClinicalRecord {
  id: string
  patient_id: string
  workspace_id: string
  filename: string
  blob_url?: string
  file_size?: string
  mime_type?: string
  status: string
  uploaded_at: string | Date
  processed_at?: string | Date | null
  record_date?: string | null
  record_type?: string | null
  error_message?: string | null
}

export interface ClinicalSynthesis {
  id: string
  patient_id: string
  workspace_id: string
  status: string
  created_at: string | Date
  completed_at?: string | Date | null
  source_record_ids?: unknown
  synthesis_text?: string | null
  claims?: unknown
  flagged_concerns?: unknown
  error_message?: string | null
}

export interface DemoRequest {
  id: string
  name: string
  email: string
  organization?: string | null
  role?: string | null
  use_case?: string | null
  status: 'pending' | 'approved' | 'rejected' | string
  created_at: string | Date
  approved_at?: string | Date | null
  created_user_id?: string | null
}
