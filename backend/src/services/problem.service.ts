import { problemRepository } from '../repositories/problem.repository.js';

/**
 * Problem service — business logic for problem operations.
 */
export class ProblemService {
  async getAllProblems() {
    return problemRepository.findAll();
  }

  async getProblemById(id: string) {
    const problem = await problemRepository.findById(id);
    if (!problem) {
      return null;
    }
    return {
      ...problem,
      context: problemRepository.toProblemContext(problem),
    };
  }
}

export const problemService = new ProblemService();
