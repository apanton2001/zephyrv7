# Supabase Database Setup for Zephyr Warehouse Management System

This guide will walk you through setting up the required database tables and configurations in Supabase for the Zephyr Warehouse Management System.

## Prerequisites

- A Supabase account (sign up at [https://supabase.com](https://supabase.com) if you don't have one)
- A new Supabase project
- Admin access to your Supabase project

## Setup Steps

### 1. Authentication Configuration

1. Navigate to the **Authentication** tab in your Supabase dashboard
2. Under **Providers**:
   - Enable Email provider (with "Confirm email" enabled)
   - Enable any other providers you want to support (Google, GitHub, etc.)
3. Under **URL Configuration**:
   - Set the Site URL to your application URL (e.g., `http://localhost:3000` for development)
   - Add any additional redirect URLs if needed
4. Set up email templates under the **Email Templates** section (optional)

### 2. Database Tables Creation

Navigate to the **SQL Editor** in your Supabase dashboard and run the following SQL commands to create the required tables:

```sql
-- Create tables with RLS (Row Level Security) enabled

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
```

### 3. Row Level Security (RLS) Policies

Set up Row Level Security to protect your data:

```sql
-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users

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

-- Apply similar policies to other tables
-- (For brevity, only the products table policies are shown here. 
-- You should create similar policies for all tables)
```

### 4. Functions and Triggers

Create functions and triggers for advanced functionality:

```sql
-- Function to update product_count in locations
CREATE OR REPLACE FUNCTION update_location_product_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.location_id IS NOT NULL THEN
    UPDATE public.locations
    SET product_count = product_count + 1
    WHERE id = NEW.location_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.location_id <> OLD.location_id THEN
    -- If location changed, update both old and new locations
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

-- Create trigger for product location tracking
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

-- Create trigger for product critical status
CREATE TRIGGER trigger_update_product_critical_status
BEFORE INSERT OR UPDATE OF stock_quantity, min_stock_level ON public.products
FOR EACH ROW EXECUTE FUNCTION update_product_critical_status();
```

### 5. Indexes

Create indexes to improve query performance:

```sql
-- Product indexes
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_location ON public.products(location_id);
CREATE INDEX idx_products_critical_status ON public.products(critical_status);

-- Order indexes
CREATE INDEX idx_orders_client ON public.orders(client_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

-- Client indexes
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_segment ON public.clients(segment);

-- Task indexes
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
```

### 6. Sample Data (Optional)

If you want to populate your database with sample data, you can run the following SQL:

```sql
-- Insert sample locations
INSERT INTO public.locations (name, zone, aisle, bin, shelf)
VALUES 
('Storage A1', 'Main', 'A', '1', 'Top'),
('Storage A2', 'Main', 'A', '2', 'Middle'),
('Storage B1', 'Secondary', 'B', '1', 'Bottom'),
('Storage C3', 'Reserve', 'C', '3', 'Middle');

-- Insert sample products
INSERT INTO public.products (name, sku, upc, price, cost_price, stock_quantity, min_stock_level, location_id, category, description)
VALUES 
('Widget XL', 'WDG-001', '123456789012', 29.99, 15.50, 120, 20, (SELECT id FROM public.locations WHERE name = 'Storage A1'), 'Electronics', 'Large widget for industrial use'),
('Gadget Mini', 'GDG-002', '223456789012', 19.99, 8.75, 85, 15, (SELECT id FROM public.locations WHERE name = 'Storage A2'), 'Electronics', 'Compact gadget for portable use'),
('Super Tool', 'TL-003', '323456789012', 49.99, 22.50, 35, 10, (SELECT id FROM public.locations WHERE name = 'Storage B1'), 'Tools', 'Professional-grade tool'),
('Ultra Connector', 'CON-004', '423456789012', 9.99, 2.15, 8, 25, (SELECT id FROM public.locations WHERE name = 'Storage C3'), 'Connectors', 'Heavy-duty connector');

-- Insert sample clients
INSERT INTO public.clients (name, email, phone, company, address, segment)
VALUES 
('John Smith', 'john@example.com', '555-123-4567', 'Acme Inc', '{"street": "123 Main St", "city": "Boston", "state": "MA", "zip": "02101", "country": "USA"}', 'VIP'),
('Sarah Johnson', 'sarah@example.com', '555-234-5678', 'TechCorp', '{"street": "456 High St", "city": "New York", "state": "NY", "zip": "10001", "country": "USA"}', 'Standard'),
('David Lee', 'david@example.com', '555-345-6789', 'Global Logistics', '{"street": "789 Park Ave", "city": "Chicago", "state": "IL", "zip": "60601", "country": "USA"}', 'Standard');

-- Warehouse metrics
INSERT INTO public.warehouse_metrics (date, order_fulfillment_rate, inventory_accuracy, space_utilization, staff_productivity, efficiency_score)
VALUES 
(CURRENT_DATE - INTERVAL '7 day', 92.5, 94.8, 85.2, 88.7, 90.3),
(CURRENT_DATE - INTERVAL '6 day', 93.1, 95.0, 86.0, 87.9, 90.5),
(CURRENT_DATE - INTERVAL '5 day', 91.8, 93.7, 87.3, 89.2, 90.5),
(CURRENT_DATE - INTERVAL '4 day', 94.2, 94.2, 88.1, 90.5, 91.8),
(CURRENT_DATE - INTERVAL '3 day', 95.0, 94.5, 89.4, 91.2, 92.5),
(CURRENT_DATE - INTERVAL '2 day', 94.8, 95.2, 90.3, 92.8, 93.3),
(CURRENT_DATE - INTERVAL '1 day', 96.2, 96.5, 91.5, 93.4, 94.4),
(CURRENT_DATE, 97.2, 94.5, 88.3, 92.1, 95.7);
```

## Error Handling

If you encounter a foreign key constraint issue when running the SQL commands, make sure to create the tables in the correct order or modify the scripts to add foreign key constraints after all tables are created.

## Security Considerations

This setup includes basic Row Level Security (RLS) policies that allow authenticated users to access all data. In a production environment, you should implement more granular policies based on user roles and responsibilities.

## Next Steps

Once you've successfully set up your database:

1. Update your `.env.local` file with your Supabase project URL and anon key
2. Run the application with `npm run dev`
3. Navigate to the application and test the functionality

## Troubleshooting

If you encounter issues:

1. Check the Supabase dashboard for any error messages
2. Verify that all tables have been created correctly
3. Ensure RLS policies are correctly applied
4. Test database access using the Supabase SQL Editor or API explorer
