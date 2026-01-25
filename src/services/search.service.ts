import { prisma } from "../config/db";

export class SearchService {
    async search(userId: string, query: string) {
        // Simulated vector search using text search for now
        // In production, we would get embeddings for the query and use pgvector
        return (prisma as any).taskNode.findMany({
            where: {
                userId,
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ],
                deletedAt: null
            }
        });
    }

    async createEmbedding(userId: string, data: any) {
        // Simulated embedding creation
        return prisma.embedding.create({
            data: {
                ownerId: userId,
                docType: data.docType,
                docId: data.docId,
                content: data.content,
                modelVersion: "simulated-001",
                dimensions: 1536,
            }
        });
    }
}

export const searchService = new SearchService();
