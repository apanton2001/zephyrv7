-- Corrected full SQL script with proper table creation order

-- Create locations table
CREATE TABLE public.locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    zone TEXT NOT NULL,
    aisle TEXT NOT NULL,
    bin TEXT NOT NULL,
    shelf TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    product_count INTEGER DEFAULT 0,
    attributes JSONB
);

-- Create clients table
CREATE TABLE public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    company TEXT,
    address JSONB NOT NULL,
    status TEXT CHECK (status IN ('Active', 'Delinquent', 'Flagged')) DEFAULT 'Active',
    segment TEXT CHECK (segment IN ('VIP', 'Standard', 'Inactive')) DEFAULT 'Standard',
    notes TEXT,
    attributes JSONB
);

-- Create products table
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    upc TEXT,
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL,
    min_stock_level INTEGER NOT NULL,
    location_id UUID REFERENCES public.locations(id),
    category TEXT,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_ordered_at TIMESTAMP WITH TIME ZONE,
    supplier_id UUID,
    attributes JSONB,
    critical_status TEXT CHECK (critical_status IN ('Critical', 'Warning', 'Normal')) DEFAULT 'Normal'
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_id UUID NOT NULL REFERENCES public.clients(id),
    order_number TEXT NOT NULL UNIQUE,
    status TEXT CHECK (status IN ('Sent Shipping Details', 'Awaiting Confirmation', 'Processing', 'Picking', 'Packing', 'Ready to Ship', 'Order Shipped')) DEFAULT 'Awaiting Confirmation',
    total_amount DECIMAL(10, 2) NOT NULL,
    items JSONB NOT NULL,
    shipping_details JSONB NOT NULL,
    tracking_number TEXT,
    notes TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    attributes JSONB
);

-- Create tasks table
CREATE TABLE public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID NOT NULL REFERENCES auth.users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
    status TEXT CHECK (status IN ('To Do', 'In Progress', 'Completed')) DEFAULT 'To Do',
    related_to UUID,
    related_type TEXT CHECK (related_type IN ('Order', 'Product', 'Client', 'Other')),
    attributes JSONB
);

-- Create warehouse_metrics table
CREATE TABLE public.warehouse_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL,
    order_fulfillment_rate DECIMAL(5, 2) NOT NULL,
    inventory_accuracy DECIMAL(5, 2) NOT NULL,
    space_utilization DECIMAL(5, 2) NOT NULL,
    staff_productivity DECIMAL(5, 2) NOT NULL,
    efficiency_score DECIMAL(5, 2) NOT NULL,
    attributes JSONB
);

-- Enable RLS on all tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users

-- Locations table policies
CREATE POLICY "Allow read access to locations for authenticated users"
ON public.locations FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Allow insert access to locations for authenticated users"
ON public.locations FOR INSERT
TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update access to locations for authenticated users"
ON public.locations FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete access to locations for authenticated users"
ON public.locations FOR DELETE
TO authenticated USING (true);

-- Clients table policies
CREATE POLICY "Allow read access to clients for authenticated users"
ON public.clients FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Allow insert access to clients for authenticated users"
ON public.clients FOR INSERT
TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update access to clients for authenticated users"
ON public.clients FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete access to clients for authenticated users"
ON public.clients FOR DELETE
TO authenticated USING (true);

-- Products table policies
CREATE POLICY "Allow read access to products for authenticated users"
ON public.products FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Allow insert access to products for authenticated users"
ON public.products FOR INSERT
TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update access to products for authenticated users"
ON public.products FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete access to products for authenticated users"
ON public.products FOR DELETE
TO authenticated USING (true);

-- Orders table policies
CREATE POLICY "Allow read access to orders for authenticated users"
ON public.orders FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Allow insert access to orders for authenticated users"
ON public.orders FOR INSERT
TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update access to orders for authenticated users"
ON public.orders FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete access to orders for authenticated users"
ON public.orders FOR DELETE
TO authenticated USING (true);

-- Tasks table policies
CREATE POLICY "Allow read access to tasks for authenticated users"
ON public.tasks FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Allow insert access to tasks for authenticated users"
ON public.tasks FOR INSERT
TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update access to tasks for authenticated users"
ON public.tasks FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete access to tasks for authenticated users"
ON public.tasks FOR DELETE
TO authenticated USING (true);

-- Warehouse metrics table policies
CREATE POLICY "Allow read access to warehouse_metrics for authenticated users"
ON public.warehouse_metrics FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Allow insert access to warehouse_metrics for authenticated users"
ON public.warehouse_metrics FOR INSERT
TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update access to warehouse_metrics for authenticated users"
ON public.warehouse_metrics FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete access to warehouse_metrics for authenticated users"
ON public.warehouse_metrics FOR DELETE
TO authenticated USING (true);

-- Function to update product_count in locations
CREATE OR REPLACE FUNCTION update_location_product_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.location_id IS NOT NULL THEN
    UPDATE public.locations
    SET product_count = product_count + 1
    WHERE id = NEW.location_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.location_id <> OLD.location_id THEN
    IF OLD.location_id IS NOT NULL THEN
      UPDATE public.locations
      SET product_count = product_count - 1
      WHERE id = OLD.location_id;
    END IF;
    IF NEW.location_id IS NOT NULL THEN
      UPDATE public.locations
      SET product_count = product_count + 1
      WHERE id = NEW.location_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.location_id IS NOT NULL THEN
    UPDATE public.locations
    SET product_count = product_count - 1
    WHERE id = OLD.location_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_location_product_count
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION update_location_product_count();

-- Function to update product critical status
CREATE OR REPLACE FUNCTION update_product_critical_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_quantity <= NEW.min_stock_level * 0.25 THEN
    NEW.critical_status := 'Critical';
  ELSIF NEW.stock_quantity <= NEW.min_stock_level * 0.75 THEN
    NEW.critical_status := 'Warning';
  ELSE
    NEW.critical_status := 'Normal';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_critical_status
BEFORE INSERT OR UPDATE OF stock_quantity, min_stock_level ON public.products
FOR EACH ROW EXECUTE FUNCTION update_product_critical_status();

-- Indexes for performance
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_location ON public.products(location_id);
CREATE INDEX idx_products_critical_status ON public.products(critical_status);

CREATE INDEX idx_orders_client ON public.orders(client_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_segment ON public.clients(segment);

CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
