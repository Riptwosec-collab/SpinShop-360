import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export interface AuditLogEntry {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Records an audit trail entry for sensitive admin actions (order status
 * changes, product edits, coupon changes, etc). Call this from Route
 * Handlers / Server Actions — never from the client.
 *
 * In Mock Mode (no Supabase configured) this just logs to the server
 * console so the call sites don't need conditional branches.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    // eslint-disable-next-line no-console
    console.info("[audit-log:mock]", entry.action, entry.entityType, entry.entityId, entry.metadata ?? {});
    return;
  }

  const { error } = await supabase.from("activity_logs").insert({
    user_id: entry.userId ?? null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    metadata: (entry.metadata ?? {}) as Json,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[audit-log] failed to write entry", error);
  }
}
