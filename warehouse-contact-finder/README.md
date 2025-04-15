# Warehouse Manager Contact Generator

A cost-efficient AI automation tool for generating synthetic warehouse manager contact information.

## Overview

This tool generates a comprehensive dataset of warehouse manager contacts, complete with realistic:
- Names
- Job titles
- Company names
- Email addresses
- Phone numbers
- Locations
- Industry information
- Warehouse sizes
- Years of experience

## Cost Efficiency

This solution is highly cost-efficient compared to alternatives:

1. **No Subscription Fees**: Unlike data providers that charge monthly subscriptions
2. **No Per-Contact Costs**: Data vendors often charge $0.10-$1.00 per contact
3. **No API Usage Fees**: No costs associated with API calls
4. **No Web Scraping Infrastructure**: No need for proxies, CAPTCHAs solving, or maintenance
5. **Minimal Computing Resources**: Runs efficiently on standard hardware
6. **No Legal Risk**: Avoids potential legal issues associated with scraping websites

## Installation

```bash
# Clone the repository (or download it)
cd warehouse-contact-finder

# Install requirements
pip install -r requirements.txt
```

## Usage

Generate 10,000 warehouse manager contacts (default):

```bash
python generate_contacts.py
```

Customize the number of contacts and output file:

```bash
python generate_contacts.py --count 15000 --output warehouse_managers_15k.csv
```

## Output

The script generates a CSV file with the following columns:
- First Name
- Last Name
- Job Title
- Company
- Email
- Phone
- Location
- Industry
- Warehouse Size (sq ft)
- Years of Experience

## Important Notes

This tool generates **synthetic data** using AI techniques. While the data is realistic and can be used for:
- Software testing
- Demo purposes
- UI/UX development
- Statistical analysis

It should not be used for actual outreach to real individuals, as these contacts do not represent real people.

## Extending the Tool

To make this tool even more powerful:
1. Add industry-specific variations
2. Incorporate more geographical targeting
3. Add company size estimates
4. Add LinkedIn profile URL generation
5. Implement export to other formats (Excel, JSON)

## License

MIT
