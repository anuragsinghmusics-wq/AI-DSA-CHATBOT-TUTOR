import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import crypto from 'crypto';
import type { ProblemContext, ProblemExample } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { getCompaniesForProblem } from '../data/companyData.js';

/**
 * Generates a consistent URL-safe ID from a title
 */
function generateId(title: string): string {
  return crypto.createHash('md5').update(title).digest('hex').substring(0, 12);
}

// ─── Disk cache for LeetCode GraphQL responses ────────────────────────────────
// Stores fetched problem details (description, snippets, examples) locally.
// Eliminates repeat network calls to LeetCode — each problem is fetched once ever.
const CACHE_PATH = path.resolve(process.cwd(), 'problem-cache.json');

function loadCache(): Record<string, any> {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    }
  } catch { /* ignore corrupt cache */ }
  return {};
}

function saveCache(cache: Record<string, any>) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache), 'utf8');
  } catch { /* ignore write errors */ }
}

/**
 * Repository for problem-related operations.
 * Reads from Leetcode.csv and caches LeetCode GraphQL descriptions to disk.
 */
export class ProblemRepository {
  private problems: ProblemContext[] = [];
  private initialized = false;
  private readonly csvPath = path.resolve(process.cwd(), '..', 'Leetcode.csv');
  /** In-memory mirror of disk cache — avoids repeated JSON.parse per request */
  private graphqlCache: Record<string, any> = {};

  private init() {
    if (this.initialized) return;

    // Load disk cache into memory on first use
    this.graphqlCache = loadCache();
    logger.info(`ProblemRepository: Loaded ${Object.keys(this.graphqlCache).length} cached problem details from disk.`);

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
            companies: getCompaniesForProblem(row.Title, tags),
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
    return this.problems.map(p => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      tags: p.tags,
      companies: p.companies,
      createdAt: new Date(), 
    }));
  }

  /**
   * Get a single problem by ID with full context.
   * Checks disk cache first — only hits LeetCode GraphQL API on first access.
   */
  async findById(id: string) {
    this.init();
    const p = this.problems.find(p => p.id === id) as any;
    if (!p) return null;

    if (p._link && !p._fetchedGraphQL) {
      const cached = this.graphqlCache[p.id];

      if (cached) {
        // ── Serve from disk cache — instant, no network ──────────────────────
        p.description      = cached.description;
        p.constraints      = cached.constraints;
        p.examples         = cached.examples;
        p.exampleTestcases = cached.exampleTestcases;
        p.codeSnippets     = cached.codeSnippets;
        p._fetchedGraphQL  = true;
      } else {
        // ── Not cached — fetch from LeetCode GraphQL API ─────────────────────
        try {
          const titleSlug = p._link.split('/problems/')[1]?.replace('/', '');
          if (titleSlug) {
            logger.info(`ProblemRepository: Fetching GraphQL for ${titleSlug} (will be cached after this)`);
            const query = `
              query questionData($titleSlug: String!) {
                question(titleSlug: $titleSlug) {
                  content
                  exampleTestcases
                  codeSnippets {
                    lang
                    langSlug
                    code
                  }
                }
              }
            `;
            const res = await fetch('https://leetcode.com/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query, variables: { titleSlug } })
            });
            const data = (await res.json()) as any;
            const question = data?.data?.question;
            if (question?.content) {
              const html = question.content;
              p.description = html;
              
              // Extract constraints from HTML
              p.constraints = [];
              const constraintsMatch = html.match(/>Constraints:.*?<ul>([\s\S]*?)<\/ul>/i);
              if (constraintsMatch && constraintsMatch[1]) {
                const listItems = constraintsMatch[1].split(/<\/li>/i);
                for (const li of listItems) {
                  const text = li.replace(/<[^>]*>?/gm, '').trim();
                  if (text) p.constraints.push(text);
                }
              }

              // Extract examples from HTML <pre> tags
              p.examples = [];
              const preBlocks = html.match(/<pre>([\s\S]*?)<\/pre>/gi);
              if (preBlocks) {
                for (const pre of preBlocks) {
                  const inner = pre.replace(/<[^>]*>?/gm, '');
                  const inputMatch = inner.match(/Input:\s*(.*?)(?=\n*Output:)/is);
                  const outputMatch = inner.match(/Output:\s*(.*?)(?=\n*Explanation:|$)/is);
                  const explanationMatch = inner.match(/Explanation:\s*(.*)$/is);

                  if (inputMatch || outputMatch) {
                    p.examples.push({
                      input: inputMatch ? inputMatch[1].trim() : '',
                      output: outputMatch ? outputMatch[1].trim() : '',
                      explanation: explanationMatch ? explanationMatch[1].trim() : ''
                    });
                  }
                }
              }
            }
            if (question?.exampleTestcases) {
              p.exampleTestcases = question.exampleTestcases;
            }
            if (question?.codeSnippets && Array.isArray(question.codeSnippets)) {
              p.codeSnippets = {};
              for (const snippet of question.codeSnippets) {
                p.codeSnippets[snippet.langSlug] = snippet.code;
              }
            }
            p._fetchedGraphQL = true;

            // ── Save to disk cache — next request for this problem is instant ─
            this.graphqlCache[p.id] = {
              description:      p.description,
              constraints:      p.constraints,
              examples:         p.examples,
              exampleTestcases: p.exampleTestcases,
              codeSnippets:     p.codeSnippets,
            };
            saveCache(this.graphqlCache);
          }
        } catch (err) {
          logger.error('Failed to fetch LeetCode description', { error: err });
        }
      }
    }

    return p;
  }

  /**
   * Convert a database problem record to the ProblemContext format.
   */
  toProblemContext(problem: any): ProblemContext {
    return problem as ProblemContext;
  }
}

export const problemRepository = new ProblemRepository();
