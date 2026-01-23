# Production-ready PostgreSQL 16 image based on Alpine Linux
FROM postgres:16-alpine

# Set default environment variables
# Note: These should be overridden in production using env files or secrets
ENV POSTGRES_DB=taskgenie
ENV POSTGRES_USER=genie
ENV POSTGRES_PASSWORD=genie_pass

# Expose the default PostgreSQL port
EXPOSE 5432

# Healthcheck to ensure database is ready
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
    CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB
