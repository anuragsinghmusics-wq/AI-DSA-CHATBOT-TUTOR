import { ProblemContext } from '@/types';

export interface SheetTopic {
  id: string;
  label: string;
  icon: string;
  accent: string;
  description: string;
  tags: string[];
}

/**
 * Curated DSA roadmap topics following the classic Striver A2Z style.
 * Maps problem tags to structured topic sections.
 */
export const SHEET_TOPICS: SheetTopic[] = [
  {
    id: 'learn-basics',
    label: 'Learn the Basics',
    icon: 'BookOpen',
    accent: 'orange',
    description: 'Language basics, complexity analysis, math, and basic recursion',
    tags: ['Math', 'Basic', 'Simulation', 'Recursion'],
  },
  {
    id: 'sorting',
    label: 'Sorting Techniques',
    icon: 'ArrowUpDown',
    accent: 'blue',
    description: 'Bubble, Selection, Insertion, Merge, Quick, and Cyclic Sort',
    tags: ['Sorting', 'Divide and Conquer'],
  },
  {
    id: 'arrays',
    label: 'Arrays (Easy → Hard)',
    icon: 'Layers',
    accent: 'orange',
    description: 'Kadane\'s, Two Pointer, Dutch National Flag, Pascal\'s Triangle',
    tags: ['Array', 'Prefix Sum', 'Two Pointers'],
  },
  {
    id: 'binary-search',
    label: 'Binary Search',
    icon: 'Search',
    accent: 'cyan',
    description: '1D Arrays, BS on answers, 2D Arrays, and min-max problems',
    tags: ['Binary Search'],
  },
  {
    id: 'strings',
    label: 'Strings (Basic & Medium)',
    icon: 'Type',
    accent: 'amber',
    description: 'Anagrams, Palindromes, KMP, Rabin-Karp, and string matching',
    tags: ['String', 'String Matching'],
  },
  {
    id: 'linked-list',
    label: 'Linked List',
    icon: 'Link',
    accent: 'teal',
    description: 'Singly, Doubly, Fast & Slow pointers, reversals, and cycles',
    tags: ['Linked List', 'Doubly-Linked List'],
  },
  {
    id: 'recursion-backtracking',
    label: 'Recursion & Backtracking',
    icon: 'RefreshCw',
    accent: 'orange',
    description: 'Subsets, Permutations, N-Queens, Sudoku, and Word Search',
    tags: ['Backtracking'],
  },
  {
    id: 'stacks-queues',
    label: 'Stacks & Queues',
    icon: 'Layers2',
    accent: 'blue',
    description: 'Monotonic stack, Next Greater Element, LRU Cache, and Min Stack',
    tags: ['Stack', 'Queue', 'Monotonic Stack'],
  },
  {
    id: 'trees',
    label: 'Binary Trees & BST',
    icon: 'GitBranch',
    accent: 'green',
    description: 'Traversals, LCA, Diameter, Views, and BST operations',
    tags: ['Tree', 'Binary Tree', 'Binary Search Tree'],
  },
  {
    id: 'graphs',
    label: 'Graphs',
    icon: 'Network',
    accent: 'rose',
    description: 'BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, MST, and DSU',
    tags: ['Graph', 'Breadth-First Search', 'Depth-First Search', 'Union Find', 'Shortest Path'],
  },
  {
    id: 'dynamic-programming',
    label: 'Dynamic Programming',
    icon: 'Zap',
    accent: 'orange',
    description: '1D DP, 2D DP, DP on Grids, Subsequences, Strings, Stocks, and MCM',
    tags: ['Dynamic Programming', 'Memoization'],
  },
  {
    id: 'greedy',
    label: 'Greedy Algorithms',
    icon: 'TrendingUp',
    accent: 'yellow',
    description: 'Activity selection, N meetings, Fractional knapsack, Job scheduling',
    tags: ['Greedy'],
  },
  {
    id: 'other',
    label: 'Other Topics & Patterns',
    icon: 'MoreHorizontal',
    accent: 'gray',
    description: 'Bit manipulation, Trie, Heap / Priority Queue, and Sliding Window',
    tags: ['Bit Manipulation', 'Trie', 'Heap (Priority Queue)', 'Sliding Window', 'Hash Table'],
  },
];

/** Accent color → Tailwind class mappings (Light mode accessible) */
export const ACCENT_CLASSES: Record<string, { text: string; bg: string; border: string; bar: string }> = {
  blue:   { text: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',    bar: 'bg-blue-500' },
  cyan:   { text: 'text-cyan-700',   bg: 'bg-cyan-50',    border: 'border-cyan-200',    bar: 'bg-cyan-500' },
  orange: { text: 'text-brand-700', bg: 'bg-orange-50',  border: 'border-orange-200',  bar: 'bg-brand-500' },
  violet: { text: 'text-brand-700', bg: 'bg-orange-50',  border: 'border-orange-200',  bar: 'bg-brand-500' },
  pink:   { text: 'text-pink-700',   bg: 'bg-pink-50',    border: 'border-pink-200',    bar: 'bg-pink-500' },
  teal:   { text: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-200',    bar: 'bg-teal-500' },
  amber:  { text: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-500' },
  rose:   { text: 'text-rose-700',   bg: 'bg-rose-50',    border: 'border-rose-200',    bar: 'bg-rose-500' },
  green:  { text: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  indigo: { text: 'text-brand-700', bg: 'bg-orange-50',  border: 'border-orange-200',  bar: 'bg-brand-500' },
  yellow: { text: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',   bar: 'bg-amber-500' },
  lime:   { text: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  gray:   { text: 'text-gray-700',   bg: 'bg-gray-100',   border: 'border-gray-200',    bar: 'bg-gray-500' },
};

/**
 * Returns the best matching topic ID for a given problem based on its tags.
 */
export function getTopicForProblem(problem: { tags: string[] }): string {
  if (!problem.tags || problem.tags.length === 0) return 'other';

  for (const topic of SHEET_TOPICS) {
    if (topic.id === 'other') continue;
    const hasMatch = topic.tags.some((topicTag) =>
      problem.tags.some((tag) => tag.toLowerCase() === topicTag.toLowerCase())
    );
    if (hasMatch) return topic.id;
  }

  return 'other';
}

/**
 * Groups a flat problem list into topics based on tag matching.
 * Problems matching no known topic are placed in 'other'.
 */
export function groupProblemsByTopic(
  problems: Array<{ id: string; title: string; difficulty: string; tags: string[] }>
) {
  const assigned = new Set<string>();

  const groups = SHEET_TOPICS.slice(0, -1).map((topic) => {
    const matched = problems.filter((p) =>
      !assigned.has(p.id) &&
      p.tags?.some((tag) =>
        topic.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
      )
    );
    matched.forEach((p) => assigned.add(p.id));
    return { topic, problems: matched };
  });

  // 'other' catches everything not yet assigned
  const other = problems.filter((p) => !assigned.has(p.id));
  if (other.length > 0) {
    groups.push({ topic: SHEET_TOPICS[SHEET_TOPICS.length - 1], problems: other });
  }

  return groups.filter((g) => g.problems.length > 0);
}
