# Usage Guide

This guide explains how to use the Business LLM Assistant system for various business tasks.

## Getting Started

After installation, you can interact with the system in several ways:

1. **Command Line Interface (CLI)**
2. **Voice Interface**
3. **Web Dashboard** (if enabled)
4. **API Endpoints** (for integration with other systems)

## Command Line Interface

The CLI is the most basic way to interact with the system.

```bash
# Start the system
python main.py

# Show available commands
help

# Switch between agents
switch outreach
switch finance
switch data

# Analyze a document
analyze document path/to/document.pdf

# Generate a report
report sales Q1 2025

# Get financial insights
finance track monthly

# End session
exit
```

## Voice Interface

To use voice commands:

1. Start the system with voice enabled:
   ```bash
   python main.py --voice
   ```

2. Use the wake word "Business Assistant" followed by your command:
   ```
   "Business Assistant, what's my revenue this month?"
   "Business Assistant, draft an email to John about the project update."
   "Business Assistant, analyze the latest sales report."
   ```

3. Common voice commands:
   - "Draft an email to [person] about [topic]"
   - "Schedule a meeting with [person] on [date]"
   - "Analyze [document name]"
   - "Show me [financial/sales/client] data"
   - "Create a report on [topic]"
   - "Summarize recent customer interactions"

## Web Dashboard

If you've enabled the web dashboard:

1. Start the dashboard:
   ```bash
   python -m dashboard.server
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8501
   ```

3. Use the dashboard to:
   - View financial metrics
   - Analyze document collections
   - Track client interactions
   - Generate reports
   - Configure system settings

## Working with Specific Agents

### Outreach Agent

The Outreach Agent helps manage client communications.

#### Example Tasks:

1. **Email Management**:
   ```
   draft email to client@example.com about project update
   ```

2. **Client Tracking**:
   ```
   show interactions with client XYZ
   ```

3. **Follow-up Scheduling**:
   ```
   schedule follow-up with potential client in 3 days
   ```

4. **Communication Templates**:
   ```
   create template for cold outreach in healthcare sector
   ```

### Finance Agent

The Finance Agent tracks revenue and financial metrics.

#### Example Tasks:

1. **Revenue Tracking**:
   ```
   show revenue for March 2025
   ```

2. **Expense Analysis**:
   ```
   analyze expenses by category
   ```

3. **Financial Reporting**:
   ```
   generate monthly financial report
   ```

4. **Subscription Tracking**:
   ```
   show active subscriptions and renewal dates
   ```

### Data Analyzer

The Data Analyzer provides insights from your business data.

#### Example Tasks:

1. **Document Analysis**:
   ```
   analyze document sales_report_q1.pdf
   ```

2. **Data Visualization**:
   ```
   create chart of customer acquisition by month
   ```

3. **Trend Analysis**:
   ```
   identify trends in customer feedback
   ```

4. **Competitive Analysis**:
   ```
   analyze competitor pricing data
   ```

## Document Processing

The system can process various document types:

- **PDFs**: `analyze pdf path/to/document.pdf`
- **Spreadsheets**: `analyze spreadsheet path/to/data.xlsx`
- **Text Documents**: `analyze document path/to/notes.txt`
- **Images** (with text): `analyze image path/to/screenshot.png`
- **Email Archives**: `analyze emails path/to/emails.eml`

## Data Import/Export

### Importing Data

```bash
# Import contacts
python -m utils.data_importer --type contacts --file path/to/contacts.csv

# Import financial data
python -m utils.data_importer --type financial --file path/to/transactions.xlsx

# Import documents
python -m utils.data_importer --type documents --directory path/to/docs/
```

### Exporting Data

```bash
# Export financial report
python -m utils.data_exporter --type financial --format pdf --output financial_report.pdf

# Export client interactions
python -m utils.data_exporter --type interactions --format csv --output client_interactions.csv

# Export system logs
python -m utils.data_exporter --type logs --days 30 --output system_logs.txt
```

## Automation & Scheduling

You can set up automated tasks:

```bash
# Schedule daily financial summary
python -m scheduler.add --task "financial_summary" --frequency "daily" --time "08:00"

# Schedule weekly client follow-up check
python -m scheduler.add --task "follow_up_reminder" --frequency "weekly" --day "Monday" --time "09:00"

# Schedule monthly report generation
python -m scheduler.add --task "monthly_report" --frequency "monthly" --day "1" --time "07:00"
```

## Security Features

### Securing Sensitive Data

```bash
# Encrypt a document
python -m utils.security --encrypt --file path/to/sensitive.docx

# Set access permissions
python -m utils.security --permissions --file financial_data.xlsx --level restricted

# View audit log
python -m utils.security --audit-log --days 7
```

## Integration with Other Systems

### API Usage

The system provides REST API endpoints for integration:

```bash
# Start API server
python -m api.server

# Access API at
# http://localhost:5000/api/v1/
```

Example API requests:
- `GET /api/v1/finance/revenue/monthly`
- `POST /api/v1/outreach/draft-email`
- `POST /api/v1/analyzer/document`

### MCP Server Integration

The system can connect to your existing MCP servers:

```bash
# Connect to content-assistant MCP server
python -m utils.mcp_connector --server content-assistant

# Connect to dev-assistant MCP server
python -m utils.mcp_connector --server dev-assistant
```

## Performance Optimization

For better performance on limited hardware:

```bash
# Run in low-memory mode
python main.py --low-memory

# Disable agents you don't need
python main.py --disable-agent finance --disable-agent data

# Use disk offloading for large models
python main.py --disk-offload
```

## Backup & Recovery

```bash
# Create a system backup
python -m utils.backup --create

# Restore from backup
python -m utils.backup --restore --file backup_2025_04_14.zip

# Export all business data
python -m utils.backup --export-data --directory path/to/export/
```

## Troubleshooting

If you encounter issues:

```bash
# Run system diagnostics
python -m utils.diagnostics

# Check model integrity
python -m utils.model_check

# Repair database
python -m utils.db_repair

# View detailed logs
python -m utils.log_viewer
```

## Getting Help

For additional help:

```bash
# Show help for specific command
help [command]

# Show help for specific agent
help agent [agent_name]

# Show system information
system info
