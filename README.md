# WildShare

WildShare is a simple file-sharing application built with React and Node.js. Users can upload images, and the application provides a shareable link for each uploaded file.

## Features

- **File Upload**: Easily upload image files through an intuitive interface.
- **Copy Link**: Copy the generated link to share with others.
- **Progress Bar**: Track the progress of file uploads.
- **Responsive Design**: Works seamlessly on various devices.

## Technologies Used

- **Frontend**:

  - React
  - Material-UI

- **Backend**:
  - Node.js
  - Express
  - MongoDB
  - Multer (file upload)

## Getting Started

### Configuration

1. Create a `.env` file in the `backend` directory to configure your MongoDB connection and other environment variables:

   ```env
   MONGO_URI = <your-mongodb-uri>

   APP_BASE_URL = <your-frontend-url>
   ```

2. Update the frontend API endpoint in `frontend/src/Constants.js`:

   ```jsx
   class Constants {
     static API_URL = "<your-api-url>";
   }
   ```

   Make sure to import the `Constants` class and use `${Constants.API_URL}` in place of the API URL.

### Running the Application

1. Start the backend server:

   ```bash
   cd backend
   npm index.js
   ```

2. Start the frontend application:

   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000` to use WildShare.
