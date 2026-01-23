import { projectRepository } from "../repositories/project.repository";
import { auditLogRepository } from "../repositories/audit-log.repository";
import { taskRepository } from "../repositories/task.repository";

export class ProjectService {
    async createProject(userId: string, data: any) {
        const project = await projectRepository.create({
            ...data,
            ownerId: userId
        });

        await auditLogRepository.create({
            entityType: "project",
            entityId: project.id,
            action: "created",
            performedBy: userId,
            after: project as any
        });

        return project;
    }

    async addMember(userId: string, projectId: string, memberUserId: string, role?: string) {
        const isOwner = await projectRepository.isOwner(projectId, userId);
        if (!isOwner) throw new Error("Only owners can add members");

        const member = await projectRepository.addMember(projectId, memberUserId, role);

        await auditLogRepository.create({
            entityType: "project",
            entityId: projectId,
            action: "member_added",
            performedBy: userId,
            meta: { memberUserId, role } as any
        });

        return member;
    }

    async addTaskToProject(userId: string, projectId: string, taskId: string) {
        const isMember = await projectRepository.isMember(projectId, userId);
        if (!isMember) throw new Error("Only members can add tasks to projects");

        // Also verify task ownership or permission? For simplicity, check if user owns task
        const task = await taskRepository.findById(taskId, userId);
        if (!task) throw new Error("Task not found or unauthorized");

        const projectTask = await projectRepository.addTask(projectId, taskId);

        await auditLogRepository.create({
            entityType: "project",
            entityId: projectId,
            action: "task_added",
            performedBy: userId,
            meta: { taskId } as any
        });

        return projectTask;
    }

    async getProjectTasks(userId: string, projectId: string) {
        const isMember = await projectRepository.isMember(projectId, userId);
        if (!isMember) throw new Error("Unauthorized");

        return projectRepository.getTasks(projectId);
    }
}

export const projectService = new ProjectService();
