export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginHistory {
  id: string;
  user_id: string;
  login_timestamp: string;
  ip_address: string;
  device_info: string;
  success: boolean;
  failure_reason?: string;
}

export interface ProfileChange {
  id: string;
  user_id: string;
  field_changed: string;
  old_value?: string;
  new_value?: string;
  change_timestamp: string;
  changed_by: string;
}