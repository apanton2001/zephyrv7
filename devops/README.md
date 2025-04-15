# Zephyr DevOps

This package contains DevOps, CI/CD, containerization, and monitoring configurations for the Zephyr platform.

## Key Features

- Dockerfiles and docker-compose for all services
- Kubernetes manifests for microservices, databases, and ingress
- GitHub Actions and Jenkins pipelines for CI/CD
- Monitoring and alerting with Prometheus, Grafana, and ELK stack
- Secrets management and environment variable templates
- Automated backup and disaster recovery scripts

## Getting Started

1. See `docker-compose.yml` for local development orchestration.
2. See `k8s/` for Kubernetes manifests and deployment instructions.
3. See `.github/workflows/` for GitHub Actions CI/CD pipelines.
4. See `monitoring/` for Prometheus and Grafana setup.

---

See `docs/devops_architecture.md` for full DevOps and deployment architecture.