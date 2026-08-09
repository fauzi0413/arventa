import { prisma } from "../../src/lib/prisma";
import {
  Unit,
  User,
  TaskStatus,
  TaskPriority,
} from "../../generated/prisma/client";

interface SeedTasksProps {
  unitApt12B02: Unit;
  unitKos102: Unit;
  unitKos101: Unit;
  owner: User;
  housekeeping: User;
}

/**
 * Seed maintenance tasks for Housekeeping Kanban Board (TODO, IN_PROGRESS, DONE).
 * Idempotent: Checks by unitId and task title before creation.
 */
export async function seedMaintenanceTasks({
  unitApt12B02,
  unitKos102,
  unitKos101,
  owner,
  housekeeping,
}: SeedTasksProps) {
  console.log("\n🛠️ Seeding Maintenance Tasks (Idempotent)...");

  let taskTodo = await prisma.maintenanceTask.findFirst({
    where: {
      unitId: unitApt12B02.id,
      title: "Deep cleaning unit Apt 12B-02",
    },
  });
  if (!taskTodo) {
    taskTodo = await prisma.maintenanceTask.create({
      data: {
        unitId: unitApt12B02.id,
        createdById: owner.id,
        assignedToId: housekeeping.id,
        title: "Deep cleaning unit Apt 12B-02",
        description:
          "Pembersihan total ruangan, penggantian sprei, dan penggantian amenities unit Apt 12B-02.",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    console.log(`✅ Created Task [TODO]: ${taskTodo.title}`);
  } else {
    console.log(`ℹ️ Existing Task [TODO] found: ${taskTodo.title}`);
  }

  let taskInProgress = await prisma.maintenanceTask.findFirst({
    where: {
      unitId: unitKos102.id,
      title: "Perbaikan kran air bocor Kamar 102",
    },
  });
  if (!taskInProgress) {
    taskInProgress = await prisma.maintenanceTask.create({
      data: {
        unitId: unitKos102.id,
        createdById: owner.id,
        assignedToId: housekeeping.id,
        title: "Perbaikan kran air bocor Kamar 102",
        description:
          "Penggantian seal kran wastafel yang bocor di kamar mandi Kamar 102.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });
    console.log(`✅ Created Task [IN_PROGRESS]: ${taskInProgress.title}`);
  } else {
    console.log(`ℹ️ Existing Task [IN_PROGRESS] found: ${taskInProgress.title}`);
  }

  let taskDone = await prisma.maintenanceTask.findFirst({
    where: {
      unitId: unitKos101.id,
      title: "Ganti bohlam lampu selasar",
    },
  });
  if (!taskDone) {
    taskDone = await prisma.maintenanceTask.create({
      data: {
        unitId: unitKos101.id,
        createdById: owner.id,
        assignedToId: housekeeping.id,
        title: "Ganti bohlam lampu selasar",
        description:
          "Penggantian bohlam LED 12W mati di selasar lantai 1 Kos Graha Asri.",
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });
    console.log(`✅ Created Task [DONE]: ${taskDone.title}`);
  } else {
    console.log(`ℹ️ Existing Task [DONE] found: ${taskDone.title}`);
  }

  return {
    taskTodo,
    taskInProgress,
    taskDone,
  };
}
