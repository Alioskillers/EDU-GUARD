import { Injectable } from '@nestjs/common';

/**
 * Service for filtering inappropriate content for children
 * Blocks inappropriate words and phrases
 */
@Injectable()
export class ContentFilterService {
  // Expanded list of inappropriate words for children
  private readonly inappropriateWords = [
    // Violence
    'kill', 'murder', 'die', 'death', 'blood', 'weapon', 'gun', 'knife', 'fight', 'hit', 'punch', 'kick',
    // Profanity (common inappropriate words)
    'damn', 'hell', 'crap', 'stupid', 'idiot', 'moron', 'dumb', 'fuck', 'shit', 'ass', 'bitch', 'mother', 'son',
    // Cyberbullying
    'hate', 'loser', 'bully', 'hurt', 'ugly', 'fat', 'weird', 'freak', 'nerd', 'geek',
    // Drugs/Alcohol
    'drug', 'alcohol', 'beer', 'wine', 'drunk', 'high', 'smoke',
    // Other inappropriate
    'shut up', 'shutup', 'shut-up', 'shut your mouth', 'kill'
  ];

  /**
   * Checks if text contains inappropriate words
   * @param text The text to check
   * @returns Object with isInappropriate flag and detected words
   */
  checkContent(text: string): { isInappropriate: boolean; detectedWords: string[] } {
    if (!text || typeof text !== 'string') {
      return { isInappropriate: false, detectedWords: [] };
    }

    const normalized = text.toLowerCase().trim();
    const detectedWords: string[] = [];

    // Check for each inappropriate word
    for (const word of this.inappropriateWords) {
      // Use word boundaries to avoid false positives (e.g., "class" containing "ass")
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(normalized)) {
        detectedWords.push(word);
      }
    }

    return {
      isInappropriate: detectedWords.length > 0,
      detectedWords: [...new Set(detectedWords)], // Remove duplicates
    };
  }

  /**
   * Checks both title and content
   */
  checkTitleAndContent(title: string, content: string): { isInappropriate: boolean; detectedWords: string[] } {
    const titleCheck = this.checkContent(title);
    const contentCheck = this.checkContent(content);

    const allDetectedWords = [...titleCheck.detectedWords, ...contentCheck.detectedWords];

    return {
      isInappropriate: titleCheck.isInappropriate || contentCheck.isInappropriate,
      detectedWords: [...new Set(allDetectedWords)],
    };
  }
}

