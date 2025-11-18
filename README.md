# Music Player Application

A full-stack music streaming application built with Next.js, Express, MongoDB, and Firebase Authentication.

## Features

- 🎵 Upload and stream music files
- 📝 Create and manage playlists
- ❤️ Favorite songs
- 🔍 Search songs, artists, and albums
- 👥 Share playlists with collaborators
- 🌐 Public playlist discovery
- 🎨 Light/Dark theme support
- 🔐 Secure authentication with Firebase

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (running on localhost:27017)
- npm or pnpm

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd music-player
   ```

2. **Install dependencies**

   ```bash
   # Install all dependencies (backend + frontend)
   pnpm install
   ```

3. **Start MongoDB**
   Make sure MongoDB is running on `mongodb://localhost:27017`

4. **Start the backend server**

   ```bash
   cd backend
   npm run dev
   ```

   Backend will run on <http://localhost:3001>

5. **Start the frontend server** (in a new terminal)

   ```bash
   cd frontend
   npm run dev
   ```

   Frontend will run on <http://localhost:3000>

6. **Open the app**
   Navigate to <http://localhost:3000>

## Tech Stack

### Frontend

- **Next.js 16** - React framework
- **Mantine UI** - Component library
- **TypeScript** - Type safety
- **Firebase Auth** - Authentication

### Backend

- **Express** - Node.js framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Firebase Admin** - Token verification
- **TypeScript** - Type safety

## Environment Variables

### Backend (.env)

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/music-player
```

### Frontend (.env)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## API Endpoints

### Songs

- `GET /songs` - Get all songs
- `POST /songs/upload` - Upload a song
- `GET /songs/:id` - Stream a song
- `GET /songs/:id/metadata` - Get song metadata

### Playlists

- `GET /playlists` - Get user's playlists
- `POST /playlists` - Create a playlist
- `GET /playlists/:id` - Get playlist details
- `PUT /playlists/:id` - Update playlist
- `DELETE /playlists/:id` - Delete playlist
- `POST /playlists/:id/songs` - Add song to playlist
- `DELETE /playlists/:id/songs/:songId` - Remove song from playlist

### Playlist Sharing

- `PUT /playlists/:id/visibility` - Update visibility
- `POST /playlists/:id/collaborators` - Add collaborator
- `DELETE /playlists/:id/collaborators/:id` - Remove collaborator
- `POST /playlists/:id/follow` - Follow playlist
- `DELETE /playlists/:id/follow` - Unfollow playlist
- `GET /playlists/public` - Get public playlists
- `GET /playlists/discover` - Discover playlists

### Favorites

- `GET /favorites` - Get favorite songs
- `POST /favorites/:songId` - Add to favorites
- `DELETE /favorites/:songId` - Remove from favorites
- `GET /favorites/:songId/status` - Check favorite status

### Search

- `GET /search?q=query` - Search songs, artists, albums, playlists

### Users

- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile
- `GET /users/:id` - Get user by ID
- `GET /users/search?q=query` - Search users

## Development

### Backend Development

```bash
cd backend
npm run dev        # Start dev server with auto-reload
npm run build      # Build TypeScript
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

### Frontend Development

```bash
cd frontend
npm run dev        # Start dev server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

## Troubleshooting

If you encounter any issues, check the [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) guide.

Common issues:

- **Backend not starting**: Check if MongoDB is running
- **Frontend can't connect**: Make sure backend is running on port 3001
- **Authentication errors**: Check Firebase configuration
- **Permission errors**: Restart the backend server

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
