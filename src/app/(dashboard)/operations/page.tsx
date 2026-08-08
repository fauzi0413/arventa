import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Operasional",
  description: "Kelola tugas housekeeping dan maintenance dengan Kanban board.",
};

// ---------------------------------------------------------------------------
// Operations Page — /operations (Housekeeping Kanban Board)
// ---------------------------------------------------------------------------
// This page will use dnd-kit for drag-and-drop Kanban functionality.
// ---------------------------------------------------------------------------

export default function OperationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operasional</h1>
          <p className="text-muted-foreground">
            Kanban board untuk tugas housekeeping dan maintenance.
          </p>
        </div>
        {/* TODO: Add task button */}
      </div>

      {/* TODO: dnd-kit Kanban board with TODO / IN_PROGRESS / DONE columns */}
      <div className="grid grid-cols-3 gap-4">
        {["TODO", "IN PROGRESS", "DONE"].map((column) => (
          <div
            key={column}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {column}
            </h2>
            <div className="space-y-2">
              <p className="text-center text-xs text-muted-foreground py-8">
                Belum ada tugas
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
