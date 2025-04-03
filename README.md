# Railway Ticket Booking System

A modern web application for booking railway tickets with a user-friendly interface.

## Features

- Search trains by source and destination
- View train details including departure/arrival times and prices
- Book tickets with multiple passenger support
- Real-time seat availability checking
- Responsive design for all devices

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd railway-ticket-booking
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/railway-booking
```

4. Start MongoDB service on your machine

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000
```




-----------------------------------------------------------------------------------------------------
From Author:-

Welcome!!!

first install all node modules

second change the credentials in env file

third change in server.js alsoo

last change the port and run the module [node server.js} make sure the port is changed

-----------------------------------------------------------------------------------------------------










## Project Structure

```
railway-ticket-booking/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── server.js
├── package.json
├── .env
└── README.md
```

## API Endpoints

- `POST /api/search-trains`: Search for trains based on source, destination, and date
- `POST /api/book-ticket`: Book tickets for a selected train

## Technologies Used

- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Backend: Node.js, Express.js
- Database: MongoDB
- Styling: Custom CSS with responsive design

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 


