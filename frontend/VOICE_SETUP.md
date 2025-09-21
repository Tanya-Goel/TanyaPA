# Voice Recognition Setup Guide

This guide will help you set up and use the voice recognition features in the Personal Assistant application.

## Prerequisites

### Browser Support
Voice recognition is supported in:
- **Chrome** (recommended)
- **Edge** 
- **Safari** (limited support)

### HTTPS Requirement
Voice recognition requires a secure context (HTTPS) for security reasons. This is a browser requirement, not an application limitation.

## Development Setup

### Option 1: Use HTTPS Development Server (Recommended)

Run the frontend with HTTPS enabled:

```bash
cd frontend
npm run dev:https
```

This will start the development server with HTTPS enabled. You may see a security warning in your browser - this is normal for self-signed certificates in development. Click "Advanced" and "Proceed to localhost" to continue.

### Option 2: Use HTTP with localhost (Limited)

If you're running on `localhost` or `127.0.0.1`, some browsers may allow voice recognition over HTTP, but this is not guaranteed and may not work consistently.

## Microphone Permissions

When you first use voice recognition, your browser will ask for microphone permission:

1. Click "Allow" when prompted
2. If you accidentally clicked "Block", you can:
   - Click the microphone icon in your browser's address bar
   - Go to browser settings and allow microphone access for this site
   - Refresh the page and try again

## Using Voice Features

### Voice Input for Reminders
1. Click the "Start Voice" button in the reminder input
2. Speak your reminder clearly (e.g., "Remind me to call mom in 30 minutes")
3. Click "Stop Recording" when finished
4. The text will appear in the input field

### Voice Input for Logs
1. Click the "Start Voice" button in the log input
2. Speak your activity (e.g., "Log that I had breakfast at 8am")
3. Click "Stop Recording" when finished
4. The text will appear in the textarea

### Voice Commands for Reminders
When a reminder notification appears, you can use voice commands:
- "Snooze for 10 minutes"
- "Dismiss"
- "Repeat"
- "Stop speaking"

## Troubleshooting

### "Speech recognition error: not-allowed"
This usually means:
1. **HTTPS required**: Make sure you're using HTTPS (run `npm run dev:https`)
2. **Microphone permission denied**: Allow microphone access in your browser
3. **Browser not supported**: Use Chrome, Edge, or Safari

### "No speech detected"
- Speak clearly and at a normal volume
- Make sure your microphone is working
- Try speaking closer to your microphone
- Check that your microphone isn't muted

### "Network error"
- Check your internet connection
- Voice recognition requires an internet connection to work

### Voice recognition not working at all
1. Check browser support (Chrome/Edge/Safari)
2. Ensure you're using HTTPS
3. Check microphone permissions
4. Try refreshing the page
5. Check browser console for error messages

## Production Deployment

For production, ensure your application is served over HTTPS. Most hosting providers (Vercel, Netlify, etc.) provide HTTPS by default.

## Browser Console

If you're having issues, check the browser console (F12 → Console) for detailed error messages. Look for messages starting with 🎤 which indicate voice recognition events.

## Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Try a different browser (Chrome is most reliable)
3. Ensure you're using HTTPS
4. Check that your microphone is working in other applications
