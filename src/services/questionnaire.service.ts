import { questionnaireRepository } from "../repositories/questionnaire.repository";
import { auditLogRepository } from "../repositories/audit-log.repository";

export class QuestionnaireService {
    async getQuestionnaires(filters: any) {
        return questionnaireRepository.findMany(filters);
    }

    async createQuestionnaire(userId: string, data: any) {
        // Admin check logic could go here
        const questionnaire = await questionnaireRepository.create(data);

        await auditLogRepository.create({
            entityType: "questionnaire",
            entityId: questionnaire.id,
            action: "created",
            performedBy: userId,
            after: questionnaire as any
        });

        return questionnaire;
    }

    async updateQuestionnaire(userId: string, id: string, data: any) {
        const questionnaire = await questionnaireRepository.update(id, data);

        await auditLogRepository.create({
            entityType: "questionnaire",
            entityId: id,
            action: "updated",
            performedBy: userId,
            after: questionnaire as any
        });

        return questionnaire;
    }
}

export const questionnaireService = new QuestionnaireService();
