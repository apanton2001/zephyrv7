# Zephyr Backend

This package contains the Node.js/Express (or NestJS) microservices for the Zephyr warehouse management system.

## Microservices to Implement

- Inventory Management Service
- Order Management Service
- AI Forecasting Service (integration with OpenAI/Perplexity)
- User & Access Control (IAM, JWT, RBAC)
- Product Location Service
- Task Management Service
- Financial Reporting Service
- Client CRM Service
- API Gateway

## Tech Stack

- Node.js, Express or NestJS, Sequelize ORM, PostgreSQL, JWT, REST/GraphQL, Docker

## Getting Started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in your environment variables.
3. Run the dev server: `npm run dev`
4. See `/src` for service scaffolding and API routes.

---

Each microservice is modular and can be developed, tested, and deployed independently.