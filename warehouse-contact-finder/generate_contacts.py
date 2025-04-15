import csv
import random
import string
from faker import Faker
import os
import argparse
from tqdm import tqdm

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Generate warehouse manager contact data.')
    parser.add_argument('--count', type=int, default=10000, 
                        help='Number of contacts to generate (default: 10000)')
    parser.add_argument('--output', type=str, default='warehouse_managers.csv',
                        help='Output CSV file name (default: warehouse_managers.csv)')
    return parser.parse_args()

def generate_company_name(fake):
    """Generate a random company name."""
    company_types = [
        "Logistics", "Distribution", "Warehousing", "Supply Chain", 
        "Fulfillment", "Storage", "Freight", "Shipping", "Transport",
        "Inventory", "Distribution Center", "3PL", "Cold Storage"
    ]
    
    name_patterns = [
        f"{fake.last_name()} {random.choice(company_types)}",
        f"{fake.last_name()}-{fake.last_name()} {random.choice(company_types)}",
        f"{fake.city()} {random.choice(company_types)}",
        f"{fake.last_name()} & {fake.last_name()} {random.choice(company_types)}",
        f"{fake.last_name()} {random.choice(company_types)} Inc",
        f"{fake.last_name()} {random.choice(company_types)} LLC",
        f"{fake.company()}"
    ]
    
    return random.choice(name_patterns)

def generate_warehouse_location(fake):
    """Generate a plausible warehouse location."""
    # Warehouses are often located in industrial areas, near transportation hubs
    location_patterns = [
        f"{fake.city()}, {fake.state_abbr()}",
        f"{fake.city()} Industrial Park, {fake.state_abbr()}",
        f"{fake.city()} Distribution Center, {fake.state_abbr()}",
        f"{fake.city()} Logistics Hub, {fake.state_abbr()}",
        f"{fake.city()} Business Park, {fake.state_abbr()}"
    ]
    
    return random.choice(location_patterns)

def generate_job_title():
    """Generate a warehouse manager job title."""
    prefixes = ["", "Senior ", "Lead ", "Head ", "Chief ", "Regional ", "District "]
    roles = [
        "Warehouse Manager",
        "Distribution Manager", 
        "Logistics Manager",
        "Operations Manager",
        "Fulfillment Manager",
        "Supply Chain Manager",
        "Inventory Manager",
        "Warehouse Director",
        "Warehouse Supervisor",
        "Facilities Manager"
    ]
    
    return f"{random.choice(prefixes)}{random.choice(roles)}"

def generate_business_email(first_name, last_name, company):
    """Generate a plausible business email address."""
    # Clean and format the company name for an email domain
    domain = company.lower()
    for char in string.punctuation + " ":
        domain = domain.replace(char, "")
    
    domain = ''.join(c for c in domain if c.isalnum() or c == '-')
    domain = domain[:20]  # Limit domain length
    
    # Different email patterns
    email_patterns = [
        f"{first_name.lower()}.{last_name.lower()}@{domain}.com",
        f"{first_name.lower()[0]}{last_name.lower()}@{domain}.com",
        f"{last_name.lower()}.{first_name.lower()}@{domain}.com",
        f"{first_name.lower()}@{domain}.com",
        f"{last_name.lower()}@{domain}.com",
        f"{first_name.lower()}{last_name.lower()}@{domain}.com"
    ]
    
    return random.choice(email_patterns)

def generate_phone_number(fake):
    """Generate a business phone number."""
    return fake.phone_number()

def generate_warehouse_manager_data(count):
    """Generate synthetic warehouse manager contact data."""
    fake = Faker('en_US')
    Faker.seed(12345)  # Set seed for reproducibility
    
    data = []
    
    # Create a set to track used emails for uniqueness
    used_emails = set()
    
    for _ in tqdm(range(count), desc="Generating contacts"):
        first_name = fake.first_name()
        last_name = fake.last_name()
        company = generate_company_name(fake)
        
        # Ensure email is unique
        email = generate_business_email(first_name, last_name, company)
        attempt = 0
        while email in used_emails and attempt < 5:
            # If duplicate, try a different pattern
            email = generate_business_email(first_name, last_name, company)
            attempt += 1
        
        if email not in used_emails:
            used_emails.add(email)
            
            contact = {
                'First Name': first_name,
                'Last Name': last_name,
                'Job Title': generate_job_title(),
                'Company': company,
                'Email': email,
                'Phone': generate_phone_number(fake),
                'Location': generate_warehouse_location(fake),
                'Industry': random.choice([
                    'Logistics', 'Manufacturing', 'Retail', 'E-commerce', 
                    'Food & Beverage', 'Pharmaceuticals', 'Electronics',
                    'Automotive', 'Aerospace', 'Construction', 'Textiles',
                    'Consumer Goods', 'Industrial Equipment', '3PL'
                ]),
                'Warehouse Size (sq ft)': random.choice([
                    '10,000-25,000', '25,000-50,000', '50,000-100,000', 
                    '100,000-250,000', '250,000-500,000', '500,000+'
                ]),
                'Years of Experience': random.randint(2, 25)
            }
            
            data.append(contact)
    
    return data

def save_to_csv(data, filename):
    """Save the generated data to a CSV file."""
    if not data:
        print("No data to save.")
        return False
        
    fieldnames = data[0].keys()
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    
    print(f"Successfully saved {len(data)} contacts to {filename}")
    return True

def main():
    """Main function to generate warehouse manager contacts."""
    args = parse_arguments()
    
    print(f"Generating {args.count} warehouse manager contacts...")
    
    # Generate the contact data
    contacts = generate_warehouse_manager_data(args.count)
    
    # Save to CSV
    success = save_to_csv(contacts, args.output)
    
    if success:
        print(f"Generated {len(contacts)} unique warehouse manager contacts")
        print(f"Output saved to: {os.path.abspath(args.output)}")
    else:
        print("Failed to generate contacts.")

if __name__ == "__main__":
    main()
