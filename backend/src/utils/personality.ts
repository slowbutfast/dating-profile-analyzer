import { db } from '../config/firebase';

export interface PersonalityProfile {
  age_range?: string;
  gender?: string;
  dating_goal?: string;
  personality_type?: string;
  interests?: string;
  conversation_style?: string;
  humor_style?: string;
  dating_experience?: string;
  ideal_match?: string;
}

/**
 * Fetch user's personality profile from Firestore
 */
export async function getUserPersonality(userId: string): Promise<PersonalityProfile | null> {
  try {
    const personalityDoc = await db.collection('user_personalities').doc(userId).get();
    
    if (!personalityDoc.exists) {
      return null;
    }

    return personalityDoc.data() as PersonalityProfile;
  } catch (error) {
    console.error('Error fetching personality profile:', error);
    return null;
  }
}

/**
 * Format personality profile into a prompt context for the LLM
 */
export function formatPersonalityContext(personality: PersonalityProfile | null): string {
  if (!personality) {
    return 'No personality profile available. Provide general feedback.';
  }

  const parts: string[] = [];

  if (personality.age_range) {
    parts.push(`Age Range: ${personality.age_range}`);
  }

  if (personality.gender) {
    parts.push(`Gender: ${personality.gender}`);
  }

  if (personality.dating_goal) {
    parts.push(`Dating Goal: ${personality.dating_goal}`);
  }

  if (personality.personality_type) {
    parts.push(`Personality Type: ${personality.personality_type}`);
  }

  if (personality.conversation_style) {
    parts.push(`Conversation Style: ${personality.conversation_style}`);
  }

  if (personality.humor_style) {
    parts.push(`Humor Style: ${personality.humor_style}`);
  }

  if (personality.dating_experience) {
    parts.push(`Dating App Experience: ${personality.dating_experience}`);
  }

  if (personality.interests) {
    parts.push(`Interests: ${personality.interests}`);
  }

  if (personality.ideal_match) {
    parts.push(`Looking For: ${personality.ideal_match}`);
  }

  return `User Personality Profile:\n${parts.join('\n')}`;
}

/**
 * Generate personalized analysis instructions based on personality
 */
export function getPersonalizedInstructions(personality: PersonalityProfile | null): string {
  if (!personality) {
    return 'Provide balanced, general feedback suitable for a wide audience.';
  }

  const instructions: string[] = [
    'Tailor your feedback based on the user\'s personality profile.',
  ];

  // Dating goal specific instructions
  if (personality.dating_goal === 'Long-term relationship') {
    instructions.push('Focus on authenticity, depth, and relationship-oriented qualities.');
  } else if (personality.dating_goal === 'Short-term dating') {
    instructions.push('Emphasize fun, spontaneity, and social appeal.');
  } else if (personality.dating_goal === 'New friends') {
    instructions.push('Highlight approachability, shared interests, and platonic connection potential.');
  }

  // Personality type specific instructions
  if (personality.personality_type?.includes('Outgoing')) {
    instructions.push('Encourage photos that show energy, social situations, and vibrant personality.');
  } else if (personality.personality_type?.includes('Reserved')) {
    instructions.push('Value authenticity and depth over flashiness. Encourage genuine self-expression.');
  } else if (personality.personality_type?.includes('Adventurous')) {
    instructions.push('Highlight unique experiences and adventurous spirit in photos and text.');
  }

  // Conversation style specific instructions
  if (personality.conversation_style === 'Deep and meaningful') {
    instructions.push('In text analysis, reward thoughtful, introspective responses.');
  } else if (personality.conversation_style === 'Light and playful') {
    instructions.push('In text analysis, appreciate wit, playfulness, and lighthearted tone.');
  } else if (personality.conversation_style === 'Intellectual and curious') {
    instructions.push('Value intelligence, curiosity, and substantive content in responses.');
  }

  // Dating experience adjustments
  if (personality.dating_experience === 'New to dating apps' || personality.dating_experience === 'First time') {
    instructions.push('Provide constructive, encouraging feedback. Be extra helpful with best practices.');
  } else if (personality.dating_experience === 'Very experienced') {
    instructions.push('Provide nuanced, advanced suggestions. The user likely knows the basics.');
  }

  return instructions.join(' ');
}
