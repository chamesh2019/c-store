# C-Store Express.js API

A Node.js Express.js API server for a convenience store application.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📁 Project Structure

```
c-store/
├── app.js                 # Main Express server
├── routes/
│   └── api.js            # API routes
├── public/
│   └── index.html        # Static HTML page
├── .github/
│   └── copilot-instructions.md
├── package.json          # Project configuration
└── README.md
```

## 🛠 API Endpoints

### Base Routes
- `GET /` - Welcome message and API information
- `GET /health` - Server health check

### API Routes (`/api`)
- `GET /api` - API version and available endpoints
- `GET /api/products` - Get sample products
- `GET /api/users` - Get sample users  
- `POST /api/orders` - Create a new order

### Example API Calls

#### Get Products
```bash
curl http://localhost:3000/api/products
```

#### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId": 1, "items": [{"productId": 1, "quantity": 2}]}'
```

## 🔧 Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with nodemon
- `npm test` - Run tests (not implemented yet)

## 🌐 Web Interface

Visit `http://localhost:3000` in your browser to see the web interface with API documentation and quick test links.

## 📝 Development

### Adding New Routes
1. Create route handlers in the `routes/` directory
2. Import and use them in `app.js`
3. Follow RESTful conventions

### Environment Variables
Create a `.env` file for environment-specific configuration:
```
PORT=3000
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.
