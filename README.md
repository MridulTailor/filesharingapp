
<table>
  <tr>
    <td><img width="412" alt="Screenshot 2024-01-03 at 11 39 56 PM" src="https://github.com/MridulTailor/filesharingapp/assets/71081929/16628994-a301-4c10-be90-e4012e056b0b"></td>
    <td><img width="412" alt="Screenshot 2024-01-03 at 11 40 08 PM" src="https://github.com/MridulTailor/filesharingapp/assets/71081929/ea9e624e-c88f-4dfc-90ac-3dd7e90b9ddc"></td>
  </tr>
  <tr>
    <td><img width="412" alt="Screenshot 2024-01-03 at 11 37 07 PM" src="https://github.com/MridulTailor/filesharingapp/assets/71081929/eeb92366-ab96-49e3-b133-cb17d01b5415"></td>
    <td><img width="412" alt="Screenshot 2024-01-03 at 11 40 34 PM" src="https://github.com/MridulTailor/filesharingapp/assets/71081929/435b6721-4f6b-40e8-9816-f311782f9231"></td>
  </tr>
</table>


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
