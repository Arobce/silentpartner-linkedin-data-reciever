const express = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDoc, getDocs, limit, query, where, updateDoc } = require('firebase/firestore');
require('dotenv').config();

const { findAndSaveMatches } = require('./services/match');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Debug middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

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
 * Receives LinkedIn profile data and matches it with a user in the users collection
 * Updates the user document with the LinkedIn response
 * Automatically finds matching connections
 * 
 * Request body: LinkedIn profile object with profile_name
 * Returns: { success: true, userId: <user-id>, matches: <match-data> }
 */
app.post('/webhook/linkedin-profile', async (req, res) => {
  try {
    let profileData = req.body.data;

    // Handle wrapped data structure (check if data is nested under 'data' property)
    if (profileData.data && profileData.request_id) {
      console.log('📦 Detected wrapped data structure, extracting from .data');
      profileData = profileData.data;
    }

    const profileName = profileData.name;
    console.log('✓ Processing LinkedIn profile for:', profileName);

    // Validate required fields
    if (!profileName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: profile or profile_name',
      });
    }

    // Query users collection to find matching user by linkedinProfileDataRequest.profile_name
    console.log('🔍 Searching for user with profile_name:', profileName);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('linkedinProfileDataRequest.profile_name', '==', profileName));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ No user found with profile_name:', profileName);
      return res.status(404).json({
        success: false,
        error: `No user found with profile_name: ${profileName}`,
      });
    }

    // Get the first matching user
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log(`✓ Found user:`, userId, '-', userData.name || 'Unknown');

    // Add metadata to profile response
    const linkedinResponse = {
      ...profileData,
      receivedAt: new Date().toISOString(),
    };

    // Update user document with LinkedIn response data
    await updateDoc(doc(db, 'users', userId), {
      'linkedinProfileDataResponse.data': linkedinResponse,
      'linkedinProfileDataResponse.updatedAt': new Date().toISOString(),
    });

    console.log(`✓ Updated user ${userId} with LinkedIn profile data`);

    // Prepare user object for matching (combine existing data with new LinkedIn response)
    const newUser = {
      id: userId,
      name: userData.name || profileData.name || 'Unknown',
      email: userData.email || profileData.email || '',
      conversationStyle: userData.onboardingAnswers?.conversationStyle || profileData.onboardingAnswers?.conversationStyle || '',
      favoriteTopics: userData.onboardingAnswers?.favoriteTopics || profileData.onboardingAnswers?.favoriteTopics || [],
      personalityTraits: userData.onboardingAnswers?.personalityTraits || profileData.onboardingAnswers?.personalityTraits || [],
      primaryGoal: userData.onboardingAnswers?.primaryGoal || profileData.onboardingAnswers?.primaryGoal || '',
      linkedin: {
        name: profileData.name || userData.name || 'Unknown',
        headline: profileData.experience?.[0]?.title || profileData.description || '',
      },
    };

    // Find and save matches
    console.log('\n🔄 Starting matching process...\n');
    const matchResult = await findAndSaveMatches(db, newUser, 90);

    console.log(`✓ Matching process completed`);

    res.json({
      success: true,
      userId: userId,
      userName: userData.name,
      message: `LinkedIn profile for ${profileName} received and stored in user document`,
      matches: matchResult,
    });
  } catch (error) {
    console.error('Error processing LinkedIn profile:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /webhook/linkedin-profile/:userId
 * Retrieves a stored user's LinkedIn data
 */
app.get('/webhook/linkedin-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = docSnap.data();
    res.json({
      success: true,
      userId: userId,
      name: userData.name,
      linkedinData: userData.linkedinProfileDataResponse?.data || null,
    });
  } catch (error) {
    console.error('Error retrieving user:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /webhook/users
 * Lists all users with their LinkedIn data status
 */
app.get('/webhook/users', async (req, res) => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(query(usersRef, limit(100)));

    const users = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        name: userData.name,
        email: userData.email,
        linkedinConnected: !!userData.linkedinProfileDataResponse?.data,
        linkedinDataReceivedAt: userData.linkedinProfileDataResponse?.updatedAt,
      });
    });

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /webhook/matches
 * Lists all matches found across all users
 */
app.get('/webhook/matches', async (req, res) => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(query(usersRef, limit(100)));

    const allMatches = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      const userMatches = userData.matches || [];
      
      userMatches.forEach((match) => {
        allMatches.push({
          fromUserId: doc.id,
          fromUserName: userData.name,
          ...match,
        });
      });
    });

    res.json({
      success: true,
      count: allMatches.length,
      data: allMatches,
    });
  } catch (error) {
    console.error('Error listing matches:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /webhook/users/:userId/matches
 * Gets all matches for a specific user
 */
app.get('/webhook/users/:userId/matches', async (req, res) => {
  try {
    const { userId } = req.params;

    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const userData = docSnap.data();
    const matches = userData.matches || [];

    res.json({
      success: true,
      userId: userId,
      userName: userData.name,
      matchCount: matches.length,
      matches: matches,
    });
  } catch (error) {
    console.error('Error retrieving user matches:', error);
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
  console.log(`📝 POST /webhook/linkedin-profile - Match & store LinkedIn profile in user doc`);
  console.log(`📖 GET /webhook/linkedin-profile/:userId - Get user's LinkedIn data`);
  console.log(`👥 GET /webhook/users - List all users with LinkedIn status`);
  console.log(`🔗 GET /webhook/matches - List all matches (nested in user docs)`);
  console.log(`🎯 GET /webhook/users/:userId/matches - Get specific user's matches`);
});
