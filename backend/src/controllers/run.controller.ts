import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';

// Maps Monaco/frontend language IDs to Piston runtime names + versions
const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3' },
  python:     { language: 'python',     version: '3.10.0' },
  java:       { language: 'java',       version: '15.0.2' },
  cpp:        { language: 'c++',        version: '10.2.0' },
  c:          { language: 'c',          version: '10.2.0' },
  csharp:     { language: 'csharp',     version: '6.12.0' },
  go:         { language: 'go',         version: '1.16.2' },
  rust:       { language: 'rust',       version: '1.50.0' },
  kotlin:     { language: 'kotlin',     version: '1.4.31-eap-56' },
  swift:      { language: 'swift',      version: '5.3.3' },
  ruby:       { language: 'ruby',       version: '3.0.1' },
};

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

/**
 * POST /api/run
 * Proxies code execution to the Piston API (no auth required).
 */
export async function runCode(req: Request, res: Response): Promise<void> {
  const { code, language, stdin } = req.body as {
    code: string;
    language: string;
    stdin?: string;
  };

  if (!code || !language) {
    res.status(400).json({ error: 'code and language are required' });
    return;
  }

  const runtime = LANGUAGE_MAP[language];
  if (!runtime) {
    res.status(400).json({ error: `Unsupported language: ${language}` });
    return;
  }

  try {
    logger.info('Running code via Piston', { language, runtime: runtime.language });

    const pistonRes = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [{ content: code }],
        stdin: stdin || '',
        run_timeout: 10000,
      }),
    });

    if (!pistonRes.ok) {
      const errorText = await pistonRes.text();
      logger.error('Piston API error', { status: pistonRes.status, body: errorText });
      res.status(502).json({ error: 'Code execution service unavailable' });
      return;
    }

    const result = (await pistonRes.json()) as any;

    res.json({
      stdout: result.run?.stdout || '',
      stderr: result.run?.stderr || '',
      exitCode: result.run?.code ?? -1,
      language: runtime.language,
    });
  } catch (error) {
    logger.error('Run code error', { error });
    res.status(500).json({ error: 'Failed to execute code' });
  }
}
