import type { SafetyResult } from '../../types/index.js';

/**
 * Comprehensive regex-based code detection.
 * Scans text for programming language constructs across multiple languages.
 */

// ---- Code Keyword Patterns ----
const CODE_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  // Loop constructs
  { pattern: /\bfor\s*\(/g, description: 'for loop' },
  { pattern: /\bwhile\s*\(/g, description: 'while loop' },
  { pattern: /\bdo\s*\{/g, description: 'do-while loop' },
  { pattern: /\.forEach\s*\(/g, description: 'forEach method' },
  { pattern: /\.map\s*\(/g, description: 'map method' },
  { pattern: /\.filter\s*\(/g, description: 'filter method' },
  { pattern: /\.reduce\s*\(/g, description: 'reduce method' },

  // Conditional constructs
  { pattern: /\bif\s*\([^)]*\)\s*\{/g, description: 'if statement with braces' },
  { pattern: /\belse\s*\{/g, description: 'else block' },
  { pattern: /\bswitch\s*\(/g, description: 'switch statement' },
  { pattern: /\bcase\s+\S+\s*:/g, description: 'case statement' },

  // Function definitions
  { pattern: /\bfunction\s+\w+\s*\(/g, description: 'function definition' },
  { pattern: /\bdef\s+\w+\s*\(/g, description: 'Python function definition' },
  { pattern: /\bfn\s+\w+\s*\(/g, description: 'Rust function definition' },
  { pattern: /\bfunc\s+\w+\s*\(/g, description: 'Go function definition' },
  { pattern: /\bconst\s+\w+\s*=\s*\([^)]*\)\s*=>/g, description: 'arrow function' },
  { pattern: /\blet\s+\w+\s*=\s*\([^)]*\)\s*=>/g, description: 'arrow function' },

  // Class/struct definitions
  { pattern: /\bclass\s+\w+\s*[\{:({]/g, description: 'class definition' },
  { pattern: /\bstruct\s+\w+\s*\{/g, description: 'struct definition' },
  { pattern: /\binterface\s+\w+\s*\{/g, description: 'interface definition' },

  // Variable declarations
  { pattern: /\b(var|let|const)\s+\w+\s*=/g, description: 'variable declaration' },
  { pattern: /\bint\s+\w+\s*=/g, description: 'int declaration' },
  { pattern: /\bfloat\s+\w+\s*=/g, description: 'float declaration' },
  { pattern: /\bdouble\s+\w+\s*=/g, description: 'double declaration' },
  { pattern: /\bbool\s+\w+\s*=/g, description: 'bool declaration' },
  { pattern: /\bstring\s+\w+\s*=/g, description: 'string declaration' },

  // Return statements
  { pattern: /\breturn\s+[^;]+;/g, description: 'return statement' },
  { pattern: /\breturn\s+\[/g, description: 'return array' },
  { pattern: /\breturn\s+\{/g, description: 'return object' },

  // Import/include
  { pattern: /#include\s*[<"]/g, description: 'C/C++ include' },
  { pattern: /\bimport\s+[\w.{}]+\s+from/g, description: 'import from' },
  { pattern: /\bfrom\s+\w+\s+import/g, description: 'Python import' },
  { pattern: /\busing\s+namespace/g, description: 'C++ using namespace' },
  { pattern: /\bpackage\s+\w+/g, description: 'package declaration' },

  // Type annotations (C++/Java)
  { pattern: /\bvector<[\w,\s<>]+>/g, description: 'C++ vector type' },
  { pattern: /\bList<\w+>/g, description: 'Java List type' },
  { pattern: /\bMap<\w+,\s*\w+>/g, description: 'Java Map type' },
  { pattern: /\bHashMap<\w+,\s*\w+>/g, description: 'Java HashMap type' },
  { pattern: /\bArrayList<\w+>/g, description: 'Java ArrayList type' },

  // Access modifiers
  { pattern: /\bpublic\s+(static\s+)?(void|int|String|boolean|class)/g, description: 'Java access modifier' },
  { pattern: /\bprivate\s+(static\s+)?(void|int|String|boolean)/g, description: 'Java private modifier' },
  { pattern: /\bprotected\s+(static\s+)?(void|int|String|boolean)/g, description: 'Java protected modifier' },

  // C++ specific
  { pattern: /\btemplate\s*</g, description: 'C++ template' },
  { pattern: /\bint\s+main\s*\(/g, description: 'C/C++ main function' },
  { pattern: /\bvoid\s+\w+\s*\(/g, description: 'void function declaration' },
  { pattern: /\bcout\s*<</g, description: 'C++ cout' },
  { pattern: /\bcin\s*>>/g, description: 'C++ cin' },
  { pattern: /\bstd::/g, description: 'C++ std namespace' },

  // Python specific
  { pattern: /\bself\.\w+/g, description: 'Python self reference' },
  { pattern: /\bprint\s*\(/g, description: 'Python print' },
  { pattern: /\b__init__\s*\(/g, description: 'Python constructor' },

  // Common operations that look like code
  { pattern: /\w+\[\w+\]\s*[=<>!]+\s*\w+/g, description: 'array access with comparison' },
  { pattern: /\w+\s*\+=\s*/g, description: 'compound assignment' },
  { pattern: /\w+\s*-=\s*/g, description: 'compound subtraction' },
  { pattern: /\w+\+\+|--\w+|\w+--/g, description: 'increment/decrement' },
];

// ---- Code Block Detection ----
const CODE_BLOCK_PATTERN = /```(?:python|java|javascript|typescript|cpp|c\+\+|c|csharp|go|rust|ruby|php|swift|kotlin|scala|sql)\n[\s\S]*?```/gi;
const GENERIC_CODE_BLOCK_WITH_CODE = /```\n(?=.*(?:for|while|if|return|def|class|function|int |void ))/gi;

/**
 * Scans text for code patterns and returns a safety result.
 */
export function runRegexFilter(text: string): SafetyResult {
  const violations: string[] = [];

  // Check for code blocks with language tags
  const codeBlockMatches = text.match(CODE_BLOCK_PATTERN);
  if (codeBlockMatches) {
    violations.push(`Code block detected: ${codeBlockMatches.length} code block(s) with language tags`);
  }

  // Check individual code patterns
  for (const { pattern, description } of CODE_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      violations.push(`${description}: found ${matches.length} occurrence(s)`);
    }
  }

  return {
    safe: violations.length === 0,
    violations,
  };
}
