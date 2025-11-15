# Escrow Marketplace Frontend

Simple React frontend for the Escrow Marketplace MVP.

## Features

- **Product Listings**: View all active products from users
- **Add Product**: Simple form to post new products
- **Responsive Design**: Works on desktop and mobile
- **Clean UI**: Modern, minimal interface

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will run on `http://localhost:3000` and proxy API requests to the Django backend at `http://localhost:8000`.

## Project Structure

```
src/
├── components/
│   ├── ProductCard.js      # Individual product display
│   └── AddProductForm.js   # Modal form for adding products
├── services/
│   └── api.js             # Backend API communication
├── App.js                 # Main application component
├── App.css               # Application styles
└── index.js              # React entry point
```

## API Integration

The frontend communicates with the Django REST API:
- `GET /api/listings/` - Fetch all products
- `POST /api/listings/` - Create new product

## Technologies

- React 18 with Hooks
- Modern CSS Grid/Flexbox
- Fetch API for HTTP requests
- Responsive design principles
