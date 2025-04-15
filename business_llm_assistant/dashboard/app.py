"""
LISA Web Dashboard - Main Application

This is the main entry point for the LISA web dashboard, built with Streamlit.
It provides a web interface for the Business LLM Assistant (LISA) system.
"""

import os
import sys
import streamlit as st
from PIL import Image
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import time
from datetime import datetime
import json

# Add parent directory to sys.path to import from other modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Attempt to import LISA system components
try:
    from core.coordinator import Coordinator, Message
    from agents.outreach import OutreachAgent
    from agents.data_analyzer import DataAnalyzerAgent
    SYSTEM_IMPORTS_SUCCESS = True
except ImportError:
    SYSTEM_IMPORTS_SUCCESS = False

# Dashboard configuration
st.set_page_config(
    page_title="LISA - Business Assistant",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
def load_css():
    st.markdown("""
    <style>
        .main-header {
            font-size: 2.5rem;
            color: #4B89DC;
            text-align: center;
            margin-bottom: 1rem;
        }
        .sub-header {
            font-size: 1.5rem;
            color: #5D6D7E;
            margin-bottom: 1rem;
        }
        .agent-card {
            background-color: #F8F9FA;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 10px;
            border-left: 5px solid #4B89DC;
        }
        .status-online {
            color: #2ECC71;
            font-weight: bold;
        }
        .status-offline {
            color: #E74C3C;
            font-weight: bold;
        }
        .chat-message {
            padding: 10px;
            border-radius: 10px;
            margin-bottom: 10px;
            display: flex;
        }
        .user-message {
            background-color: #DCF8C6;
            margin-left: 20%;
        }
        .lisa-message {
            background-color: #F2F3F4;
            margin-right: 20%;
        }
        .message-content {
            flex-grow: 1;
        }
        .file-uploader {
            border: 2px dashed #4B89DC;
            border-radius: 5px;
            padding: 20px;
            text-align: center;
        }
        .metrics-container {
            display: flex;
            justify-content: space-between;
        }
        .metric-card {
            background-color: #F8F9FA;
            border-radius: 5px;
            padding: 15px;
            margin: 10px;
            text-align: center;
            flex-grow: 1;
        }
        .metric-value {
            font-size: 1.8rem;
            font-weight: bold;
            color: #4B89DC;
        }
        .metric-label {
            font-size: 1rem;
            color: #5D6D7E;
        }
    </style>
    """, unsafe_allow_html=True)

# Initialize session state
def init_session_state():
    if 'coordinator' not in st.session_state:
        st.session_state.coordinator = None
    if 'chat_history' not in st.session_state:
        st.session_state.chat_history = []
    if 'current_agent' not in st.session_state:
        st.session_state.current_agent = "coordinator"
    if 'system_running' not in st.session_state:
        st.session_state.system_running = False
    if 'document_analysis_results' not in st.session_state:
        st.session_state.document_analysis_results = {}
    if 'financial_metrics' not in st.session_state:
        # Mock financial data for demonstration
        st.session_state.financial_metrics = {
            'revenue': {'current': 125000, 'previous': 115000},
            'expenses': {'current': 78000, 'previous': 72000},
            'clients': {'current': 45, 'previous': 40},
            'retention': {'current': 0.87, 'previous': 0.82}
        }

# Application header
def render_header():
    st.markdown('<h1 class="main-header">LISA - Local Intelligent System Assistant</h1>', unsafe_allow_html=True)
    st.markdown('<h2 class="sub-header">Your Business Operations Assistant</h2>', unsafe_allow_html=True)
    
    # System status indicator
    if st.session_state.system_running:
        st.markdown('<p class="status-online">● System Online</p>', unsafe_allow_html=True)
    else:
        st.markdown('<p class="status-offline">● System Offline</p>', unsafe_allow_html=True)
    
    st.divider()

# Sidebar navigation
def render_sidebar():
    with st.sidebar:
        st.image("https://via.placeholder.com/150x150.png?text=LISA", width=150)
        st.title("Navigation")
        
        # Action buttons
        if not st.session_state.system_running:
            if st.button("Start LISA System"):
                start_system()
        else:
            if st.button("Stop LISA System"):
                stop_system()
        
        st.divider()
        
        # Navigation
        selected_page = st.radio(
            "Choose a page:",
            ["Dashboard", "Chat Interface", "Document Analysis", "Client Management", "Financial Tracking", "Settings"]
        )
        
        st.divider()
        
        # Agent selection (only if system is running)
        if st.session_state.system_running:
            st.subheader("Active Agents")
            
            agent_options = ["coordinator", "outreach", "data_analyzer", "finance"]
            selected_agent = st.selectbox(
                "Switch Agent:",
                agent_options,
                index=agent_options.index(st.session_state.current_agent) if st.session_state.current_agent in agent_options else 0
            )
            
            if selected_agent != st.session_state.current_agent:
                switch_agent(selected_agent)
        
        st.divider()
        
        # System information
        st.subheader("System Info")
        st.text(f"Current time: {datetime.now().strftime('%H:%M:%S')}")
        st.text("Version: 1.0.0")
        
        # Mock system metrics
        memory_usage = 4.2  # GB
        st.progress(memory_usage / 16, text=f"Memory: {memory_usage:.1f} GB")
        
        model_usage = 0.7  # 0-1 scale
        st.progress(model_usage, text=f"Model Load: {int(model_usage * 100)}%")
    
    return selected_page

# Start the LISA system
def start_system():
    # In a real implementation, this would initialize the Coordinator and load models
    # For demonstration, we'll simulate the system starting
    st.session_state.system_running = True
    st.session_state.current_agent = "coordinator"
    
    if SYSTEM_IMPORTS_SUCCESS:
        try:
            # Initialize a real Coordinator
            # This would be a simplified version of the actual initialization
            st.session_state.coordinator = Coordinator()
            st.toast("LISA system started successfully with real components", icon="✅")
        except Exception as e:
            st.warning(f"Could not initialize real system components: {str(e)}")
            st.toast("LISA system started in simulation mode", icon="⚠️")
    else:
        st.toast("LISA system started in simulation mode", icon="⚠️")

# Stop the LISA system
def stop_system():
    # In a real implementation, this would shut down the Coordinator and unload models
    st.session_state.system_running = False
    st.session_state.coordinator = None
    st.toast("LISA system stopped", icon="🛑")

# Switch to a different agent
def switch_agent(agent_name):
    st.session_state.current_agent = agent_name
    st.toast(f"Switched to {agent_name} agent", icon="🔄")

# Process user message
def process_message(user_message):
    if not st.session_state.system_running:
        return "⚠️ System is offline. Please start LISA system first."
    
    # Add user message to chat history
    st.session_state.chat_history.append({"role": "user", "content": user_message})
    
    # For demonstration, create an appropriate mock response based on the current agent
    if st.session_state.coordinator is not None:
        # In a real implementation, we would send the message to the coordinator
        # and get a proper response
        try:
            # Create a Message object
            message = Message(
                content=user_message,
                sender="user",
                receiver=st.session_state.current_agent,
                message_type="text"
            )
            
            # Send to coordinator and wait for response
            response_text = "Response from actual system would appear here."
            
            # This would be replaced with actual message sending when implemented
        except Exception as e:
            response_text = f"Error processing message: {str(e)}"
    else:
        # Simulation mode - create an appropriate response based on the agent
        if st.session_state.current_agent == "coordinator":
            response_text = f"Coordinator: I've processed your message: '{user_message}'. How else can I assist you today?"
        elif st.session_state.current_agent == "outreach":
            response_text = f"Outreach Agent: I can help you draft a message to your client regarding '{user_message}'."
        elif st.session_state.current_agent == "data_analyzer":
            response_text = f"Data Analyzer: I can analyze data related to '{user_message}'. Would you like me to create visualizations?"
        elif st.session_state.current_agent == "finance":
            response_text = f"Finance Agent: I can provide financial insights about '{user_message}'. Would you like to see the relevant metrics?"
        else:
            response_text = "Unknown agent. Please switch to a valid agent."
    
    # Add assistant response to chat history
    st.session_state.chat_history.append({"role": "assistant", "content": response_text})
    
    return response_text

# Document analysis page
def render_document_analysis():
    st.markdown('<h2 class="sub-header">Document Analysis</h2>', unsafe_allow_html=True)
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("Upload Documents")
        
        uploaded_file = st.file_uploader(
            "Upload a document for analysis",
            type=["pdf", "docx", "xlsx", "csv", "txt", "jpg", "png"],
            key="document_uploader"
        )
        
        analysis_type = st.selectbox(
            "Select analysis type",
            ["General Analysis", "Text Extraction", "Financial Analysis", "Image Analysis"]
        )
        
        if uploaded_file is not None:
            if st.button("Analyze Document"):
                if not st.session_state.system_running:
                    st.error("LISA system is offline. Please start the system first.")
                else:
                    with st.spinner("Analyzing document..."):
                        # Simulate document analysis
                        time.sleep(2)
                        
                        # Generate a mock result based on file type
                        file_extension = uploaded_file.name.split('.')[-1].lower()
                        
                        if file_extension in ['pdf', 'docx', 'txt']:
                            analysis_result = {
                                "summary": f"This document contains information about business operations and strategy.",
                                "key_points": [
                                    "Strategic planning for Q3 2025",
                                    "Budget allocation across departments",
                                    "New client acquisition targets"
                                ],
                                "word_count": 2456,
                                "sentiment": "Positive"
                            }
                        elif file_extension in ['xlsx', 'csv']:
                            analysis_result = {
                                "summary": f"This spreadsheet contains financial data for the past quarter.",
                                "rows": 145,
                                "columns": 12,
                                "data_types": ["numeric", "string", "date"],
                                "key_metrics": {
                                    "Total Revenue": "$248,500",
                                    "Expenses": "$156,700",
                                    "Profit Margin": "37%"
                                }
                            }
                        elif file_extension in ['jpg', 'png']:
                            analysis_result = {
                                "summary": "This image contains a business chart showing quarterly growth.",
                                "objects_detected": ["chart", "graph", "text", "logo"],
                                "text_content": "Q1 2025 Financial Performance",
                                "colors": ["blue", "green", "grey"]
                            }
                        else:
                            analysis_result = {
                                "summary": "Unrecognized file type for analysis."
                            }
                        
                        # Store the result
                        st.session_state.document_analysis_results[uploaded_file.name] = analysis_result
                        st.success(f"Analysis of {uploaded_file.name} complete!")
    
    with col2:
        st.subheader("Analysis Results")
        
        if not st.session_state.document_analysis_results:
            st.info("No documents have been analyzed yet. Upload a document and click 'Analyze Document'.")
        else:
            # Show a list of analyzed documents
            document_names = list(st.session_state.document_analysis_results.keys())
            selected_document = st.selectbox(
                "Select a document to view results",
                document_names
            )
            
            if selected_document:
                result = st.session_state.document_analysis_results[selected_document]
                
                # Display results based on content
                st.json(result)
                
                # If we have key metrics, create a chart
                if "key_metrics" in result:
                    metrics = result["key_metrics"]
                    labels = list(metrics.keys())
                    values = [float(v.replace('$', '').replace(',', '').replace('%', '')) for v in metrics.values() if any(c.isdigit() for c in v)]
                    
                    if values:
                        fig, ax = plt.subplots()
                        ax.bar(labels[:len(values)], values)
                        ax.set_title("Key Metrics")
                        st.pyplot(fig)

# Chat interface page
def render_chat_interface():
    st.markdown('<h2 class="sub-header">Chat with LISA</h2>', unsafe_allow_html=True)
    
    # Display current agent
    st.info(f"Currently chatting with: {st.session_state.current_agent.capitalize()} Agent")
    
    # Chat container
    chat_container = st.container()
    
    # Input area
    user_message = st.text_input("Type your message:", key="chat_input")
    col1, col2 = st.columns([1, 5])
    
    with col1:
        if st.button("Send", use_container_width=True):
            if user_message:
                process_message(user_message)
                # Clear the input box (workaround since Streamlit doesn't support this directly)
                st.experimental_rerun()
    
    with col2:
        if st.button("Clear Chat", use_container_width=True):
            st.session_state.chat_history = []
            st.experimental_rerun()
    
    # Display chat history
    with chat_container:
        for message in st.session_state.chat_history:
            if message["role"] == "user":
                st.markdown(f"""
                <div class="chat-message user-message">
                    <div class="message-content">
                        <b>You:</b><br>{message["content"]}
                    </div>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="chat-message lisa-message">
                    <div class="message-content">
                        <b>LISA ({st.session_state.current_agent}):</b><br>{message["content"]}
                    </div>
                </div>
                """, unsafe_allow_html=True)

# Dashboard overview page
def render_dashboard_overview():
    st.markdown('<h2 class="sub-header">System Dashboard</h2>', unsafe_allow_html=True)
    
    # Key metrics
    st.subheader("Business Metrics")
    col1, col2, col3, col4 = st.columns(4)
    
    metrics = st.session_state.financial_metrics
    
    with col1:
        current = metrics['revenue']['current']
        previous = metrics['revenue']['previous']
        percentage = ((current - previous) / previous) * 100
        arrow = "↑" if percentage >= 0 else "↓"
        
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">${current:,.0f}</div>
            <div class="metric-label">Revenue {arrow} {abs(percentage):.1f}%</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        current = metrics['expenses']['current']
        previous = metrics['expenses']['previous']
        percentage = ((current - previous) / previous) * 100
        arrow = "↑" if percentage >= 0 else "↓"
        
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">${current:,.0f}</div>
            <div class="metric-label">Expenses {arrow} {abs(percentage):.1f}%</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        current = metrics['clients']['current']
        previous = metrics['clients']['previous']
        percentage = ((current - previous) / previous) * 100
        arrow = "↑" if percentage >= 0 else "↓"
        
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{current}</div>
            <div class="metric-label">Clients {arrow} {abs(percentage):.1f}%</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        current = metrics['retention']['current'] * 100
        previous = metrics['retention']['previous'] * 100
        percentage = current - previous
        arrow = "↑" if percentage >= 0 else "↓"
        
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{current:.1f}%</div>
            <div class="metric-label">Retention {arrow} {abs(percentage):.1f}%</div>
        </div>
        """, unsafe_allow_html=True)
    
    # Charts
    st.subheader("Key Performance Indicators")
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Revenue vs Expenses
        data = pd.DataFrame({
            'Month': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            'Revenue': [90000, 95000, 100000, 102000, 115000, 125000],
            'Expenses': [65000, 67000, 68000, 70000, 72000, 78000]
        })
        
        fig, ax = plt.subplots(figsize=(8, 5))
        ax.plot(data['Month'], data['Revenue'], marker='o', label='Revenue')
        ax.plot(data['Month'], data['Expenses'], marker='s', label='Expenses')
        ax.set_title('Revenue vs Expenses (2025)')
        ax.set_xlabel('Month')
        ax.set_ylabel('Amount ($)')
        ax.legend()
        ax.grid(True, linestyle='--', alpha=0.7)
        
        st.pyplot(fig)
    
    with col2:
        # Client Acquisition
        client_data = pd.DataFrame({
            'Month': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            'New Clients': [5, 7, 4, 8, 10, 6],
            'Churned Clients': [2, 1, 3, 2, 4, 1]
        })
        
        fig, ax = plt.subplots(figsize=(8, 5))
        ax.bar(client_data['Month'], client_data['New Clients'], label='New Clients', color='green', alpha=0.7)
        ax.bar(client_data['Month'], client_data['Churned Clients'], label='Churned Clients', color='red', alpha=0.7)
        ax.set_title('Client Acquisition vs Churn (2025)')
        ax.set_xlabel('Month')
        ax.set_ylabel('Number of Clients')
        ax.legend()
        ax.grid(True, linestyle='--', alpha=0.5, axis='y')
        
        st.pyplot(fig)
    
    # Agent status
    st.subheader("Agent Status")
    
    if st.session_state.system_running:
        agent_status = {
            "coordinator": {"status": "Online", "tasks_processed": 125, "last_active": "Just now"},
            "outreach": {"status": "Online", "tasks_processed": 87, "last_active": "5 minutes ago"},
            "data_analyzer": {"status": "Online", "tasks_processed": 42, "last_active": "12 minutes ago"},
            "finance": {"status": "Online", "tasks_processed": 31, "last_active": "20 minutes ago"}
        }
    else:
        agent_status = {
            "coordinator": {"status": "Offline", "tasks_processed": 0, "last_active": "N/A"},
            "outreach": {"status": "Offline", "tasks_processed": 0, "last_active": "N/A"},
            "data_analyzer": {"status": "Offline", "tasks_processed": 0, "last_active": "N/A"},
            "finance": {"status": "Offline", "tasks_processed": 0, "last_active": "N/A"}
        }
    
    for agent_name, status in agent_status.items():
        st.markdown(f"""
        <div class="agent-card">
            <h3>{agent_name.capitalize()} Agent</h3>
            <p>Status: <span class="status-{'online' if status['status'] == 'Online' else 'offline'}">{status['status']}</span></p>
            <p>Tasks Processed: {status['tasks_processed']}</p>
            <p>Last Active: {status['last_active']}</p>
        </div>
        """, unsafe_allow_html=True)
    
    # Recent activities
    st.subheader("Recent Activities")
    
    if not st.session_state.chat_history:
        st.info("No recent activities.")
    else:
        activities = st.session_state.chat_history[-5:]  # Last 5 messages
        for message in activities:
            role = "You" if message["role"] == "user" else f"LISA ({st.session_state.current_agent})"
            st.text(f"{role}: {message['content'][:100]}..." if len(message["content"]) > 100 else f"{role}: {message['content']}")

# Client management page
def render_client_management():
    st.markdown('<h2 class="sub-header">Client Management</h2>', unsafe_allow_html=True)
    
    # Mock client data
    clients = [
        {"name": "Acme Corporation", "status": "Active", "contact": "john@acme.com", "revenue": 45000, "since": "2023-05-10"},
        {"name": "TechSolutions Inc", "status": "Active", "contact": "sara@techsolutions.com", "revenue": 28000, "since": "2022-11-15"},
        {"name": "Global Services Ltd", "status": "Inactive", "contact": "mike@global.com", "revenue": 15000, "since": "2024-01-22"},
        {"name": "InnovateTech", "status": "Active", "contact": "lisa@innovatetech.com", "revenue": 52000, "since": "2023-08-05"},
        {"name": "Prime Consulting", "status": "Potential", "contact": "robert@prime.com", "revenue": 0, "since": "2025-03-30"}
    ]
    
    tabs = st.tabs(["Client List", "Client Analytics", "Outreach Management"])
    
    with tabs[0]:
        st.subheader("Client Directory")
        
        # Search and filter
        search_term = st.text_input("Search clients:", "")
        status_filter = st.multiselect("Filter by status:", ["Active", "Inactive", "Potential"], default=["Active"])
        
        filtered_clients = [
            client for client in clients 
            if client["status"] in status_filter and 
            (search_term.lower() in client["name"].lower() or search_term.lower() in client["contact"].lower())
        ]
        
        # Convert to DataFrame for display
        df = pd.DataFrame(filtered_clients)
        st.dataframe(df, use_container_width=True)
        
        # Add client form
        with st.expander("Add New Client"):
            col1, col2 = st.columns(2)
            with col1:
                new_client_name = st.text_input("Company Name:", "")
                new_client_contact = st.text_input("Contact Email:", "")
            with col2:
                new_client_status = st.selectbox("Status:", ["Active", "Inactive", "Potential"])
                new_client_revenue = st.number_input("Annual Revenue:", min_value=0, step=1000)
            
            if st.button("Add Client"):
                st.success(f"Added new client: {new_client_name}")
    
    with tabs[1]:
        st.subheader("Client Analytics")
        
        # Revenue by client
        client_names = [client["name"] for client in clients if client["revenue"] > 0]
        revenues = [client["revenue"] for client in clients if client["revenue"] > 0]
        
        fig, ax = plt.subplots(figsize=(10, 6))
        bars = ax.bar(client_names, revenues)
        ax.set_title('Revenue by Client')
        ax.set_xlabel('Client')
        ax.set_ylabel('Revenue ($)')
        ax.tick_params(axis='x', rotation=45)
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + 1000, f'${height:,.0f}',
                   ha='center', va='bottom', rotation=0)
        
        st.pyplot(fig)
        
        # Client distribution by status
        status_counts = {}
        for client in clients:
            status = client["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        fig, ax = plt.subplots()
        ax.pie(status_counts.values(), labels=status_counts.keys(), autopct='%1.1f%%', 
               startangle=90, shadow=True)
        ax.axis('equal')
        ax.set_title('Client Distribution by Status')
        
        st.pyplot(fig)
    
    with tabs[2]:
        st.subheader("Outreach Management")
        
        # Scheduled follow-ups
        st.write("Scheduled Follow-ups")
        
        follow_ups = [
            {"client": "Acme Corporation", "date": "2025-04-20", "type": "Quarterly Review", "assigned_to": "Sales Team"},
            {"client": "TechSolutions Inc", "date": "2025-04-15", "type": "Contract Renewal", "assigned_to": "Account Manager"},
            {"client": "Prime Consulting", "date": "2025-04-18", "type": "Initial Meeting", "assigned_to": "Business Development"}
        ]
        
        st.dataframe(pd.DataFrame(follow_ups), use_container_width=True)
        
        # Email templates
        st.write("Email Templates")
        
        templates = [
            {"name": "Follow-up Meeting", "subject": "Follow-up: Our Recent Meeting", "use_case": "After initial meetings"},
            {"name": "Quarterly Check-in", "subject": "Quarterly Business Review", "use_case": "Regular client maintenance"},
            {"name": "Contract Renewal", "subject": "Your Service Contract Renewal", "use_case": "Expiring contracts"}
        ]
        
        for template in templates:
            with st.expander(f"Template: {template['name']}"):
                st.write(f"**Subject:** {template['subject']}")
                st.write(f"**Use Case:** {template['use_case']}")
                st.text_area("Template Content:", value="Dear [Client Name],\n\nI hope this message finds you well. [Template content here]\n\nBest regards,\n[Your Name]", height=200, key=f"template_{template['name']}")
                st.button("Use Template", key=f"use_{template['name']}")

# Financial tracking page
def render_financial_tracking():
    st.markdown('<h2 class="sub-header">Financial Tracking</h2>', unsafe_allow_html=True)
    
    # Mock financial data
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    revenue_data = [90000, 95000, 100000, 102000, 115000, 125000]
    expense_categories = {
        "Salaries": [45000, 45000, 47000, 47000, 48000, 50000],
        "Marketing": [8000, 8500, 9000, 10000, 10000, 12000],
        "Operations": [7000, 7500, 7000, 7500, 8000, 9000],
        "Software": [3000, 3000, 3000, 3500, 3500, 4000],
        "Miscellaneous": [2000, 3000, 2000, 2000, 2500, 3000]
    }
    
    tabs = st.tabs(["Revenue Tracking", "Expense Analysis", "Profit Margins", "Forecasting"])
    
    with tabs[0]:
        st.subheader("Revenue Overview")
        
        # Monthly revenue chart
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.plot(months, revenue_data, marker='o', linewidth=2, markersize=8)
        ax.set_title('Monthly Revenue (2025)')
        ax.set_xlabel('Month')
        ax.set_ylabel('Revenue ($)')
        ax.grid(True, linestyle='--', alpha=0.7)
        
        # Add value labels
        for i, v in enumerate(revenue_data):
            ax.text(i, v + 3000, f"${v:,.0f}", ha='center')
        
        st.pyplot(fig)
        
        # Revenue sources
        st.subheader("Revenue Sources")
        
        revenue_sources = {
            "Product Sales": 65,
            "Services": 25,
            "Subscriptions": 10
        }
        
        fig, ax = plt.subplots()
        ax.pie(revenue_sources.values(), labels=revenue_sources.keys(), autopct='%1.1f%%',
               startangle=90, shadow=True)
        ax.axis('equal')
        st.pyplot(fig)
    
    with tabs[1]:
        st.subheader("Expense Breakdown")
        
        # Stacked expense chart
        expense_df = pd.DataFrame(expense_categories, index=months)
        
        fig, ax = plt.subplots(figsize=(10, 6))
        expense_df.plot(kind='bar', stacked=True, ax=ax)
        ax.set_title('Monthly Expenses by Category (2025)')
        ax.set_xlabel('Month')
        ax.set_ylabel('Amount ($)')
        ax.legend(title='Expense Category')
        
        st.pyplot(fig)
        
        # Expense distribution
        total_expenses = {category: sum(amounts) for category, amounts in expense_categories.items()}
        
        fig, ax = plt.subplots()
        ax.pie(total_expenses.values(), labels=total_expenses.keys(), autopct='%1.1f%%',
               startangle=90, shadow=True)
        ax.axis('equal')
        ax.set_title('Expense Distribution by Category')
        
        st.pyplot(fig)
    
    with tabs[2]:
        st.subheader("Profit Margins")
        
        # Calculate profits and margins
        profits = [r - sum(cat[i] for cat in expense_categories.values()) for i, r in enumerate(revenue_data)]
        margins = [p / r * 100 for p, r in zip(profits, revenue_data)]
        
        fig, ax1 = plt.subplots(figsize=(10, 6))
        
        color = 'tab:blue'
        ax1.set_xlabel('Month')
        ax1.set_ylabel('Amount ($)', color=color)
        ax1.bar(months, profits, color=color, alpha=0.7, label='Profit')
        ax1.tick_params(axis='y', labelcolor=color)
        
        ax2 = ax1.twinx()
        color = 'tab:red'
        ax2.set_ylabel('Margin (%)', color=color)
        ax2.plot(months, margins, color=color, linewidth=2, marker='o', label='Margin')
        ax2.tick_params(axis='y', labelcolor=color)
        
        fig.tight_layout()
        fig.legend(loc='upper left', bbox_to_anchor=(0.1, 0.9))
        
        st.pyplot(fig)
        
        # Tabular data
        profit_data = {
            "Month": months,
            "Revenue": revenue_data,
            "Expenses": [sum(cat[i] for cat in expense_categories.values()) for i in range(len(months))],
            "Profit": profits,
            "Margin (%)": [f"{m:.1f}%" for m in margins]
        }
        
        st.dataframe(pd.DataFrame(profit_data), use_container_width=True)
    
    with tabs[3]:
        st.subheader("Revenue Forecast")
        
        # Simple linear forecast for next 6 months
        import numpy as np
        from scipy import stats
        
        x = np.arange(len(months))
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, revenue_data)
        
        forecast_months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        forecast_x = np.arange(len(months), len(months) + len(forecast_months))
        forecast_revenue = [slope * i + intercept for i in forecast_x]
        
        all_months = months + forecast_months
        all_revenue = revenue_data + forecast_revenue
        
        fig, ax = plt.subplots(figsize=(12, 6))
        ax.plot(months, revenue_data, marker='o', color='blue', label='Actual')
        ax.plot(forecast_months, forecast_revenue, marker='x', linestyle='--', color='red', label='Forecast')
        ax.set_title('Revenue Forecast (2025)')
        ax.set_xlabel('Month')
        ax.set_ylabel('Revenue ($)')
        ax.legend()
        ax.grid(True, linestyle='--', alpha=0.7)
        
        # Add value labels
        for i, v in enumerate(all_revenue):
            ax.text(i, v + 3000, f"${v:,.0f}", ha='center')
        
        st.pyplot(fig)
        
        # Prediction confidence
        st.info(f"Forecast confidence (R²): {r_value**2:.2f}")
        
        # Adjustable forecast
        st.subheader("Adjust Forecast")
        
        growth_rate = st.slider("Monthly Growth Rate (%)", -10.0, 20.0, 5.0, 0.5)
        start_value = revenue_data[-1]
        
        custom_forecast = [start_value]
        for _ in range(len(forecast_months) - 1):
            next_value = custom_forecast[-1] * (1 + growth_rate / 100)
            custom_forecast.append(next_value)
        
        fig, ax = plt.subplots(figsize=(12, 6))
        ax.plot(months, revenue_data, marker='o', color='blue', label='Actual')
        ax.plot(forecast_months, custom_forecast, marker='s', linestyle='--', color='green', label=f'Custom ({growth_rate}% growth)')
        ax.set_title('Custom Revenue Forecast (2025)')
        ax.set_xlabel('Month')
        ax.set_ylabel('Revenue ($)')
        ax.legend()
        ax.grid(True, linestyle='--', alpha=0.7)
        
        st.pyplot(fig)

# Settings page
def render_settings():
    st.markdown('<h2 class="sub-header">System Settings</h2>', unsafe_allow_html=True)
    
    tabs = st.tabs(["General Settings", "Model Configuration", "Integration Settings", "User Management"])
    
    with tabs[0]:
        st.subheader("General Settings")
        
        system_name = st.text_input("System Name:", "LISA - Local Intelligent System Assistant")
        
        col1, col2 = st.columns(2)
        with col1:
            theme = st.selectbox("UI Theme:", ["Light", "Dark", "System Default"])
            language = st.selectbox("Language:", ["English", "Spanish", "French", "German", "Chinese", "Japanese"])
        
        with col2:
            timezone = st.selectbox("Timezone:", ["(UTC-08:00) Pacific Time", "(UTC-05:00) Eastern Time", "(UTC+00:00) UTC", "(UTC+01:00) Central European Time", "(UTC+08:00) China Standard Time"])
            date_format = st.selectbox("Date Format:", ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"])
        
        st.divider()
        
        st.subheader("System Resources")
        
        memory_limit = st.slider("Memory Limit (GB)", 4, 32, 16, 1)
        enable_disk_offloading = st.checkbox("Enable Disk Offloading for Large Models", value=True)
        cpu_threads = st.slider("CPU Threads", 1, 16, 4, 1)
        
        if st.button("Save General Settings"):
            st.success("Settings saved successfully!")
    
    with tabs[1]:
        st.subheader("Model Configuration")
        
        models = {
            "coordinator": {"name": "OpenHermes-2.5-Mistral-7B-GGUF", "type": "GGUF", "quantization": "Q4_K_M", "context_length": 4096},
            "outreach": {"name": "Nous-Hermes-2-SOLAR-10.7B-GGUF", "type": "GGUF", "quantization": "Q4_K_M", "context_length": 4096},
            "data_analyzer": {"name": "DeepCoder-14B-Preview-GGUF", "type": "GGUF", "quantization": "Q4_K_M", "context_length": 4096},
            "finance": {"name": "Dolphin-2.5-Mistral-7B-GGUF", "type": "GGUF", "quantization": "Q4_K_M", "context_length": 4096},
            "vision": {"name": "Kimi-VL-A3B", "type": "HF", "quantization": "None", "context_length": 2048}
        }
        
        for agent_name, model_info in models.items():
            with st.expander(f"{agent_name.capitalize()} Model"):
                col1, col2 = st.columns(2)
                
                with col1:
                    st.text_input(f"Model Name:", model_info["name"], key=f"model_name_{agent_name}")
                    st.selectbox(f"Model Type:", ["GGUF", "HF (Hugging Face)"], 
                                index=0 if model_info["type"] == "GGUF" else 1, key=f"model_type_{agent_name}")
                
                with col2:
                    st.selectbox(f"Quantization:", ["None", "Q5_K_M", "Q4_K_M", "Q3_K_S", "Q2_K"], 
                                index=["None", "Q5_K_M", "Q4_K_M", "Q3_K_S", "Q2_K"].index(model_info["quantization"]) if model_info["quantization"] in ["None", "Q5_K_M", "Q4_K_M", "Q3_K_S", "Q2_K"] else 0,
                                key=f"quant_{agent_name}")
                    st.number_input(f"Context Length:", min_value=512, max_value=32768, step=512, value=model_info["context_length"], key=f"ctx_{agent_name}")
        
        if st.button("Save Model Settings"):
            st.success("Model settings saved! Changes will take effect on system restart.")
    
    with tabs[2]:
        st.subheader("Integration Settings")
        
        st.write("API Configuration")
        enable_api = st.checkbox("Enable API", value=True)
        api_port = st.number_input("API Port:", min_value=1000, max_value=65535, value=5000)
        api_host = st.text_input("API Host:", "127.0.0.1")
        
        st.divider()
        
        st.write("MCP Server Integration")
        enable_mcp = st.checkbox("Enable MCP Integration", value=True)
        mcp_servers = st.multiselect("MCP Servers:", ["content-assistant", "dev-assistant"], default=["content-assistant", "dev-assistant"])
        
        st.divider()
        
        st.write("External Services")
        enable_email = st.checkbox("Enable Email Integration", value=False)
        smtp_server = st.text_input("SMTP Server:", "smtp.example.com", disabled=not enable_email)
        smtp_port = st.number_input("SMTP Port:", min_value=1, max_value=65535, value=587, disabled=not enable_email)
        
        if st.button("Save Integration Settings"):
            st.success("Integration settings saved successfully!")
    
    with tabs[3]:
        st.subheader("User Management")
        
        st.write("This is a placeholder for user management. In a production system, this would allow adding and managing users with different permission levels.")
        
        st.info("User management is not implemented in this demo.")

# Main function to run the application
def main():
    # Initialize session state
    init_session_state()
    
    # Load custom CSS
    load_css()
    
    # Render header
    render_header()
    
    # Render sidebar and get selected page
    selected_page = render_sidebar()
    
    # Render the selected page
    if selected_page == "Dashboard":
        render_dashboard_overview()
    elif selected_page == "Chat Interface":
        render_chat_interface()
    elif selected_page == "Document Analysis":
        render_document_analysis()
    elif selected_page == "Client Management":
        render_client_management()
    elif selected_page == "Financial Tracking":
        render_financial_tracking()
    elif selected_page == "Settings":
        render_settings()

# Run the app
if __name__ == "__main__":
    main()
