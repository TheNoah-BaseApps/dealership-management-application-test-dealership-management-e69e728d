CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  email text NOT NULL UNIQUE,
  name text,
  password text NOT NULL,
  role text DEFAULT 'viewer' NOT NULL,
  phone text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  lead_id text NOT NULL UNIQUE,
  lead_source text NOT NULL,
  lead_status text DEFAULT 'New' NOT NULL,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  contact_email text,
  vehicle_interested text,
  inquiry_date date NOT NULL,
  follow_up_date date,
  assigned_to uuid,
  estimated_value decimal(10,2),
  notes text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_lead_id ON leads (lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads (assigned_to);

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  vehicle_id text NOT NULL UNIQUE,
  vin_number text NOT NULL UNIQUE,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  purchase_date date,
  stock_status text DEFAULT 'Available' NOT NULL,
  purchase_price decimal(10,2),
  list_price decimal(10,2),
  location text,
  mileage integer,
  color text,
  last_inspection_date date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_id ON vehicles (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin_number ON vehicles (vin_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_stock_status ON vehicles (stock_status);

CREATE TABLE IF NOT EXISTS customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  customer_id text NOT NULL UNIQUE,
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  address text,
  city text,
  state text,
  zip text,
  lead_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers (customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);

CREATE TABLE IF NOT EXISTS sales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  sale_id text NOT NULL UNIQUE,
  customer_id uuid NOT NULL,
  vehicle_id uuid NOT NULL,
  lead_id uuid,
  sale_date date NOT NULL,
  sale_price decimal(10,2) NOT NULL,
  payment_method text,
  sales_rep_id uuid NOT NULL,
  finance_terms text,
  trade_in_value decimal(10,2),
  status text DEFAULT 'Pending' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sales_sale_id ON sales (sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales (customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_vehicle_id ON sales (vehicle_id);

CREATE TABLE IF NOT EXISTS service_appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  appointment_id text NOT NULL UNIQUE,
  customer_id uuid NOT NULL,
  vehicle_id uuid NOT NULL,
  appointment_date timestamp with time zone NOT NULL,
  service_type text NOT NULL,
  description text,
  technician_id uuid,
  status text DEFAULT 'Scheduled' NOT NULL,
  estimated_cost decimal(10,2),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_service_appointments_appointment_id ON service_appointments (appointment_id);
CREATE INDEX IF NOT EXISTS idx_service_appointments_customer_id ON service_appointments (customer_id);
CREATE INDEX IF NOT EXISTS idx_service_appointments_technician_id ON service_appointments (technician_id);

CREATE TABLE IF NOT EXISTS repair_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  ro_id text NOT NULL UNIQUE,
  appointment_id uuid,
  customer_id uuid NOT NULL,
  vehicle_id uuid NOT NULL,
  issue_description text NOT NULL,
  labor_cost decimal(10,2),
  parts_cost decimal(10,2),
  total_cost decimal(10,2),
  status text DEFAULT 'Open' NOT NULL,
  completion_date date,
  technician_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_repair_orders_ro_id ON repair_orders (ro_id);
CREATE INDEX IF NOT EXISTS idx_repair_orders_customer_id ON repair_orders (customer_id);

CREATE TABLE IF NOT EXISTS parts_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  part_id text NOT NULL UNIQUE,
  part_name text NOT NULL,
  part_number text NOT NULL UNIQUE,
  category text,
  quantity integer DEFAULT 0 NOT NULL,
  min_quantity integer DEFAULT 5 NOT NULL,
  unit_price decimal(10,2),
  supplier text,
  location text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_parts_inventory_part_id ON parts_inventory (part_id);
CREATE INDEX IF NOT EXISTS idx_parts_inventory_part_number ON parts_inventory (part_number);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  task_id text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  assigned_to uuid NOT NULL,
  assigned_by uuid NOT NULL,
  due_date date,
  priority text DEFAULT 'Medium' NOT NULL,
  status text DEFAULT 'Pending' NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON tasks (task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks (assigned_to);

CREATE TABLE IF NOT EXISTS communications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  communication_id text NOT NULL UNIQUE,
  communication_type text NOT NULL,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  subject text,
  message text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  read_status boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_communications_communication_id ON communications (communication_id);
CREATE INDEX IF NOT EXISTS idx_communications_recipient_id ON communications (recipient_id);

CREATE TABLE IF NOT EXISTS documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  document_id text NOT NULL UNIQUE,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_documents_document_id ON documents (document_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);