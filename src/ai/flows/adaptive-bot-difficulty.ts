'use server';
/**
 * @fileOverview A Genkit flow for dynamically adjusting AI bot difficulty based on player performance.
 *
 * - adjustBotDifficulty - A function that handles the bot difficulty adjustment process.
 * - AdjustBotDifficultyInput - The input type for the adjustBotDifficulty function.
 * - AdjustBotDifficultyOutput - The return type for the adjustBotDifficulty function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustBotDifficultyInputSchema = z.object({
  kills: z.number().describe('Number of kills the player achieved.'),
  deaths: z.number().describe('Number of times the player was killed.'),
  assists: z.number().describe('Number of assists the player achieved.'),
  totalGameTimeSeconds:
    z.number().describe('Total time played in the current game session in seconds.'),
  previousBotDifficulty: z
    .enum(['beginner', 'intermediate', 'pro'])
    .describe('The current difficulty level of the AI bots.'),
});
export type AdjustBotDifficultyInput = z.infer<
  typeof AdjustBotDifficultyInputSchema
>;

const AdjustBotDifficultyOutputSchema = z.object({
  newBotDifficulty: z
    .enum(['beginner', 'intermediate', 'pro'])
    .describe('The recommended new difficulty level for the AI bots.'),
  reasoning:
    z.string().describe('Explanation for the recommended difficulty change.'),
});
export type AdjustBotDifficultyOutput = z.infer<
  typeof AdjustBotDifficultyOutputSchema
>;

const determineBotDifficultyTool = ai.defineTool(
  {
    name: 'determineBotDifficulty',
    description:
      'Calculates the appropriate AI bot difficulty based on player performance statistics and previous difficulty.',
    inputSchema: AdjustBotDifficultyInputSchema,
    outputSchema: AdjustBotDifficultyOutputSchema,
  },
  async input => {
    const {kills, deaths, assists, previousBotDifficulty} = input;

    let kda = 0;
    if (deaths > 0) {
      kda = (kills + assists) / deaths;
    } else {
      kda = kills + assists; // If no deaths, KDA is essentially (kills + assists)
    }

    let newBotDifficulty: 'beginner' | 'intermediate' | 'pro' =
      previousBotDifficulty;
    let reasoning = `Player stats: Kills=${kills}, Deaths=${deaths}, Assists=${assists}, KDA=${kda.toFixed(
      2
    )}. Current bot difficulty: ${previousBotDifficulty}.`;

    // Simple difficulty adjustment logic
    if (kda >= 3.0) {
      if (previousBotDifficulty !== 'pro') {
        newBotDifficulty = 'pro';
        reasoning +=
          ' Player performance is exceptionally high, recommending a switch to Pro difficulty.';
      } else {
        reasoning +=
          ' Player performance is high, maintaining Pro difficulty as it is already set.';
      }
    } else if (kda >= 1.5) {
      if (previousBotDifficulty === 'beginner') {
        newBotDifficulty = 'intermediate';
        reasoning +=
          ' Player performance is above average, recommending a switch to Intermediate difficulty.';
      } else if (previousBotDifficulty === 'pro') {
        newBotDifficulty = 'intermediate';
        reasoning +=
          ' Player performance has decreased from Pro level, recommending a switch to Intermediate difficulty.';
      } else {
        reasoning +=
          ' Player performance is good, maintaining Intermediate difficulty as it is already set.';
      }
    } else {
      if (previousBotDifficulty !== 'beginner') {
        newBotDifficulty = 'beginner';
        reasoning +=
          ' Player performance is low, recommending a switch to Beginner difficulty.';
      } else {
        reasoning +=
          ' Player performance is low, maintaining Beginner difficulty as it is already set.';
      }
    }

    return {newBotDifficulty, reasoning};
  }
);

const adaptiveBotDifficultyPrompt = ai.definePrompt({
  name: 'adaptiveBotDifficultyPrompt',
  input: {schema: AdjustBotDifficultyInputSchema},
  output: {schema: AdjustBotDifficultyOutputSchema},
  tools: [determineBotDifficultyTool],
  prompt: `The player has provided their recent game performance statistics. Based on these statistics and the current bot difficulty, determine the most appropriate new difficulty level for the AI bots.

Player Kills: {{{kills}}}
Player Deaths: {{{deaths}}}
Player Assists: {{{assists}}}
Total Game Time: {{{totalGameTimeSeconds}}} seconds
Current Bot Difficulty: {{{previousBotDifficulty}}}

Please use the 'determineBotDifficulty' tool to evaluate these metrics and recommend a new bot difficulty along with a clear reasoning for the change.`,
});

const adaptiveBotDifficultyFlow = ai.defineFlow(
  {
    name: 'adaptiveBotDifficultyFlow',
    inputSchema: AdjustBotDifficultyInputSchema,
    outputSchema: AdjustBotDifficultyOutputSchema,
  },
  async input => {
    const {output} = await adaptiveBotDifficultyPrompt(input);
    if (!output) {
      throw new Error('Failed to get an output from the prompt.');
    }
    return output;
  }
);

export async function adjustBotDifficulty(
  input: AdjustBotDifficultyInput
): Promise<AdjustBotDifficultyOutput> {
  return adaptiveBotDifficultyFlow(input);
}
