import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listEmailLog, type EmailLogEntry } from "@/lib/email-log";

const statusVariant = (status: EmailLogEntry["status"]) => {
  if (status === "sent") return "default" as const;
  if (status === "failed") return "destructive" as const;
  return "secondary" as const;
};

const statusLabel: Record<EmailLogEntry["status"], string> = {
  queued: "Queued",
  sent: "Sent",
  failed: "Failed",
  skipped_no_email: "No email on file",
  skipped_not_configured: "Email not configured",
};

const AdminEmailLog = () => {
  const [entries, setEntries] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listEmailLog().then(({ data, error }) => {
      if (error) toast.error("Couldn't load email log", { description: error });
      setEntries(data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Email Log</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every transactional email Nyuzi has attempted to send — most recent first.
      </p>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No emails sent yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm capitalize">{entry.template.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-sm">{entry.recipient ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(entry.status)}>{statusLabel[entry.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground max-w-xs truncate">
                    {entry.error ?? ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AdminEmailLog;
