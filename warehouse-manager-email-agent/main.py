import re
import requests
from bs4 import BeautifulSoup
from transformers import pipeline

def collect_data():
    """
    Collect raw data from a local CSV file containing business contacts.
    """
    import csv

    text_data = ""
    try:
        with open("warehouse-manager-email-agent/sample_data.csv", newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # Concatenate all fields to text_data for LLM context
                text_data += " ".join(row.values()) + " "
        return text_data
    except Exception as e:
        print(f"Error reading local dataset: {e}")
        return ""

def extract_emails(text):
    """
    Extract emails from the given text using regex.
    """
    email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    emails = re.findall(email_pattern, text)
    return set(emails)  # Return unique emails

def identify_warehouse_manager_emails(emails, text):
    """
    Use a local LLM to identify which emails belong to warehouse managers.
    This is a placeholder using a zero-shot classification pipeline.
    """
    # Initialize classifier once outside loop for efficiency
    classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

    identified_emails = set()
    candidate_labels = ["warehouse manager", "logistics manager", "supply chain manager"]

    for email in emails:
        # Find context around the email in the text
        context_start = max(text.find(email) - 200, 0)
        context_end = min(text.find(email) + 200, len(text))
        context = text[context_start:context_end]

        result = classifier(context, candidate_labels)
        # Check if "warehouse manager" is among top 3 labels with score > 0.5
        top_labels = result["labels"][:3]
        top_scores = result["scores"][:3]
        if "warehouse manager" in top_labels and top_scores[top_labels.index("warehouse manager")] > 0.5:
            identified_emails.add(email)

    return identified_emails

def main():
    print("Collecting data...")
    raw_data = collect_data()
    if not raw_data:
        print("No data collected. Exiting.")
        return

    print("Extracting emails...")
    emails = extract_emails(raw_data)
    print(f"Found {len(emails)} emails.")

    if len(emails) == 0:
        print("No emails found. Exiting.")
        return

    print("Identifying warehouse manager emails using local LLM...")
    wm_emails = identify_warehouse_manager_emails(emails, raw_data)
    print(f"Identified {len(wm_emails)} warehouse manager emails.")

    if len(wm_emails) == 0:
        print("No warehouse manager emails identified.")
    else:
        # Save results
        with open("warehouse_manager_emails.txt", "w") as f:
            for email in wm_emails:
                f.write(email + "\n")
        print("Emails saved to warehouse_manager_emails.txt")

if __name__ == "__main__":
    main()
