import pandas as pd
import matplotlib.pyplot as plt
import os
import argparse
from collections import Counter

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Analyze warehouse manager contact data.')
    parser.add_argument('--input', type=str, default='warehouse_managers.csv',
                        help='Input CSV file to analyze (default: warehouse_managers.csv)')
    parser.add_argument('--output_dir', type=str, default='analysis_results',
                        help='Directory to save analysis results (default: analysis_results)')
    return parser.parse_args()

def load_data(csv_file):
    """Load the CSV data into a pandas DataFrame."""
    if not os.path.exists(csv_file):
        print(f"Error: File '{csv_file}' not found.")
        return None
    
    try:
        df = pd.read_csv(csv_file)
        print(f"Loaded {len(df)} records from {csv_file}")
        return df
    except Exception as e:
        print(f"Error loading CSV file: {e}")
        return None

def create_output_directory(output_dir):
    """Create output directory if it doesn't exist."""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")

def analyze_job_titles(df, output_dir):
    """Analyze job title distribution."""
    job_title_counts = Counter(df['Job Title'])
    top_titles = dict(job_title_counts.most_common(10))
    
    plt.figure(figsize=(12, 6))
    plt.bar(top_titles.keys(), top_titles.values(), color='skyblue')
    plt.xticks(rotation=45, ha='right')
    plt.title('Top 10 Warehouse Manager Job Titles')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'job_titles.png'))
    plt.close()
    
    print("Job title analysis completed")

def analyze_industries(df, output_dir):
    """Analyze industry distribution."""
    industry_counts = Counter(df['Industry'])
    
    plt.figure(figsize=(12, 6))
    plt.pie([v for v in industry_counts.values()], 
            labels=[k for k in industry_counts.keys()],
            autopct='%1.1f%%', startangle=90)
    plt.title('Industry Distribution')
    plt.axis('equal')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'industries.png'))
    plt.close()
    
    print("Industry analysis completed")

def analyze_warehouse_sizes(df, output_dir):
    """Analyze warehouse size distribution."""
    size_counts = Counter(df['Warehouse Size (sq ft)'])
    ordered_sizes = ['10,000-25,000', '25,000-50,000', '50,000-100,000', 
                     '100,000-250,000', '250,000-500,000', '500,000+']
    
    # Reorder to ensure correct sequence
    ordered_counts = {size: size_counts.get(size, 0) for size in ordered_sizes}
    
    plt.figure(figsize=(12, 6))
    plt.bar(ordered_counts.keys(), ordered_counts.values(), color='lightgreen')
    plt.xticks(rotation=45)
    plt.title('Warehouse Size Distribution')
    plt.ylabel('Number of Warehouses')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'warehouse_sizes.png'))
    plt.close()
    
    print("Warehouse size analysis completed")

def analyze_experience(df, output_dir):
    """Analyze years of experience distribution."""
    plt.figure(figsize=(12, 6))
    plt.hist(df['Years of Experience'], bins=20, color='salmon', alpha=0.7)
    plt.title('Years of Experience Distribution')
    plt.xlabel('Years of Experience')
    plt.ylabel('Number of Managers')
    plt.grid(axis='y', alpha=0.75)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'experience.png'))
    plt.close()
    
    print("Experience analysis completed")

def analyze_locations(df, output_dir):
    """Analyze location distribution."""
    # Extract state from location
    df['State'] = df['Location'].str.extract(r', ([A-Z]{2})$')
    state_counts = Counter(df['State'])
    top_states = dict(state_counts.most_common(10))
    
    plt.figure(figsize=(12, 6))
    plt.bar(top_states.keys(), top_states.values(), color='lightblue')
    plt.title('Top 10 States with Warehouse Managers')
    plt.xlabel('State')
    plt.ylabel('Number of Managers')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'top_states.png'))
    plt.close()
    
    print("Location analysis completed")

def generate_summary(df, output_dir):
    """Generate a summary text file with key statistics."""
    with open(os.path.join(output_dir, 'summary.txt'), 'w') as f:
        f.write("WAREHOUSE MANAGER CONTACT DATABASE SUMMARY\n")
        f.write("=========================================\n\n")
        
        f.write(f"Total Contacts: {len(df)}\n\n")
        
        f.write("Job Title Distribution:\n")
        job_title_counts = Counter(df['Job Title'])
        for title, count in job_title_counts.most_common(10):
            f.write(f"  - {title}: {count} ({count/len(df)*100:.1f}%)\n")
        
        f.write("\nIndustry Distribution:\n")
        industry_counts = Counter(df['Industry'])
        for industry, count in industry_counts.most_common():
            f.write(f"  - {industry}: {count} ({count/len(df)*100:.1f}%)\n")
        
        f.write("\nWarehouse Size Distribution:\n")
        size_counts = Counter(df['Warehouse Size (sq ft)'])
        ordered_sizes = ['10,000-25,000', '25,000-50,000', '50,000-100,000', 
                     '100,000-250,000', '250,000-500,000', '500,000+']
        for size in ordered_sizes:
            count = size_counts.get(size, 0)
            f.write(f"  - {size}: {count} ({count/len(df)*100:.1f}%)\n")
        
        f.write("\nExperience Summary:\n")
        f.write(f"  - Average Experience: {df['Years of Experience'].mean():.1f} years\n")
        f.write(f"  - Median Experience: {df['Years of Experience'].median()} years\n")
        f.write(f"  - Min Experience: {df['Years of Experience'].min()} years\n")
        f.write(f"  - Max Experience: {df['Years of Experience'].max()} years\n")
        
        f.write("\nTop 5 States:\n")
        df['State'] = df['Location'].str.extract(r', ([A-Z]{2})$')
        state_counts = Counter(df['State'])
        for state, count in state_counts.most_common(5):
            f.write(f"  - {state}: {count} ({count/len(df)*100:.1f}%)\n")
    
    print("Summary report generated")

def main():
    """Main function to analyze the warehouse manager contact data."""
    args = parse_arguments()
    
    # Load the data
    df = load_data(args.input)
    if df is None:
        return
    
    # Create output directory
    create_output_directory(args.output_dir)
    
    # Run analyses
    analyze_job_titles(df, args.output_dir)
    analyze_industries(df, args.output_dir)
    analyze_warehouse_sizes(df, args.output_dir)
    analyze_experience(df, args.output_dir)
    analyze_locations(df, args.output_dir)
    generate_summary(df, args.output_dir)
    
    print(f"Analysis complete. Results saved to {os.path.abspath(args.output_dir)}")

if __name__ == "__main__":
    main()
