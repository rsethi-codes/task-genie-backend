import { prisma } from "../config/db.js";
import { Project, ProjectMember, ProjectTask, Prisma } from "@prisma/client";

export class ProjectRepository {
    async create(data: Prisma.ProjectUncheckedCreateInput): Promise<Project> {
        return prisma.project.create({
            data: {
                ...data,
                members: {
                    create: {
                        userId: data.ownerId,
                        role: "owner"
                    }
                }
            }
        });
    }

    async findById(id: string): Promise<Project | null> {
        return prisma.project.findUnique({
            where: { id },
            include: {
                members: {
                    include: { user: true }
                }
            }
        });
    }

    async addMember(projectId: string, userId: string, role: string = "member"): Promise<ProjectMember> {
        return prisma.projectMember.create({
            data: {
                projectId,
                userId,
                role,
            }
        });
    }

    async removeMember(projectId: string, userId: string): Promise<void> {
        await prisma.projectMember.delete({
            where: {
                projectId_userId: { projectId, userId }
            }
        });
    }

    async addTask(projectId: string, nodeId: string): Promise<ProjectTask> {
        return prisma.projectTask.create({
            data: {
                projectId,
                nodeId
            }
        });
    }

    async getTasks(projectId: string): Promise<any[]> {
        return prisma.projectTask.findMany({
            where: { projectId },
            include: {
                node: {
                    include: {
                        children: true
                    }
                }
            }
        });
    }

    async isMember(projectId: string, userId: string): Promise<boolean> {
        const member = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId }
            }
        });
        return !!member;
    }

    async isOwner(projectId: string, userId: string): Promise<boolean> {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        return project?.ownerId === userId;
    }
}

export const projectRepository = new ProjectRepository();
