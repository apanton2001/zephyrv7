# Zephyr Warehouse Management System

A comprehensive Next.js warehouse management system designed for Vercel deployment, featuring a dark-mode optimized interface with real-time data visualization, predictive analytics, and seven-stage order processing.

![Zephyr WMS](https://via.placeholder.com/1200x600?text=Zephyr+Warehouse+Management+System)

## Features

- **Dark-mode optimized interface** for warehouse environments
- **Real-time data visualization** through WebSockets/Firebase
- **Predictive analytics** for inventory management and demand forecasting
- **Seven-stage order processing** workflow
- **AR picking assistant** for efficient item location
- **Warehouse efficiency scoring system**
- **Interactive dashboard** with KPIs
- **Streamlined invoice processing** with OCR capabilities
- **Comprehensive inventory management** with location tracking
- **Role-based access control**
- **Integration with major shipping providers and financial systems**
- **Mobile responsiveness** for warehouse floor operations

## Architecture

Zephyr is built using the Model-Controller-Presenter (MCP) architecture pattern, which provides a clean separation of concerns:

- **Model**: Manages data, business logic, and rules of the application
- **Controller**: Handles user input, orchestrates data flow, and manages application state
- **Presenter**: Prepares data for display and manages UI logic

### Tech Stack

- **Frontend**: React/Next.js, Tailwind CSS
- **State Management**: Zustand/React Query
- **Real-time Updates**: WebSockets/Firebase
- **API**: RESTful API with Next.js API routes
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Firebase account (for real-time features)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/zephyr-warehouse-system.git
cd zephyr-warehouse-system
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Database
DATABASE_URL=your-database-url
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Project Structure

```
zephyr-warehouse-system/
├── components/           # Reusable UI components
│   ├── common/           # Shared components
│   ├── inventory/        # Inventory-specific components
│   ├── orders/           # Order-specific components
│   └── dashboard/        # Dashboard components
├── models/               # Data models and business logic
├── controllers/          # Application controllers
├── presenters/           # UI presenters
├── pages/                # Next.js pages
│   ├── api/              # API routes
│   ├── inventory/        # Inventory pages
│   ├── orders/           # Order pages
│   └── dashboard/        # Dashboard pages
├── public/               # Static assets
├── styles/               # Global styles
├── lib/                  # Shared utilities
├── hooks/                # Custom React hooks
├── contexts/             # React contexts
├── services/             # External service integrations
└── prisma/               # Database schema and migrations
```

## Development

### MCP Architecture

The Model-Controller-Presenter (MCP) architecture is implemented as follows:

1. **Models** (`/models`): Handle data and business logic
   - Define data structures
   - Implement business rules
   - Manage data persistence

2. **Controllers** (`/controllers`): Coordinate between models and presenters
   - Process user input
   - Orchestrate data flow
   - Manage application state

3. **Presenters** (`/presenters`): Prepare data for UI consumption
   - Transform model data for display
   - Handle UI-specific logic
   - Manage UI state

### API Routes

The API follows RESTful principles:

- `GET /api/inventory`: Get all inventory items
- `POST /api/inventory`: Create a new inventory item
- `GET /api/inventory/:id`: Get a specific inventory item
- `PUT /api/inventory/:id`: Update a specific inventory item
- `DELETE /api/inventory/:id`: Delete a specific inventory item
- `GET /api/inventory/movements?itemId=:id`: Get movements for a specific item
- `POST /api/inventory/movements`: Record a new inventory movement

## Deployment

### Vercel Deployment

1. Push your code to a GitHub repository.
2. Create a new project on Vercel.
3. Import your GitHub repository.
4. Configure environment variables.
5. Deploy the application.

## Documentation

For more detailed documentation, see the following:

- [Product Requirements Document](./docs/product_requirements_document.md)
- [Architecture Design](./docs/architecture_design.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/)
- [Vercel](https://vercel.com/)