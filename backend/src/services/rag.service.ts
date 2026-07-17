import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { pipeline } from '@huggingface/transformers';
import { IndexFlatL2 } from 'faiss-node';
import { logger } from '../utils/logger.js';

interface Document {
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

class RagService {
  private documents: Document[] = [];
  private extractor: any = null;
  private index: any = null;
  private readonly vectorStorePath = path.resolve(process.cwd(), '..', 'vectorstore.json');
  private readonly csvPath = path.resolve(process.cwd(), '..', 'Leetcode.csv');

  async init() {
    logger.info('Initializing RAG Service...');
    
    try {
      // 1. Initialize the embedding model locally
      logger.info('Loading HuggingFace transformers model...');
      this.extractor = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5');
      
      // 2. Check for cached vector store
      if (fs.existsSync(this.vectorStorePath)) {
        logger.info('Loading cached vector store from JSON...');
        const data = fs.readFileSync(this.vectorStorePath, 'utf8');
        this.documents = JSON.parse(data);
        logger.info(`Loaded ${this.documents.length} vectors from cache.`);
        this.rebuildIndex();
        return;
      }

      // 3. If no cache, process the CSV
      logger.info('No cache found. Processing Leetcode CSV (this will take a few minutes)...');
      if (!fs.existsSync(this.csvPath)) {
        logger.error(`CSV file not found at ${this.csvPath}`);
        return;
      }

      const csvContent = fs.readFileSync(this.csvPath, 'utf8');
      const records = parse(csvContent, { columns: true, skip_empty_lines: true }) as Record<string, any>[];

      logger.info(`Parsed ${records.length} records. Generating embeddings...`);
      
      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        if (!row.Title) continue;
        
        const content = `Title: ${row.Title}\nDifficulty: ${row.Difficulty || 'N/A'}\nTopics: ${row.Topics || 'N/A'}\nCategory: ${row.Category || 'N/A'}`;
        
        const doc: Document = {
          content,
          metadata: {
            title: row.Title,
            url: row.Link || 'N/A',
            difficulty: row.Difficulty || 'N/A'
          }
        };

        // Generate embedding
        const output = await this.extractor(content, { pooling: 'mean', normalize: true });
        doc.embedding = Array.from(output.data);
        
        this.documents.push(doc);

        if ((i + 1) % 100 === 0) {
          logger.info(`Embedded ${i + 1} / ${records.length} records...`);
        }
      }

      // Save to cache
      logger.info('Saving vector store to JSON cache...');
      fs.writeFileSync(this.vectorStorePath, JSON.stringify(this.documents));
      this.rebuildIndex();
      logger.info('RAG Service initialization complete.');
    } catch (error) {
      logger.error('Failed to initialize RAG Service', { error });
    }
  }

  private rebuildIndex() {
    if (this.documents.length === 0) return;
    const dim = this.documents[0].embedding!.length;
    this.index = new IndexFlatL2(dim);
    for (const doc of this.documents) {
      this.index.add(doc.embedding!);
    }
    logger.info(`Built Faiss index with ${this.index.ntotal()} vectors.`);
  }

  async search(query: string, k: number = 3): Promise<string> {
    if (this.documents.length === 0 || !this.extractor || !this.index) {
      return '';
    }

    try {
      // 1. Embed query
      const queryOutput = await this.extractor(query, { pooling: 'mean', normalize: true });
      const queryEmbedding = Array.from(queryOutput.data) as number[];

      // 2. Search index
      const results = this.index.search(queryEmbedding, k);

      // 3. Format the output
      const topDocs = results.labels.map((label: number) => this.documents[label]);

      const context = topDocs.map((doc: Document, index: number) => {
        return `[Source ${index + 1}: ${doc.metadata.title} (${doc.metadata.difficulty})]\n${doc.content}`;
      }).join('\n\n---\n\n');

      return context;
    } catch (err) {
      logger.error('Error during RAG search', { error: err });
      return '';
    }
  }
}

export const ragService = new RagService();
