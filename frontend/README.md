# Personal Assistant - React Native Frontend

A modern React Native frontend for the Personal Assistant API, built with Expo and featuring a beautiful glassmorphism UI design.

## Features

- 💬 **Chat Interface**: Natural language conversation with the AI assistant
- 📝 **Activity Logs**: View and manage your logged activities
- 🔔 **Reminders**: Set, view, and manage reminders
- 🎨 **Glassmorphism UI**: Modern, clean design with glass-like effects
- 📱 **Cross-Platform**: Works on iOS and Android via Expo Go
- 🔧 **TypeScript**: Fully typed for better development experience

## Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Expo Blur** for glassmorphism effects
- **Expo Linear Gradient** for beautiful gradients
- **Vector Icons** for consistent iconography

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Scan the QR code with Expo Go app on your mobile device

### Backend Integration

Make sure your backend server is running on `http://localhost:3000` before using the app. The frontend will automatically connect to the backend API endpoints.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── GlassContainer.tsx
│   ├── GlassButton.tsx
│   ├── GlassInput.tsx
│   ├── MessageBubble.tsx
│   ├── LogCard.tsx
│   └── ReminderCard.tsx
├── screens/            # Main app screens
│   ├── ChatScreen.tsx
│   ├── LogsScreen.tsx
│   └── RemindersScreen.tsx
├── navigation/         # Navigation setup
│   └── AppNavigator.tsx
├── services/          # API services
│   └── apiService.ts
├── styles/            # Styling and themes
│   ├── colors.ts
│   └── glassmorphism.ts
└── types/             # TypeScript type definitions
    └── index.ts
```

## Usage

### Chat Interface
- Type natural language messages to interact with the AI
- Examples:
  - "Log that I woke up at 7:30 AM"
  - "Remind me to call mom at 9 PM"
  - "What did I log today?"

### Activity Logs
- View all your logged activities
- Delete logs you no longer need
- See timestamps and original input

### Reminders
- View all your reminders
- Mark reminders as completed
- Delete reminders you no longer need
- See completion status

## API Endpoints

The app integrates with the following backend endpoints:

- `POST /api/chat` - Send messages to the AI assistant
- `GET /api/health` - Check API health status
- `GET /` - Get API information

## Customization

### Colors
Edit `src/styles/colors.ts` to customize the color palette.

### Glassmorphism Effects
Modify `src/styles/glassmorphism.ts` to adjust the glass-like effects.

### Components
All components are fully customizable and can be modified in the `src/components/` directory.

## Development

### TypeScript
The project uses TypeScript for better development experience. All types are defined in `src/types/index.ts`.

### Styling
The app uses a combination of:
- Glassmorphism effects with blur and transparency
- Linear gradients for visual appeal
- Consistent spacing and typography
- Vibrant color palette

### Navigation
Uses React Navigation with bottom tabs for easy navigation between screens.

## Troubleshooting

### Common Issues

1. **Backend Connection Error**: Make sure the backend server is running on port 3000
2. **Expo Go Connection**: Ensure your mobile device and computer are on the same network
3. **TypeScript Errors**: Run `npx tsc --noEmit` to check for type errors

### Performance

- The app uses FlatList for efficient rendering of long lists
- Images and gradients are optimized for mobile performance
- Glassmorphism effects are hardware-accelerated where possible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Personal Assistant application suite.
