# LinkedIn Data Receiver Webhook

A Node.js Express webhook server that receives LinkedIn profile data and stores it in Firebase Firestore.

## Features

- ✅ RESTful webhook endpoint for receiving LinkedIn profile data
- ✅ Firebase Firestore integration for data persistence
- ✅ Profile retrieval endpoints
- ✅ CORS enabled for cross-origin requests
- ✅ Error handling and validation
- ✅ Health check endpoint

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project"
3. Name it (e.g., "linkedin-data-receiver")
4. Enable Firestore Database (select "Start in test mode" for development)

### 2. Get Firebase Credentials

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click **Service Accounts** tab
3. Click **Generate New Private Key**
4. Save the JSON file securely

### 3. Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase credentials from step 2:
   - `FIREBASE_PROJECT_ID` - from the JSON key
   - `FIREBASE_CLIENT_EMAIL` - from the JSON key
   - `FIREBASE_PRIVATE_KEY` - from the JSON key (the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /health
```
Returns server status

### Store Profile (Webhook)
```
POST /webhook/linkedin-profile
Content-Type: application/json

{
  "url": "https://linkedin.com/in/john-doe-sample/",
  "profile": "john-doe-sample",
  "crawled_at": "30/10/2024 11:45:22",
  "name": "Stephen Colbert",
  "description": "...",
  "location": "...",
  ... (rest of profile data)
}
```

**Response:**
```json
{
  "success": true,
  "id": "john-doe-sample",
  "message": "Profile for Stephen Colbert stored successfully"
}
```

### Get Profile
```
GET /webhook/linkedin-profile/:profileId
```

**Response:**
```json
{
  "success": true,
  "data": { ... profile data ... }
}
```

### List All Profiles
```
GET /webhook/profiles
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [ ... profiles ... ]
}
```

## Data Structure in Firestore

Profiles are stored in a `profiles` collection with the structure:

```
profiles/
  ├── john-doe-sample/
  │   ├── url: string
  │   ├── profile: string
  │   ├── crawled_at: string
  │   ├── name: string
  │   ├── description: string
  │   ├── location: string
  │   ├── followers: string
  │   ├── connections: string
  │   ├── experience: array
  │   ├── education: array
  │   ├── certifications: array
  │   ├── languages: array
  │   ├── volunteerings: array
  │   ├── publications: array
  │   ├── projects: array
  │   ├── courses: array
  │   ├── honors_and_awards: array
  │   ├── activities: array
  │   ├── similar_profiles: array
  │   ├── patents: array
  │   ├── receivedAt: timestamp
  │   └── updatedAt: timestamp
```

## Testing with cURL

```bash
# Store a profile
curl -X POST http://localhost:3000/webhook/linkedin-profile \
  -H "Content-Type: application/json" \
  -d @profile-data.json

# Get a profile
curl http://localhost:3000/webhook/linkedin-profile/john-doe-sample

# List all profiles
curl http://localhost:3000/webhook/profiles

# Health check
curl http://localhost:3000/health
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Service account private key |
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | Environment (development/production) |

## Security Notes

- **Never commit `.env` file** to version control
- Use strong security rules in Firestore for production
- Validate incoming data before storing
- Use HTTPS in production
- Implement authentication/authorization as needed

## Firestore Security Rules (Basic)

For test mode, rules are open. For production, use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{document=**} {
      // Only authenticated users can read/write
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Firebase Connection Error
- Verify `.env` file has correct credentials
- Check private key includes `-----BEGIN/END PRIVATE KEY-----`
- Ensure quotes are escaped properly in `.env`

### Firestore Quota Error
- You might be exceeding Firebase free tier limits
- Wait a bit and retry, or upgrade your plan

### CORS Issues
- CORS is enabled by default. Modify if needed in `server.js`
