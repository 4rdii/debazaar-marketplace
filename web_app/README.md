# Telegram Crypto Marketplace MVP

A Django + PostgreSQL backend for a Telegram Mini App marketplace for digital goods.

## Quick Start with Docker

```bash
# Start the services
docker-compose up --build

# Access the services
- Django API: http://localhost:8000
- Django Admin: http://localhost:8000/admin (admin/admin123)
- PostgreSQL: localhost:5432
```

## Project Structure

```
backend/
├── crypto_marketplace/     # Django project settings
├── marketplace/            # Main app with models, views, APIs
├── requirements.txt        # Python dependencies
├── Dockerfile             # Django container
└── entrypoint.sh          # Database setup script

docker-compose.yml         # PostgreSQL + Django services
```

## Models

- **UserProfile**: Telegram users with wallet addresses and ratings
- **Listing**: Digital goods for sale
- **Order**: Purchase transactions with escrow status
- **Dispute**: Conflict resolution system
- **MockSmartContract**: Placeholder blockchain functions

## Features

- PostgreSQL database with proper relations
- Django admin interface for management
- Mock smart contract functions (returns True)
- Ready for Telegram Mini App integration
- Docker-based development environment

## Next Steps

1. Add Django REST Framework APIs
2. Implement Telegram Bot authentication  
3. Create React frontend for Mini App
4. Connect wallet integration
5. Replace mock functions with real smart contracts




