#!/usr/bin/env python3
import os
import sys
import argparse
import subprocess
import time

def display_banner():
    """Display a banner for the CLI tool."""
    print("""
    ┌───────────────────────────────────────────────────────┐
    │  WAREHOUSE MANAGER CONTACT GENERATOR                  │
    │  Cost-Effective AI Automation Tool                    │
    └───────────────────────────────────────────────────────┘
    """)

def check_requirements():
    """Check if required packages are installed."""
    try:
        import faker
        import tqdm
        import pandas
        import matplotlib
        return True
    except ImportError as e:
        print(f"ERROR: Missing required package: {e.name}")
        print("Please install requirements with: pip install -r requirements.txt")
        return False

def generate_contacts(count, output):
    """Generate warehouse manager contacts."""
    print(f"\n[1/3] Generating {count} warehouse manager contacts...")
    cmd = [sys.executable, "generate_contacts.py", "--count", str(count), "--output", output]
    
    start_time = time.time()
    process = subprocess.run(cmd, capture_output=True, text=True)
    end_time = time.time()
    
    if process.returncode != 0:
        print("ERROR: Contact generation failed.")
        print(process.stderr)
        return False
    
    print(process.stdout)
    print(f"Generation completed in {end_time - start_time:.2f} seconds.")
    return True

def analyze_data(input_file, output_dir):
    """Analyze the generated contact data."""
    print(f"\n[2/3] Analyzing contact data from {input_file}...")
    
    if not os.path.exists(input_file):
        print(f"ERROR: Input file '{input_file}' not found.")
        return False
    
    cmd = [sys.executable, "analyze_data.py", "--input", input_file, "--output_dir", output_dir]
    
    start_time = time.time()
    process = subprocess.run(cmd, capture_output=True, text=True)
    end_time = time.time()
    
    if process.returncode != 0:
        print("ERROR: Data analysis failed.")
        print(process.stderr)
        return False
    
    print(process.stdout)
    print(f"Analysis completed in {end_time - start_time:.2f} seconds.")
    return True

def display_summary(output_dir):
    """Display the summary of the generated data."""
    summary_file = os.path.join(output_dir, "summary.txt")
    
    if not os.path.exists(summary_file):
        print(f"ERROR: Summary file '{summary_file}' not found.")
        return False
    
    print("\n[3/3] Contact Database Summary:")
    print("=" * 50)
    
    with open(summary_file, 'r') as f:
        print(f.read())
    
    print(f"\nDetailed analysis results are available in: {os.path.abspath(output_dir)}")
    return True

def main():
    """Main function to run the CLI tool."""
    parser = argparse.ArgumentParser(description='Warehouse Manager Contact Generator CLI')
    
    # Main arguments
    parser.add_argument('--count', type=int, default=10000,
                        help='Number of contacts to generate (default: 10000)')
    parser.add_argument('--output', type=str, default='warehouse_managers.csv',
                        help='Output CSV file (default: warehouse_managers.csv)')
    parser.add_argument('--analysis-dir', type=str, default='analysis_results',
                        help='Directory for analysis results (default: analysis_results)')
    parser.add_argument('--skip-generation', action='store_true',
                        help='Skip contact generation, analyze existing file only')
    parser.add_argument('--skip-analysis', action='store_true',
                        help='Skip analysis, generate contacts only')
    
    args = parser.parse_args()
    
    # Display banner
    display_banner()
    
    # Check requirements
    if not check_requirements():
        return 1
    
    # Track success
    success = True
    
    # Generate contacts if not skipped
    if not args.skip_generation:
        success = generate_contacts(args.count, args.output)
        if not success:
            return 1
    else:
        print("\n[1/3] Skipping contact generation as requested.")
    
    # Analyze data if not skipped
    if not args.skip_analysis and success:
        success = analyze_data(args.output, args.analysis_dir)
        if not success:
            return 1
        
        # Display summary
        display_summary(args.analysis_dir)
    elif args.skip_analysis:
        print("\n[2/3] Skipping data analysis as requested.")
    
    print("\nAll operations completed successfully!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
