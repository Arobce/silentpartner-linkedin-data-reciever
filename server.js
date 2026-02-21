const express = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDoc, getDocs, limit, query } = require('firebase/firestore');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Firebase with web config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * POST /webhook/linkedin-profile
 * Receives LinkedIn profile data and stores it in Firestore
 * 
 * Request body: LinkedIn profile object
 * Returns: { success: true, id: <document-id> }
 */
app.post('/webhook/linkedin-profile', async (req, res) => {
  try {
    const profileData = req.body;

    console.log(profileData);

    // Validate required fields
    if (!profileData.profile || !profileData.name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: profile and name',
      });
    }

    // Use profile username as document ID (or generate UUID)
    const docId = profileData.profile.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Add metadata
    const dataToStore = {
      ...profileData,
      receivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in Firestore under 'profiles' collection
    await setDoc(doc(db, 'profiles', docId), dataToStore, { merge: true });

    console.log(`✓ Profile stored: ${docId}`);

    res.json({
      success: true,
      id: docId,
      message: `Profile for ${profileData.name} stored successfully`,
    });
  } catch (error) {
    console.error('Error storing profile:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /webhook/linkedin-profile/:profileId
 * Retrieves a stored LinkedIn profile
 */
app.get('/webhook/linkedin-profile/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;

    const docRef = doc(db, 'profiles', profileId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found',
      });
    }

    res.json({
      success: true,
      data: docSnap.data(),
    });
  } catch (error) {
    console.error('Error retrieving profile:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /webhook/profiles
 * Lists all stored profiles
 */
app.get('/webhook/profiles', async (req, res) => {
  try {
    const q = query(collection(db, 'profiles'), limit(100));
    const querySnapshot = await getDocs(q);

    const profiles = [];
    querySnapshot.forEach((doc) => {
      profiles.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    console.error('Error listing profiles:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 POST /webhook/linkedin-profile - Store a profile`);
  console.log(`📖 GET /webhook/linkedin-profile/:profileId - Retrieve a profile`);
  console.log(`📋 GET /webhook/profiles - List all profiles`);
});
