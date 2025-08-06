# Global System for Mobile Community-Based Notice

A comprehensive React Native (Expo) mobile application for location-based community notices with real-time chat functionality.

## Features

### 🔐 Authentication
- Firebase email/password authentication
- Google Sign-In integration
- Secure user profile management
- Password reset functionality

### 📍 Location-Based Notices
- Create notices (events, alerts, news) with location tagging
- Real-time location-based filtering
- Image upload support via Firebase Storage
- Priority-based notice categorization (low, medium, high, emergency)
- User interactions (RSVP, comments, likes, share)

### 💬 Real-Time Chat System
- WhatsApp-style messaging interface
- Group chat functionality
- Text and image messaging
- Real-time message synchronization
- Chat room management

### 🔔 Push Notifications
- Firebase Cloud Messaging integration
- Location-based notice alerts
- Chat message notifications
- Emergency alert system

### 🌤️ Weather Integration
- Automated weather alert notices
- Location-based weather monitoring
- Emergency weather notifications

### 🎨 Modern UI/UX
- Beautiful gradient designs
- Smooth animations and transitions
- Dark mode support
- Responsive layout for all screen sizes
- Clean, intuitive interface

## Setup Instructions

### 1. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)

2. Enable the following services:
   - Authentication (Email/Password and Google)
   - Realtime Database
   - Storage
   - Cloud Messaging

3. Add your Android/iOS app to the Firebase project

4. Download and add configuration files:
   - `google-services.json` for Android
   - `GoogleService-Info.plist` for iOS

5. Update `config/firebase.ts` with your Firebase configuration

### 2. Google Sign-In Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Sign-In API
3. Create OAuth 2.0 credentials
4. Update the `webClientId` in `hooks/useFirebaseAuth.ts`

### 3. Weather API Setup

1. Get an API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Update `API_KEY` in `services/WeatherService.ts`

### 4. Environment Setup

1. Install dependencies:
```bash
npm install
```

2. Install development build for testing on device:
```bash
npx expo install --fix
```

### 5. Database Structure

The app uses Firebase Realtime Database with the following structure:

```
{
  "users": {
    "userId": {
      "id": "string",
      "email": "string",
      "displayName": "string",
      "photoURL": "string",
      "location": {
        "latitude": "number",
        "longitude": "number",
        "address": "string"
      },
      "createdAt": "string"
    }
  },
  "notices": {
    "noticeId": {
      "id": "string",
      "authorId": "string",
      "authorName": "string",
      "type": "event|alert|news",
      "title": "string",
      "description": "string",
      "imageUrl": "string",
      "location": {
        "latitude": "number",
        "longitude": "number",
        "address": "string"
      },
      "priority": "low|medium|high|emergency",
      "createdAt": "string",
      "rsvpList": ["userId1", "userId2"],
      "likes": ["userId1", "userId2"],
      "comments": [
        {
          "id": "string",
          "authorId": "string",
          "authorName": "string",
          "text": "string",
          "createdAt": "string"
        }
      ]
    }
  },
  "chatRooms": {
    "roomId": {
      "id": "string",
      "name": "string",
      "type": "private|group",
      "members": ["userId1", "userId2"],
      "createdBy": "string",
      "createdAt": "string",
      "lastMessage": "ChatMessage",
      "lastMessageTime": "string"
    }
  },
  "chatMessages": {
    "roomId": {
      "messageId": {
        "id": "string",
        "roomId": "string",
        "senderId": "string",
        "senderName": "string",
        "text": "string",
        "imageUrl": "string",
        "type": "text|image",
        "timestamp": "string",
        "read": "boolean"
      }
    }
  }
}
```

## Development

### Running the App

```bash
# Start the development server
npm run dev

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Building for Production

```bash
# Build for production
expo build

# Create development build
expo install --fix
eas build --profile development
```

## Security Rules

### Realtime Database Rules

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "notices": {
      ".read": "auth != null",
      "$noticeId": {
        ".write": "auth != null && (auth.uid == data.child('authorId').val() || !data.exists())"
      }
    },
    "chatRooms": {
      "$roomId": {
        ".read": "auth != null && data.child('members').child(auth.uid).exists()",
        ".write": "auth != null && (data.child('members').child(auth.uid).exists() || !data.exists())"
      }
    },
    "chatMessages": {
      "$roomId": {
        ".read": "auth != null && root.child('chatRooms').child($roomId).child('members').child(auth.uid).exists()",
        ".write": "auth != null && root.child('chatRooms').child($roomId).child('members').child(auth.uid).exists()"
      }
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Features Overview

### Notice Management
- Create notices with rich content (title, description, images)
- Automatic location tagging
- Real-time location-based filtering
- Priority-based categorization
- Community interactions (likes, comments, RSVP)

### Chat System
- Real-time messaging with Firebase Realtime Database
- Image sharing capabilities
- Group chat management
- Message status indicators

### Location Services
- Automatic location detection
- Geofenced notice delivery
- Location-based community discovery
- Privacy-conscious location sharing

### Notification System
- Push notifications for new notices
- Chat message alerts
- Emergency notifications
- Weather alert integration

## Architecture

The app follows a modular architecture with:

- **Services Layer**: Firebase integration, location services, notifications
- **Hooks Layer**: Custom React hooks for state management
- **Components Layer**: Reusable UI components
- **Screens Layer**: Tab-based navigation with Expo Router

## Performance Optimizations

- Real-time data synchronization with Firebase
- Efficient image loading and caching
- Location-based data filtering
- Optimized FlatList rendering
- Background task handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.