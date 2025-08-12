# Rental Management Frontend

A modern React frontend for the Rental Management system, built with Vite and designed to match the provided UI/UX wireframes.

## Features

- **Authentication**: Login and registration with JWT tokens
- **Product Browsing**: Grid and list view with filtering and search
- **Product Details**: Detailed product view with rental options
- **Responsive Design**: Mobile-first approach with responsive layouts
- **Modern UI**: Clean, modern interface matching the wireframes

## Pages

- **Home**: Landing page with hero section and features
- **Login**: User authentication page
- **Register**: User registration page
- **Rental Shop**: Product browsing with filters and search
- **Product Detail**: Individual product view with rental options
- **Wishlist**: User's saved products (protected route)
- **Cart**: Shopping cart (protected route)
- **Profile**: User profile management (protected route)
- **Contact**: Contact information page

## Tech Stack

- **React 19**: Latest React with hooks
- **React Router**: Client-side routing
- **Vite**: Fast build tool and dev server
- **Axios**: HTTP client for API calls
- **Font Awesome**: Icons
- **CSS3**: Modern styling with Flexbox and Grid

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### API Configuration

The frontend is configured to connect to the Django backend at `http://localhost:8000/api`. Make sure your backend is running and accessible at this URL.

You can modify the API base URL in `src/constants.js`:

```javascript
export const API_BASE_URL = 'http://localhost:8000/api';
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Header.jsx      # Navigation header
│   └── ProtectedRoute.js # Authentication wrapper
├── pages/              # Page components
│   ├── Home.jsx        # Landing page
│   ├── Login.jsx       # Login page
│   ├── Register.jsx    # Registration page
│   ├── RentalShop.jsx  # Product browsing
│   ├── ProductDetail.jsx # Product details
│   └── ...            # Other pages
├── styles/             # Global styles
│   └── global.css     # Base styles and utilities
├── api.js             # API functions
├── constants.js       # App constants and routes
├── App.jsx           # Main app component
└── main.jsx          # Entry point
```

## Authentication

The app uses JWT tokens for authentication. Tokens are stored in localStorage and automatically included in API requests. Protected routes redirect to login if the user is not authenticated.

## Responsive Design

The frontend is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## API Integration

The frontend integrates with the Django backend APIs:

- **Authentication**: `/api/login/`, `/api/register/`, `/api/logout/`
- **Products**: `/api/products/`, `/api/products/{id}/`
- **Product Prices**: `/api/products/{id}/prices/`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses ESLint for code quality. Run `npm run lint` to check for issues.

## Deployment

The frontend can be deployed to any static hosting service:

1. Build the project: `npm run build`
2. Upload the `dist` folder to your hosting service

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Rental Management system.
