# Zephyr System Architecture

This document provides a high-level overview of the Zephyr AI-powered warehouse management system architecture.

## Monorepo Structure

- `web/` — React/Next.js + TypeScript web app
- `backend/` — Node.js/Express (or NestJS) microservices
- `ios/` — Swift/SwiftUI native iOS app
- `ai-services/` — Python/Node.js AI/ML microservices
- `devops/` — CI/CD, Docker, Kubernetes, monitoring
- `docs/` — Documentation

## System Diagram

```mermaid
graph TD
  A[API Gateway & Load Balancer]
  A --> B1[Inventory Microservice]
  A --> B2[Order Microservice]
  A --> B3[User & Access Microservice]
  A --> B4[Analytics & AI Microservice]
  B1 --> C1[(Inventory DB)]
  B2 --> C2[(Order DB)]
  B3 --> C3[(User DB)]
  B4 --> D1[OpenAI/Perplexity APIs]
  B4 --> D2[(Analytics Data Lake)]
  A --> E1[Web App (React/Next.js)]
  A --> E2[iOS App (Swift/SwiftUI)]
```

## Key Components

- **API Gateway**: Central entry point, routing, auth, rate limiting.
- **Microservices**: Inventory, Orders, Users, Analytics/AI, etc.
- **Databases**: PostgreSQL (relational), NoSQL/Redis (caching), Data Lake (analytics).
- **AI/ML**: Python/Node.js microservices, OpenAI/Perplexity integration.
- **Web App**: React/Next.js, TypeScript, Tailwind, Redux, Shadcn UI.
- **iOS App**: Swift, SwiftUI, Combine, CoreData.
- **DevOps**: Docker, Kubernetes, CI/CD, monitoring, logging.

## Security

- JWT/OAuth2 authentication
- Role-based access control (RBAC)
- Data encryption in transit and at rest
- Audit logging and monitoring

## Scalability

- Microservices architecture
- Horizontal scaling with Kubernetes
- Caching and read replicas
- Event-driven and serverless components

## Next Steps

- See each package's README for module scaffolding and development instructions.
- See `docs/` for API specs, database schema, and onboarding guides.