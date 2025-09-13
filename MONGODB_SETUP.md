# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Cloud) - Recommended

1. **Create a free MongoDB Atlas account:**
   - Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account

2. **Create a new cluster:**
   - Choose the free tier (M0)
   - Select a region close to you
   - Wait for the cluster to be created (2-3 minutes)

3. **Set up database access:**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a username and password
   - Set privileges to "Read and write to any database"

4. **Set up network access:**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Choose "Allow access from anywhere" (0.0.0.0/0) for development
   - Or add your specific IP address

5. **Get your connection string:**
   - Go to "Clusters" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `personalAssistantDB`

6. **Update your .env file:**
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/personalAssistantDB?retryWrites=true&w=majority
   ```

## Option 2: Local MongoDB

1. **Install MongoDB Community Edition:**
   ```bash
   brew install mongodb-community
   ```

2. **Start MongoDB service:**
   ```bash
   brew services start mongodb-community
   ```

3. **Verify MongoDB is running:**
   ```bash
   mongosh --eval "db.runCommand('ping')"
   ```

4. **Your .env file should have:**
   ```bash
   MONGODB_URI=mongodb://localhost:27017/personalAssistantDB
   ```

## Testing the Connection

1. **Start your server:**
   ```bash
   npm start
   ```

2. **Check the API status:**
   ```bash
   curl http://localhost:3000/
   ```

3. **Test the chat functionality:**
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Log that I had breakfast at 8 AM"}'
   ```

## Troubleshooting

### MongoDB Atlas Issues:
- Make sure your IP address is whitelisted
- Verify your username and password are correct
- Check that the cluster is running (not paused)

### Local MongoDB Issues:
- Ensure MongoDB service is running: `brew services list | grep mongodb`
- Check MongoDB logs: `tail -f /opt/homebrew/var/log/mongodb/mongo.log`
- Try restarting MongoDB: `brew services restart mongodb-community`

### Connection Timeout:
- The app will automatically fall back to in-memory storage
- Check the server logs for connection error messages
- Verify your MONGODB_URI is correct in the .env file

## Environment Variables

Your `.env` file should contain:
```bash
# Personal Assistant API Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/personalAssistantDB?retryWrites=true&w=majority

# Database Configuration
DB_NAME=personalAssistantDB
DB_COLLECTION_LOGS=logs
DB_COLLECTION_REMINDERS=reminders
```
