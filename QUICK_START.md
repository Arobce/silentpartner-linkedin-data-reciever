# Quick Start Guide

## Project Structure

```
silentpartner-linkedin-data-reciever/
├── server.js                 # Main Express app with webhook endpoints
├── package.json              # Dependencies
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── README.md                 # Full documentation
└── example-profile.json      # Sample LinkedIn profile data
```

## Setup Steps (In Order)

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Create a new project"
3. Name: "linkedin-data-receiver" (or your choice)
4. Region: choose closest to you
5. Enable Firestore in "Build" section

### Step 2: Get Firebase Credentials
1. Go to Project Settings (gear icon) → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file

### Step 3: Configure Environment
```bash
# Copy template
cp .env.example .env

# Edit .env and add your Firebase credentials:
# - FIREBASE_PROJECT_ID
# - FIREBASE_CLIENT_EMAIL
# - FIREBASE_PRIVATE_KEY (include full -----BEGIN/END----- text)
```

### Step 4: Install & Run
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Server runs at http://localhost:3000
```

### Step 5: Test the Webhook
```bash
# Send the example profile
curl -X POST http://localhost:3000/webhook/linkedin-profile \
  -H "Content-Type: application/json" \
  -d @example-profile.json

# Retrieve it
curl http://localhost:3000/webhook/linkedin-profile/john-doe-sample

# List all profiles
curl http://localhost:3000/webhook/profiles
```

## Data Validation

Your LinkedIn profile data structure includes:
- ✅ Basic info (name, description, location)
- ✅ Experience (array)
- ✅ Education (array)
- ✅ Certifications
- ✅ Languages
- ✅ Volunteering
- ✅ Publications
- ✅ Projects
- ✅ Courses
- ✅ Awards & Honors
- ✅ Activities
- ✅ Similar Profiles
- ✅ Patents

All nested arrays are supported by Firestore.

## Key Features Implemented

| Feature | Status |
|---------|--------|
| POST webhook endpoint | ✅ |
| Data validation | ✅ |
| Firestore storage | ✅ |
| GET single profile | ✅ |
| GET all profiles | ✅ |
| Error handling | ✅ |
| CORS support | ✅ |
| Timestamps | ✅ |

## Next Steps (Optional)

- Add authentication/authorization
- Implement profile update functionality
- Add search/filtering capabilities
- Set up Cloud Functions for processing
- Create a frontend to view profiles
- Deploy to Cloud Run or Heroku

## Support

See README.md for detailed documentation, troubleshooting, and API reference.
