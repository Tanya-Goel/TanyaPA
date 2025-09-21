# Voice Reminder System

## Overview

The Personal AI Assistant now includes a comprehensive voice reminder system that allows you to create reminders using voice input and receive audio notifications with voice command controls.

## Features

### 🎤 Voice Input for Creating Reminders
- **Microphone Integration**: Click the microphone icon to speak your reminder
- **Natural Language Processing**: Say things like "Remind me to take my medicine at 9 PM"
- **Real-time Transcription**: See your speech converted to text in real-time
- **Voice Confirmation**: Get audio confirmation when reminders are set

### 🔊 Text-to-Speech Notifications
- **Audio Alerts**: Reminders play through your device speakers
- **Customizable Voice**: Automatically selects the best available voice
- **Repeat Options**: Configure how many times reminders should repeat (1-5 times)
- **Volume Control**: Adjustable speech rate, pitch, and volume

### 🎯 Voice Commands for Reminder Management
- **Snooze Commands**: Say "Snooze for 10 minutes" or "Remind me in 30 minutes"
- **Dismiss Commands**: Say "Dismiss", "Done", "Complete", or "Thanks"
- **Repeat Commands**: Say "Repeat" or "Say again" to hear the reminder again
- **Set Repeat Count**: Say "Repeat this 3 times" or "Remind me 5 times" to set repeat count
- **Stop Commands**: Say "Stop speaking" to silence the current reminder

### 📱 Background & Offline Support
- **Background Notifications**: Works even when the app is closed
- **Service Worker Integration**: Handles notifications in the background
- **Offline Fallback**: Voice reminders work without internet connection
- **Push Notifications**: Browser notifications with voice alerts

## How to Use

### Creating Voice Reminders

1. **Click the microphone icon** in the reminder input section
2. **Speak your reminder** clearly, for example:
   - "Remind me to call mom in 30 minutes"
   - "Remind me to take my medicine at 9 PM"
   - "Remind me to check the oven at 6 PM tomorrow"
   - "Remind me to take my medicine at 9 PM 3 times"
   - "Check the oven in 20 minutes 5 times"
3. **Wait for confirmation** - you'll hear "Got it! I'll remind you at [time] and repeat [X] times"

### Managing Active Reminders

When a reminder triggers:

1. **Voice Notification Plays**: The reminder text is spoken aloud
2. **Interactive Controls Appear**: Buttons for snooze, dismiss, repeat
3. **Voice Commands Available**: Say commands while the reminder is active
4. **Visual Feedback**: Status indicators show what's happening

### Voice Commands Reference

| Command | Example | Action |
|---------|---------|---------|
| **Snooze** | "Snooze for 10 minutes" | Postpone reminder |
| **Snooze** | "Remind me in 30 minutes" | Postpone reminder |
| **Dismiss** | "Dismiss" | Mark as complete |
| **Dismiss** | "Done" | Mark as complete |
| **Dismiss** | "Thanks" | Mark as complete |
| **Repeat** | "Repeat" | Hear reminder again |
| **Repeat** | "Say again" | Hear reminder again |
| **Set Repeat** | "Repeat this 3 times" | Set repeat count |
| **Set Repeat** | "Remind me 5 times" | Set repeat count |
| **Set Repeat** | "Set repeat to 2" | Set repeat count |
| **Stop** | "Stop speaking" | Silence current reminder |

## Technical Implementation

### Frontend Services

#### TextToSpeechService
- Handles speech synthesis using Web Speech API
- Manages voice selection and speech parameters
- Provides repeat functionality for reminders
- Includes error handling and fallbacks

#### VoiceCommandService
- Processes voice commands using Speech Recognition API
- Parses natural language commands
- Provides command suggestions and feedback
- Handles microphone permissions and errors

#### OfflineReminderService
- Manages reminders when offline
- Stores reminders in localStorage
- Provides background checking for due reminders
- Syncs with server when back online

### Backend Updates

#### Enhanced Reminder Model
```javascript
{
  text: String,
  datetime: Date,
  status: 'pending' | 'completed',
  voiceEnabled: Boolean,      // New
  repeatCount: Number,        // New (1-5)
  snoozeCount: Number,        // New
  lastSnoozedAt: Date         // New
}
```

#### Updated API Endpoints
- `POST /api/reminders` - Now accepts voice settings
- `PUT /api/reminders/:id` - Supports voice parameter updates
- Enhanced push notification system with voice data

### Service Worker Enhancements
- Background voice notification handling
- Push notification integration
- Offline reminder management
- Voice command processing

## Browser Compatibility

### Supported Browsers
- **Chrome**: Full support for all features
- **Edge**: Full support for all features  
- **Safari**: Full support for all features
- **Firefox**: Limited support (no speech recognition)

### Required Permissions
- **Microphone**: For voice input and commands
- **Notifications**: For background alerts
- **Storage**: For offline reminder storage

## Configuration Options

### Voice Settings
- **Voice Notifications**: Enable/disable audio alerts
- **Repeat Count**: Set how many times reminders repeat (1-5)
- **Speech Rate**: Adjust speaking speed
- **Volume**: Control audio volume

### Notification Settings
- **Background Alerts**: Enable notifications when app is closed
- **Push Notifications**: Browser notification integration
- **Offline Mode**: Automatic fallback when offline

## Example Use Cases

### Medical Reminders
```
User: "Remind me to take my medicine at 9 PM 3 times"
System: "Got it! I'll remind you at 9:00 PM and repeat 3 times"
[At 9 PM]
System: "Reminder: Take your medicine"
[2 second pause]
System: "Reminder: Take your medicine"
[2 second pause]
System: "Reminder: Take your medicine"
User: "Snooze for 30 minutes"
System: "Snoozed for 30 minutes"
```

### Cooking Reminders
```
User: "Remind me to check the oven in 20 minutes"
System: "Got it! I'll remind you at 3:45 PM"
[20 minutes later]
System: "Reminder: Check the oven"
User: "Done"
System: "Reminder dismissed"
```

### Meeting Reminders
```
User: "Remind me to call the client at 2 PM tomorrow"
System: "Got it! I'll remind you tomorrow at 2:00 PM"
[Next day at 2 PM]
System: "Reminder: Call the client"
User: "Repeat this 2 times"
System: "Set to repeat 2 times"
System: "Reminder: Call the client"
[2 second pause]
System: "Reminder: Call the client"
```

## Troubleshooting

### Voice Input Not Working
1. Check microphone permissions in browser settings
2. Ensure you're using a supported browser (Chrome, Edge, Safari)
3. Try refreshing the page and granting permissions again
4. Check if microphone is working in other applications

### Voice Notifications Not Playing
1. Check if text-to-speech is enabled in voice settings
2. Ensure device volume is turned up
3. Check browser audio permissions
4. Try the "Test Voice" button in settings

### Voice Commands Not Recognized
1. Speak clearly and at normal volume
2. Wait for the "Listening" indicator to appear
3. Use the exact command phrases listed above
4. Check microphone permissions and browser support

### Offline Issues
1. Ensure the app has been loaded at least once while online
2. Check browser storage permissions
3. Clear browser cache and reload if needed
4. Verify service worker is registered

## Future Enhancements

- **Custom Voice Selection**: Choose from available system voices
- **Voice Training**: Improve recognition accuracy over time
- **Smart Snooze**: AI-powered snooze duration suggestions
- **Multi-language Support**: Voice commands in different languages
- **Voice Profiles**: Different settings for different users
- **Integration**: Connect with calendar and other productivity apps

## Security & Privacy

- **Local Processing**: Voice recognition happens in the browser
- **No Cloud Storage**: Voice data is not sent to external servers
- **Permission-based**: All features require explicit user permission
- **Data Minimization**: Only necessary data is stored locally
- **User Control**: All voice features can be disabled at any time

---

*This voice reminder system enhances the Personal AI Assistant with powerful audio capabilities while maintaining privacy and user control.*
