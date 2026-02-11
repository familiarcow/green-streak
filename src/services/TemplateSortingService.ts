/**
 * Template Sorting Service
 *
 * Stateless utility functions for sorting habit templates by relevance
 * to the user's selected goals. Primary goal habits appear first,
 * then secondary goals, then unrelated templates.
 */

import { HabitTemplate } from '../types/templates';
import { GoalId } from '../types/goals';

/**
 * Calculate relevance score for a template based on user's goals.
 * Higher scores mean more relevant to user's goals.
 *
 * Scoring algorithm:
 * - Each matching goal adds points based on its position in user's goal list
 * - Primary goal (index 0) gets highest weight
 * - Multiple matching goals stack additively
 *
 * @param template - The habit template to score
 * @param orderedUserGoals - User's goals ordered by priority (primary first)
 * @returns Relevance score (0 = no match, higher = more relevant)
 */
export function getTemplateScore(
  template: HabitTemplate,
  orderedUserGoals: GoalId[]
): number {
  if (!template.goalIds || template.goalIds.length === 0) {
    return 0;
  }

  if (orderedUserGoals.length === 0) {
    return 0;
  }

  let score = 0;

  for (const goalId of template.goalIds) {
    const position = orderedUserGoals.indexOf(goalId);
    if (position !== -1) {
      // Higher weight for goals earlier in user's list
      // Primary goal (index 0) gets the highest weight
      const weight = (orderedUserGoals.length - position) * 10;
      score += weight;
    }
  }

  return score;
}

/**
 * Sort templates by relevance to user's goals.
 * Templates matching user's goals appear first, sorted by relevance score.
 * Templates with equal scores maintain their original order (stable sort).
 *
 * @param templates - Array of templates to sort
 * @param orderedUserGoals - User's goals ordered by priority (primary first)
 * @returns New sorted array (original is not mutated)
 */
export function sortTemplatesByGoals(
  templates: HabitTemplate[],
  orderedUserGoals: GoalId[]
): HabitTemplate[] {
  if (orderedUserGoals.length === 0) {
    return templates; // No goals = original order
  }

  // Create a copy with original indices for stable sort
  const indexed = templates.map((template, index) => ({
    template,
    originalIndex: index,
    score: getTemplateScore(template, orderedUserGoals),
  }));

  // Sort by score descending, then by original index for ties (stable sort)
  indexed.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Tiebreaker: maintain original order
    return a.originalIndex - b.originalIndex;
  });

  return indexed.map(item => item.template);
}

/**
 * Get ordered goal IDs from user's selected goals.
 * Returns primary goal first, then other goals in their order.
 *
 * @param selectedGoalIds - All selected goal IDs (definition IDs, not UUIDs)
 * @param primaryGoalId - The primary goal ID (definition ID)
 * @returns Ordered array with primary first
 */
export function getOrderedUserGoals(
  selectedGoalIds: string[],
  primaryGoalId: string | null
): GoalId[] {
  if (selectedGoalIds.length === 0) {
    return [];
  }

  const ordered: GoalId[] = [];

  // Primary first (if set and in selected goals)
  if (primaryGoalId && selectedGoalIds.includes(primaryGoalId)) {
    ordered.push(primaryGoalId as GoalId);
  }

  // Then others in their original order
  for (const id of selectedGoalIds) {
    if (id !== primaryGoalId) {
      ordered.push(id as GoalId);
    }
  }

  return ordered;
}
