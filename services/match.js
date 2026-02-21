require('dotenv').config();

const OpenAI = require('openai');
const { collection, getDocs, setDoc, doc, query, where, getDoc, updateDoc, arrayUnion } = require('firebase/firestore');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Sample user data based on the provided structure
const SAMPLE_USERS = [
  {
    id: 'user_1',
    name: 'Priya Pandey',
    email: 'ps4389196@gmail.com',
    createdAt: '2026-02-20T19:40:08Z',
    conversationStyle: 'Casual & friendly chats',
    favoriteTopic: 'Web3 & Blockchain',
    favoriteTopics: ['AI & ML', 'Startups', 'Design', 'Blockchain', 'Education', 'Real Estate'],
    personalityTraits: ['Extrovert', 'High Adaptability', 'Conscientious', 'Agreeable', 'High Agreeableness / Positivity'],
    primaryGoal: 'Meeting technical co-founders',
    onboardingComplete: true,
    linkedinConnected: true,
    linkedin: {
      name: 'Priya Pandey',
      picture: 'https://media.licdn.com/dms/image/v2/D5603AQGH5U7y62_mAg/profile-displayphoto-scale_400_400/B56ZwBDMf5HcAg-/0/1769544142813?e=1773273600&v=beta&t=rJd-8Z2J4-hh9-hi-Lm3t0Vr3aQjhSr6pPExnRdYrio',
      headline: 'Product Manager at Tech Startup',
      educations: [],
      positions: [],
    },
  },
  {
    id: 'user_2',
    name: 'John Smith',
    email: 'john.smith@example.com',
    createdAt: '2026-02-19T10:15:00Z',
    conversationStyle: 'Casual & friendly chats',
    favoriteTopic: 'AI & ML',
    favoriteTopics: ['AI & ML', 'Startups', 'Web3 & Blockchain', 'Design', 'Education'],
    personalityTraits: ['Extrovert', 'High Adaptability', 'Conscientious', 'Agreeable', 'High Agreeableness / Positivity'],
    primaryGoal: 'Meeting technical co-founders',
    onboardingComplete: true,
    linkedinConnected: true,
    linkedin: {
      name: 'John Smith',
      picture: 'https://example.com/john-smith.jpg',
      headline: 'Software Engineer at AI Startup',
      educations: [],
      positions: [],
    },
  },
  {
    id: 'user_3',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    createdAt: '2026-02-18T14:22:30Z',
    conversationStyle: 'Professional & focused',
    favoriteTopic: 'Business Strategy',
    favoriteTopics: ['Business Strategy', 'Finance', 'Leadership', 'Real Estate', 'Sustainability'],
    personalityTraits: ['Introvert', 'High Conscientiousness', 'Analytical', 'Strategic', 'Detail-oriented'],
    primaryGoal: 'Exploring new job opportunities',
    onboardingComplete: true,
    linkedinConnected: true,
    linkedin: {
      name: 'Sarah Johnson',
      picture: 'https://example.com/sarah-johnson.jpg',
      headline: 'CFO at Investment Firm',
      educations: [],
      positions: [],
    },
  },
  {
    id: 'user_4',
    name: 'Alex Chen',
    email: 'alex.chen@example.com',
    createdAt: '2026-02-17T11:05:45Z',
    conversationStyle: 'Casual & friendly chats',
    favoriteTopic: 'Web3 & Blockchain',
    favoriteTopics: ['Blockchain', 'Startups', 'AI & ML', 'Cryptocurrency', 'Innovation'],
    personalityTraits: ['Extrovert', 'Innovative', 'Risk-taker', 'Collaborative', 'Visionary'],
    primaryGoal: 'Meeting technical co-founders',
    onboardingComplete: true,
    linkedinConnected: true,
    linkedin: {
      name: 'Alex Chen',
      picture: 'https://example.com/alex-chen.jpg',
      headline: 'Blockchain Developer & Founder',
      educations: [],
      positions: [],
    },
  },
  {
    id: 'user_5',
    name: 'Emma Wilson',
    email: 'emma.w@example.com',
    createdAt: '2026-02-16T16:40:10Z',
    conversationStyle: 'Professional & focused',
    favoriteTopic: 'Design',
    favoriteTopics: ['Design', 'Product Management', 'User Experience', 'Leadership', 'Sustainability'],
    personalityTraits: ['Introvert', 'Creative', 'Detail-oriented', 'Conscientious', 'Empathetic'],
    primaryGoal: 'Exploring new job opportunities',
    onboardingComplete: true,
    linkedinConnected: true,
    linkedin: {
      name: 'Emma Wilson',
      picture: 'https://example.com/emma-wilson.jpg',
      headline: 'UX/UI Designer at Design Studio',
      educations: [],
      positions: [],
    },
  },
];

/**
 * Calculate match score between two users using OpenAI
 * @param {Object} user1 - First user profile
 * @param {Object} user2 - Second user profile
 * @returns {Promise<number>} - Match percentage (0-100)
 */
async function calculateMatchScore(user1, user2) {
  try {
    const prompt = `You are an expert matchmaking algorithm for a professional networking platform. 
    
Analyze the compatibility between these two professional profiles and return a single number representing match percentage (0-100).

Consider:
- Shared interests in favorite topics
- Compatible conversation styles
- Aligned personality traits
- Compatible primary goals
- Professional alignment

User 1:
- Name: ${user1.name}
- Conversation Style: ${user1.conversationStyle}
- Favorite Topics: ${user1.favoriteTopics.join(', ')}
- Personality Traits: ${user1.personalityTraits.join(', ')}
- Primary Goal: ${user1.primaryGoal}
- Headline: ${user1.linkedin.headline}

User 2:
- Name: ${user2.name}
- Conversation Style: ${user2.conversationStyle}
- Favorite Topics: ${user2.favoriteTopics.join(', ')}
- Personality Traits: ${user2.personalityTraits.join(', ')}
- Primary Goal: ${user2.primaryGoal}
- Headline: ${user2.linkedin.headline}

Return ONLY a single integer between 0 and 100 representing the match percentage. No explanation, just the number.`;

    const message = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const scoreText = message.choices[0].message.content.trim();
    const score = parseInt(scoreText, 10);

    // Validate that we got a valid number
    if (isNaN(score) || score < 0 || score > 100) {
      return 0;
    }

    return score;
  } catch (error) {
    console.error(`Error calculating match score between ${user1.name} and ${user2.name}:`, error.message);
    return 0;
  }
}

/**
 * Find all matches above threshold using O(n²) algorithm
 * @param {Array} users - Array of user profiles
 * @param {number} threshold - Match threshold percentage (default 90)
 * @returns {Promise<Array>} - Array of match objects above threshold
 */
async function findMatches(users, threshold = 90) {
  const matches = [];

  // O(n²) loop to compare all pairs of users
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const user1 = users[i];
      const user2 = users[j];

      console.log(`\n🔍 Comparing: ${user1.name} ↔ ${user2.name}`);

      const matchScore = await calculateMatchScore(user1, user2);

      console.log(`   Match Score: ${matchScore}%`);

      // Only add to matches if above threshold
      if (matchScore >= threshold) {
        matches.push({
          user1Id: user1.id,
          user1Name: user1.name,
          user2Id: user2.id,
          user2Name: user2.name,
          matchPercentage: matchScore,
          timestamp: new Date().toISOString(),
          status: 'pending', // Can be updated to 'accepted', 'rejected', etc.
        });

        console.log(`   ✅ MATCH FOUND! Score: ${matchScore}%`);
      }
    }
  }

  return matches;
}

/**
 * Find matches for a new user against all existing users in Firestore
 * @param {Object} newUser - The newly added user profile
 * @param {Array} existingUsers - Array of existing user profiles
 * @param {number} threshold - Match threshold percentage (default 90)
 * @returns {Promise<Array>} - Array of match objects above threshold
 */
async function findMatchesForNewUser(newUser, existingUsers, threshold = 90) {
  const matches = [];

  console.log(`\n🔍 Finding matches for: ${newUser.name}`);
  console.log(`📊 Comparing against ${existingUsers.length} existing users\n`);

  // O(n) loop to compare new user against all existing users
  for (let i = 0; i < existingUsers.length; i++) {
    const existingUser = existingUsers[i];

    // Skip comparing a user with themselves
    if (newUser.id === existingUser.id) {
      continue;
    }

    console.log(`   🔗 Comparing: ${newUser.name} ↔ ${existingUser.name}`);

    const matchScore = await calculateMatchScore(newUser, existingUser);

    console.log(`      Match Score: ${matchScore}%`);

    // Only add to matches if above threshold
    if (matchScore >= threshold) {
      matches.push({
        user1Id: newUser.id,
        user1Name: newUser.name,
        user2Id: existingUser.id,
        user2Name: existingUser.name,
        matchPercentage: matchScore,
        timestamp: new Date().toISOString(),
        status: 'pending',
      });

      console.log(`      ✅ MATCH! Score: ${matchScore}%`);
    }
  }

  return matches;
}

/**
 * Check if a match already exists in user's matches array
 * @param {Object} db - Firestore database instance
 * @param {string} user1Id - First user ID
 * @param {string} user2Id - Second user ID
 * @returns {Promise<boolean>} - True if match already exists
 */
async function matchExists(db, user1Id, user2Id) {
  try {
    const user1Doc = await getDoc(doc(db, 'users', user1Id));
    
    if (!user1Doc.exists()) {
      return false;
    }

    const matches = user1Doc.data().matches || [];
    
    // Check if user2Id exists in user1's matches
    return matches.some(m => m.userId === user2Id);
  } catch (error) {
    console.error('Error checking if match exists:', error.message);
    return false;
  }
}

/**
 * Save matches to both users' documents (bidirectional)
 * @param {Object} db - Firestore database instance
 * @param {Array} matches - Array of match objects to save
 * @returns {Promise<Array>} - Array of saved match pairs
 */
async function saveMatchesToFirestore(db, matches) {
  const savedMatches = [];

  for (const match of matches) {
    try {
      // Check if match already exists
      const exists = await matchExists(db, match.user1Id, match.user2Id);
      
      if (exists) {
        console.log(`   ⏭️  Skipping duplicate match: ${match.user1Name} ↔ ${match.user2Name}`);
        continue;
      }

      // Create match objects for both directions
      const matchForUser1 = {
        userId: match.user2Id,
        name: match.user2Name,
        matchPercentage: match.matchPercentage,
        timestamp: match.timestamp,
        status: 'pending',
      };

      const matchForUser2 = {
        userId: match.user1Id,
        name: match.user1Name,
        matchPercentage: match.matchPercentage,
        timestamp: match.timestamp,
        status: 'pending',
      };

      // Update both users' documents with the match
      await updateDoc(doc(db, 'users', match.user1Id), {
        matches: arrayUnion(matchForUser1),
      });

      await updateDoc(doc(db, 'users', match.user2Id), {
        matches: arrayUnion(matchForUser2),
      });

      savedMatches.push({
        user1Id: match.user1Id,
        user1Name: match.user1Name,
        user2Id: match.user2Id,
        user2Name: match.user2Name,
        matchPercentage: match.matchPercentage,
      });

      console.log(`   ✅ Saved match: ${match.user1Name} ↔ ${match.user2Name} (${match.matchPercentage}%)`);
    } catch (error) {
      console.error(`   ❌ Error saving match: ${error.message}`);
    }
  }

  return savedMatches;
}

/**
 * Main function: Find and save matches for a new user
 * @param {Object} db - Firestore database instance
 * @param {Object} newUser - The newly added user profile
 * @param {number} threshold - Match threshold percentage (default 90)
 * @returns {Promise<Object>} - Object containing matches found and saved
 */
async function findAndSaveMatches(db, newUser, threshold = 90) {
  try {
    // Fetch all existing users from Firestore
    console.log('📥 Fetching all existing users from Firestore...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const existingUsers = [];
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      
      // Skip if this is the new user being matched
      if (doc.id === newUser.id) {
        return;
      }

      // Extract onboarding data for matching
      existingUsers.push({
        id: doc.id,
        name: userData.name || 'Unknown',
        email: userData.email || '',
        conversationStyle: userData.onboardingAnswers?.conversationStyle || '',
        favoriteTopics: userData.onboardingAnswers?.favoriteTopics || [],
        personalityTraits: userData.onboardingAnswers?.personalityTraits || [],
        primaryGoal: userData.onboardingAnswers?.primaryGoal || '',
        linkedin: {
          name: userData.linkedinProfileDataResponse?.data?.linkedin?.name || userData.name || 'Unknown',
          headline: userData.linkedinProfileDataResponse?.data?.linkedin?.headline || '',
        },
      });
    });

    console.log(`✓ Found ${existingUsers.length} existing users\n`);

    // Find matches for new user
    console.log('🔄 Finding matches...');
    const matches = await findMatchesForNewUser(newUser, existingUsers, threshold);

    console.log(`\n📊 Found ${matches.length} match(es) above ${threshold}% threshold\n`);

    // Save matches to Firestore
    if (matches.length > 0) {
      console.log('💾 Saving matches to Firestore...\n');
      const savedMatchIds = await saveMatchesToFirestore(db, matches);
      
      console.log(`\n✅ Successfully saved ${savedMatchIds.length} match(es)\n`);

      return {
        success: true,
        totalMatches: matches.length,
        savedMatches: savedMatchIds.length,
        matches: matches,
      };
    } else {
      return {
        success: true,
        totalMatches: 0,
        savedMatches: 0,
        matches: [],
        message: `No matches found for ${newUser.name} above ${threshold}% threshold`,
      };
    }
  } catch (error) {
    console.error('Error during matching process:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main execution - Find matches for all sample users
 */
async function main() {
  console.log('🚀 Starting user matching service...\n');
  console.log(`📊 Total users to match: ${SAMPLE_USERS.length}`);
  console.log(`📈 Total comparisons (O(n²)): ${(SAMPLE_USERS.length * (SAMPLE_USERS.length - 1)) / 2}`);
  console.log(`🎯 Match threshold: 50%\n`);
  console.log('='.repeat(60));

  const matches = await findMatches(SAMPLE_USERS, 50);

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 FINAL RESULTS:\n');

  if (matches.length === 0) {
    console.log('❌ No matches found above 50% threshold');
  } else {
    console.log(`✅ Found ${matches.length} match(es) above 50% threshold:\n`);
    matches.forEach((match, index) => {
      console.log(`${index + 1}. ${match.user1Name} ↔ ${match.user2Name}`);
      console.log(`   Match Percentage: ${match.matchPercentage}%`);
      console.log(`   Timestamp: ${match.timestamp}`);
      console.log(`   Status: ${match.status}`);
      console.log('');
    });
  }

  console.log('='.repeat(60));
  console.log('\n💾 Ready to save to Firestore:\n');
  console.log(JSON.stringify(matches, null, 2));
}

// Export functions for use in other modules
module.exports = {
  calculateMatchScore,
  findMatches,
  findMatchesForNewUser,
  findAndSaveMatches,
  matchExists,
  saveMatchesToFirestore,
  SAMPLE_USERS,
  main,
};

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
