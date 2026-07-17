import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import crypto from 'crypto';
import type { ProblemContext, ProblemExample } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Generates a consistent URL-safe ID from a title
 */
function generateId(title: string): string {
  return crypto.createHash('md5').update(title).digest('hex').substring(0, 12);
}

/**
 * Repository for problem-related operations.
 * Now reads directly from Leetcode.csv in the workspace root.
 */
export class ProblemRepository {
  private problems: ProblemContext[] = [];
  private initialized = false;
  private readonly csvPath = path.resolve(process.cwd(), '..', 'Leetcode.csv');

  private init() {
    if (this.initialized) return;
    
    logger.info('ProblemRepository: Loading Leetcode.csv...');
    try {
      if (!fs.existsSync(this.csvPath)) {
        logger.error(`CSV file not found at ${this.csvPath}`);
        return;
      }

      const csvContent = fs.readFileSync(this.csvPath, 'utf8');
      const records = parse(csvContent, { columns: true, skip_empty_lines: true }) as Record<string, any>[];
      
      this.problems = records
        .filter(row => row.Title && row['Premium Only'] !== 'True')
        .map(row => {
          // Parse tags safely
          let tags: string[] = [];
          const topicsRaw = row.Topics || '';
          if (topicsRaw) {
            tags = topicsRaw.split(',').map((t: string) => t.trim());
          }
          
          return {
            id: generateId(row.Title),
            title: row.Title,
            description: `<p>Loading description from LeetCode...</p>`,
            constraints: [], 
            examples: [], 
            difficulty: (row.Difficulty?.toUpperCase() || 'MEDIUM') as ProblemContext['difficulty'],
            tags,
            category: row.Category || undefined,
            acceptanceRate: row['Acceptance Rate (%)'] ? parseFloat(row['Acceptance Rate (%)']) : undefined,
            likes: row.Likes ? parseInt(row.Likes, 10) : undefined,
            dislikes: row.Dislikes ? parseInt(row.Dislikes, 10) : undefined,
            _link: row.Link
          } as any;
        });
        
      logger.info(`ProblemRepository: Loaded ${this.problems.length} problems from CSV.`);
      this.initialized = true;
    } catch (err) {
      logger.error('Failed to load CSV in ProblemRepository', { error: err });
    }
  }

  /**
   * Get all problems (list view — no full description).
   */
  async findAll() {
    this.init();
    // Returning all problems to the frontend
    return this.problems.map(p => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      tags: p.tags,
      createdAt: new Date(), 
    }));
  }

  /**
   * Get a single problem by ID with full context.
   */
  async findById(id: string) {
    this.init();
    const p = this.problems.find(p => p.id === id) as any;
    if (!p) return null;

    // Dynamically fetch actual problem description from LeetCode GraphQL if we haven't already
    if (p._link && !p._fetchedGraphQL) {
      try {
        const titleSlug = p._link.split('/problems/')[1]?.replace('/', '');
        if (titleSlug) {
          logger.info(`ProblemRepository: Fetching GraphQL description for ${titleSlug}`);
          const query = `
            query questionData($titleSlug: String!) {
              question(titleSlug: $titleSlug) {
                content
              }
            }
          `;
          const res = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { titleSlug } })
          });
          const data = (await res.json()) as any;
          if (data?.data?.question?.content) {
            p.description = data.data.question.content;
            p._fetchedGraphQL = true; // cache it so we don't fetch again
          }
        }
      } catch (err) {
        logger.error('Failed to fetch LeetCode description', { error: err });
      }
    }

    return p;
  }

  /**
   * Convert a database problem record to the ProblemContext format.
   * Since we already format it in init(), we just cast it.
   */
  toProblemContext(problem: any): ProblemContext {
    return problem as ProblemContext;
  }
}

export const problemRepository = new ProblemRepository();
