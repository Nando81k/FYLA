# FYLA Project Setup Guide

This guide will help you set up the FYLA project for development.

## Prerequisites

### For Frontend (React Native)
- **Node.js** (v18 or later)
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **iOS Simulator** (for macOS) or **Android Studio** (for Android development)
- **React Native development environment** set up

### For Backend (.NET Core)
- **.NET 8 SDK** or later
- **Visual Studio** (recommended) or **Visual Studio Code** with C# extension
- **SQL Server** or **PostgreSQL** (for database)
- **Entity Framework Core CLI**: `dotnet tool install --global dotnet-ef`

## Project Structure

```
FYLA/
├── README.md
├── docs/                          # Documentation
├── frontend/                      # React Native app
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── common/          # Generic components
│   │   │   ├── auth/            # Authentication components
│   │   │   ├── feed/            # Feed-related components
│   │   │   ├── booking/         # Booking components
│   │   │   └── chat/            # Chat components
│   │   ├── screens/             # Screen components
│   │   │   ├── auth/            # Login, Register, etc.
│   │   │   ├── client/          # Client-specific screens
│   │   │   ├── provider/        # Provider-specific screens
│   │   │   └── shared/          # Shared screens
│   │   ├── navigation/          # Navigation configuration
│   │   ├── services/            # API services
│   │   ├── types/               # TypeScript type definitions
│   │   ├── utils/               # Utility functions
│   │   ├── hooks/               # Custom React hooks
│   │   └── context/             # React Context providers
│   ├── assets/                  # Images, fonts, etc.
│   ├── App.tsx                  # Main app component
│   ├── package.json
│   ├── tsconfig.json
│   └── app.json                 # Expo configuration
└── backend/                     # ASP.NET Core API
    ├── FYLA.sln                # Solution file
    ├── FYLA.API/               # Web API project
    │   ├── Controllers/        # API controllers
    │   ├── Middleware/         # Custom middleware
    │   └── Hubs/              # SignalR hubs
    ├── FYLA.Core/              # Domain models and interfaces
    │   ├── Entities/           # Domain entities
    │   ├── Interfaces/         # Repository interfaces
    │   └── DTOs/              # Data transfer objects
    ├── FYLA.Application/       # Business logic
    │   ├── Services/           # Application services
    │   └── Mappers/           # Object mapping
    └── FYLA.Infrastructure/    # Data access
        ├── Data/              # DbContext and configurations
        ├── Repositories/      # Repository implementations
        └── Migrations/        # Database migrations
```

## Setup Instructions

### 1. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Fix package compatibility for Expo 53:**
   ```bash
   npx expo install --fix
   ```

4. **Add required React Native packages (if not already installed):**
   ```bash
   npm install @react-native-async-storage/async-storage
   npm install react-native-vector-icons
   npm install @react-native-community/netinfo
   ```

5. **Start the development server:**
   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

### 2. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Restore NuGet packages:**
   ```bash
   dotnet restore
   ```

3. **Set up the database:**
   - Install SQL Server or PostgreSQL
   - Update connection string in `FYLA.API/appsettings.json`
   - Run migrations:
     ```bash
     dotnet ef database update --project FYLA.Infrastructure --startup-project FYLA.API
     ```

4. **Run the API:**
   ```bash
   dotnet run --project FYLA.API
   ```

   The API will be available at `https://localhost:7000` or `http://localhost:5000`

### 3. Database Setup

#### SQL Server (Recommended)
1. Install SQL Server (LocalDB is sufficient for development)
2. Update connection string in `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=FylaDb;Trusted_Connection=true;MultipleActiveResultSets=true"
     }
   }
   ```

#### PostgreSQL (Alternative)
1. Install PostgreSQL
2. Update connection string in `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Database=fyladb;Username=postgres;Password=yourpassword"
     }
   }
   ```
3. Update `FYLA.Infrastructure.csproj` to use PostgreSQL:
   ```xml
   <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.0" />
   ```

## Development Workflow

### Frontend Development
- Use **Expo** for fast development and testing
- Hot reload is enabled by default
- Use **React Native Debugger** or **Flipper** for debugging
- Run `npm run lint` to check code quality

### Backend Development
- Use **Swagger** (available at `/swagger`) for API documentation
- Use **Entity Framework migrations** for database changes
- Run tests with `dotnet test`
- Use **Hot Reload** in Visual Studio for faster development

### Adding New Features

#### Frontend
1. Create types in `src/types/`
2. Create services in `src/services/`
3. Create components in appropriate `src/components/` subdirectory
4. Create screens in appropriate `src/screens/` subdirectory
5. Update navigation if needed

#### Backend
1. Create/update entities in `FYLA.Core/Entities/`
2. Create DTOs in `FYLA.Core/DTOs/`
3. Create/update repositories in `FYLA.Infrastructure/Repositories/`
4. Create services in `FYLA.Application/Services/`
5. Create controllers in `FYLA.API/Controllers/`
6. Add/update migrations: `dotnet ef migrations add MigrationName`

## Environment Configuration

### Frontend (.env files)
Create `.env` files for different environments:
```
API_BASE_URL=http://localhost:5000/api
GOOGLE_MAPS_API_KEY=your_api_key
FIREBASE_CONFIG=your_firebase_config
```

### Backend (appsettings.json)
Configure different settings for development/production:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "your_connection_string"
  },
  "JwtSettings": {
    "SecretKey": "your-super-secret-key-here",
    "Issuer": "FylaAPI",
    "Audience": "FylaApp",
    "ExpirationHours": 24
  },
  "FirebaseSettings": {
    "ProjectId": "your-firebase-project-id",
    "PrivateKey": "your-private-key"
  }
}
```

## Common Issues & Solutions

### Frontend
- **Metro bundler issues**: Clear cache with `expo start -c`
- **iOS build issues**: Clean build folder and rebuild
- **Android issues**: Ensure Android SDK is properly configured

### Backend
- **Database connection issues**: Check connection string and ensure database server is running
- **CORS issues**: Configure CORS in `Program.cs`
- **Migration issues**: Drop database and re-run migrations in development

## Next Steps

1. **Authentication**: Implement JWT authentication
2. **Database**: Set up and seed the database
3. **API Endpoints**: Create core API endpoints
4. **UI Components**: Build core UI components
5. **Navigation**: Implement navigation flow
6. **Real-time Features**: Set up SignalR for chat
7. **File Upload**: Implement image/video upload
8. **Maps Integration**: Add maps for location features
9. **Push Notifications**: Set up Firebase/OneSignal
10. **Testing**: Add unit and integration tests

## Useful Commands

### Frontend
```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Backend
```bash
# Run the API
dotnet run --project FYLA.API

# Run with hot reload
dotnet watch run --project FYLA.API

# Create migration
dotnet ef migrations add MigrationName --project FYLA.Infrastructure --startup-project FYLA.API

# Update database
dotnet ef database update --project FYLA.Infrastructure --startup-project FYLA.API

# Run tests
dotnet test

# Build solution
dotnet build
```
