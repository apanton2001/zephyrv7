import requests
import re
import csv
import time

PPLX_API_KEY = "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"
SEARCH_QUERY = "warehouse manager email"
CSV_FILENAME = "warehouse_manager_emails.csv"
NUM_QUERIES = 50  # Adjust for more/less results
RESULTS_PER_QUERY = 10  # Perplexity may limit results per query

def search_perplexity(query, api_key):
    url = "https://api.perplexity.ai/search"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    payload = {
        "query": query,
        "num_results": RESULTS_PER_QUERY
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def extract_emails(text):
    # Simple regex for emails
    return re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)

def main():
    all_emails = set()
    for i in range(NUM_QUERIES):
        print(f"Query {i+1}/{NUM_QUERIES}...")
        # Optionally, vary the query to get more diverse results
        query = SEARCH_QUERY + f" site:linkedin.com OR site:company.com OR site:business.com"
        data = search_perplexity(query, PPLX_API_KEY)
        if not data or "results" not in data:
            continue
        for result in data["results"]:
            snippet = result.get("snippet", "")
            emails = extract_emails(snippet)
            for email in emails:
                all_emails.add(email)
        time.sleep(1)  # Be polite to the API

    print(f"Found {len(all_emails)} unique emails. Writing to CSV...")
    with open(CSV_FILENAME, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["Email"])
        for email in sorted(all_emails):
            writer.writerow([email])
    print(f"Done. Results saved to {CSV_FILENAME}")

if __name__ == "__main__":
    main()