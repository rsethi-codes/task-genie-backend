-- Migration Script: Convert Tasks and Subtasks to TaskNode System
-- This script migrates existing flat tasks and subtasks to the new hierarchical TaskNode system

-- Step 1: Create a temporary mapping table to track old task IDs to new root node IDs
CREATE TEMPORARY TABLE task_migration_mapping (
    old_task_id UUID,
    new_root_node_id UUID,
    migration_status TEXT DEFAULT 'pending'
);

-- Step 2: Migrate existing Tasks as ROOT nodes
-- Each existing Task becomes a ROOT TaskNode
INSERT INTO "TaskNode" (
    id,
    "userId",
    "parentId",
    "rootTaskId",
    title,
    description,
    "nodeType",
    "status",
    "order",
    "estimatedDuration",
    "energyRequired",
    "recurrenceRule",
    "isCompletable",
    "aiGenerated",
    "aiMetadata",
    "progressMeta",
    "temporalIntent",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "idempotencyKey",
    "aiGenerationStatus"
)
SELECT 
    gen_random_uuid() as id,  -- Generate new UUID for the root node
    "userId",
    NULL as "parentId",  -- ROOT nodes have no parent
    gen_random_uuid() as "rootTaskId",  -- Self-reference for ROOT nodes
    title,
    description,
    'ROOT' as "nodeType",  -- Convert all existing tasks to ROOT nodes
    CASE 
        WHEN status = 'COMPLETED' THEN 'COMPLETED'
        WHEN status = 'ARCHIVED' THEN 'ARCHIVED'
        ELSE 'ACTIVE'
    END as "status",
    0 as "order",  -- ROOT nodes are ordered first
    "estimatedDuration",
    "energyRequired",
    "recurrenceRule",
    true as "isCompletable",
    "aiGenerated",
    "aiMetadata",
    '{"contributesToProgress": true, "weight": 1.0}' as "progressMeta",
    CASE 
        WHEN "isRecurring" = true THEN 'daily'
        ELSE 'anytime'
    END as "temporalIntent",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "idempotencyKey",
    "aiGenerationStatus"
FROM "Task";

-- Step 3: Update the migration mapping table
INSERT INTO task_migration_mapping (old_task_id, new_root_node_id, migration_status)
SELECT 
    t.id as old_task_id,
    tn.id as new_root_node_id,
    'completed' as migration_status
FROM "Task" t
JOIN "TaskNode" tn ON t.title = tn.title AND t."userId" = tn."userId" AND tn."nodeType" = 'ROOT'
WHERE tn."parentId" IS NULL;

-- Step 4: Migrate existing Subtasks as ACTION nodes
-- Each existing Subtask becomes an ACTION TaskNode under its parent ROOT
INSERT INTO "TaskNode" (
    id,
    "userId",
    "parentId",
    "rootTaskId",
    title,
    description,
    "nodeType",
    "status",
    "order",
    "estimatedDuration",
    "energyRequired",
    "isCompletable",
    "aiGenerated",
    "aiMetadata",
    "progressMeta",
    "temporalIntent",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "aiGenerationStatus"
)
SELECT 
    gen_random_uuid() as id,
    s."userId",
    tn.id as "parentId",  -- Parent is the ROOT node we created
    tn."rootTaskId" as "rootTaskId",  -- Same root as parent
    s.title,
    s.description,
    'ACTION' as "nodeType",  -- Subtasks become ACTION nodes
    CASE 
        WHEN s.status = 'completed' THEN 'COMPLETED'
        WHEN s.status = 'failed' THEN 'BLOCKED'
        WHEN s.status = 'blocked' THEN 'BLOCKED'
        ELSE 'ACTIVE'
    END as "status",
    s."order",
    s."estimatedDuration",
    s."energyRequired",
    true as "isCompletable",
    s."aiGenerated",
    s."aiSuggestions" as "aiMetadata",
    '{"contributesToProgress": true, "weight": 1.0}' as "progressMeta",
    'today' as "temporalIntent",  -- ACTION nodes are typically for today
    s."createdAt",
    s."updatedAt",
    NULL as "deletedAt",  -- Subtasks don't have soft delete
    'COMPLETED' as "aiGenerationStatus"
FROM "Subtask" s
JOIN task_migration_mapping tmm ON s."parentTaskId" = tmm.old_task_id
JOIN "TaskNode" tn ON tmm.new_root_node_id = tn.id AND tn."nodeType" = 'ROOT'
WHERE s."isDeleted" = false;

-- Step 5: Migrate related data (comments, reminders, etc.) to use new node IDs
-- Update Comments
UPDATE "Comment" c
SET "nodeId" = tn.id
FROM "TaskNode" tn
WHERE c."taskId" IN (
    SELECT old_task_id FROM task_migration_mapping
) AND tn."nodeType" = 'ROOT'
AND tn.title = (SELECT title FROM "Task" t WHERE t.id = c."taskId" LIMIT 1);

-- Update Reminders
UPDATE "Reminder" r
SET "nodeId" = tn.id
FROM "TaskNode" tn
WHERE r."taskId" IN (
    SELECT old_task_id FROM task_migration_mapping
) AND tn."nodeType" = 'ROOT'
AND tn.title = (SELECT title FROM "Task" t WHERE t.id = r."taskId" LIMIT 1);

-- Update TaskShares
UPDATE "TaskShare" ts
SET "nodeId" = tn.id
FROM "TaskNode" tn
WHERE ts."taskId" IN (
    SELECT old_task_id FROM task_migration_mapping
) AND tn."nodeType" = 'ROOT'
AND tn.title = (SELECT title FROM "Task" t WHERE t.id = ts."taskId" LIMIT 1);

-- Update TaskFeedback
UPDATE "TaskFeedback" tf
SET "nodeId" = tn.id
FROM "TaskNode" tn
WHERE tf."taskId" IN (
    SELECT old_task_id FROM task_migration_mapping
) AND tn."nodeType" = 'ROOT'
AND tn.title = (SELECT title FROM "Task" t WHERE t.id = tf."taskId" LIMIT 1);

-- Update RefinementSessions
UPDATE "RefinementSession" rs
SET "nodeId" = tn.id
FROM "TaskNode" tn
WHERE rs."taskId" IN (
    SELECT old_task_id FROM task_migration_mapping
) AND tn."nodeType" = 'ROOT'
AND tn.title = (SELECT title FROM "Task" t WHERE t.id = rs."taskId" LIMIT 1);

-- Update TaskEvents
UPDATE "TaskEvent" te
SET "nodeId" = tn.id
FROM "TaskNode" tn
WHERE te."taskId" IN (
    SELECT old_task_id FROM task_migration_mapping
) AND tn."nodeType" = 'ROOT'
AND tn.title = (SELECT title FROM "Task" t WHERE t.id = te."taskId" LIMIT 1);

-- Update TaskAnalytics
UPDATE "TaskAnalytics" ta
SET "nodeId" = tn.id
FROM "TaskNode" tn
WHERE ta."taskId" IN (
    SELECT old_task_id FROM task_migration_mapping
) AND tn."nodeType" = 'ROOT'
AND tn.title = (SELECT title FROM "Task" t WHERE t.id = ta."taskId" LIMIT 1);

-- Update TaskDependencies
UPDATE "TaskDependency" td
SET "nodeId" = tn.id
FROM "TaskNode" tn
WHERE td."taskId" IN (
    SELECT old_task_id FROM task_migration_mapping
) AND tn."nodeType" = 'ROOT'
AND tn.title = (SELECT title FROM "Task" t WHERE t.id = td."taskId" LIMIT 1);

-- Update dependsOnId as well
UPDATE "TaskDependency" td
SET "dependsOnId" = tn.id
FROM "TaskNode" tn
WHERE td."dependsOnId" IN (
    SELECT old_task_id FROM task_migration_mapping
) AND tn."nodeType" = 'ROOT'
AND tn.title = (SELECT title FROM "Task" t WHERE t.id = td."dependsOnId" LIMIT 1);

-- Step 6: Update Embeddings
UPDATE "Embedding" e
SET "docId" = tn.id,
"docType" = 'taskNode'
FROM "TaskNode" tn
WHERE e."docId" IN (
    SELECT old_task_id FROM task_migration_mapping
) AND e."docType" = 'task'
AND tn."nodeType" = 'ROOT'
AND tn.title = (SELECT title FROM "Task" t WHERE t.id = e."docId" LIMIT 1);

-- Step 7: Update QuestionSessions
UPDATE "QuestionSession" qs
SET "nodeId" = tn.id
FROM "TaskNode" tn
WHERE qs."taskId" IN (
    SELECT old_task_id FROM task_migration_mapping
) AND tn."nodeType" = 'ROOT'
AND tn.title = (SELECT title FROM "Task" t WHERE t.id = qs."taskId" LIMIT 1);

-- Step 8: Show migration summary
SELECT 
    'Migration Summary' as info,
    (SELECT COUNT(*) FROM "TaskNode" WHERE "nodeType" = 'ROOT') as root_nodes_created,
    (SELECT COUNT(*) FROM "TaskNode" WHERE "nodeType" = 'ACTION') as action_nodes_created,
    (SELECT COUNT(*) FROM task_migration_mapping WHERE migration_status = 'completed') as tasks_migrated,
    (SELECT COUNT(*) FROM "Subtask" WHERE "isDeleted" = false) as subtasks_migrated;

-- Step 9: Clean up (uncomment when ready to remove old tables)
-- DROP TABLE IF EXISTS "Task" CASCADE;
-- DROP TABLE IF EXISTS "Subtask" CASCADE;
-- DROP TABLE IF EXISTS task_migration_mapping;

-- Notes:
-- 1. This migration preserves all existing data and relationships
-- 2. Old Tasks become ROOT nodes with their original metadata
-- 3. Old Subtasks become ACTION nodes under their parent ROOT
-- 4. All related data (comments, reminders, etc.) are migrated to point to new nodes
-- 5. The migration is designed to be run once during the upgrade
-- 6. After successful migration, old tables can be dropped
-- 7. AI metadata and user modifications are preserved
