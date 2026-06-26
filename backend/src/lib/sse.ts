import type { Response } from "express";

const connections = new Map<string, Set<Response>>();

export function addClient(userId: string, res: Response) {
  let clients = connections.get(userId);
  if (!clients) {
    clients = new Set();
    connections.set(userId, clients);
  }
  clients.add(res);
}

export function removeClient(userId: string, res: Response) {
  const clients = connections.get(userId);
  if (!clients) return;
  clients.delete(res);
  if (clients.size === 0) connections.delete(userId);
}

export function sendToUser(
  userId: string,
  payload: { event?: string; id?: string; data: unknown },
) {
  const clients = connections.get(userId);
  if (!clients) return;
  const lines: string[] = [];
  if (payload.id) lines.push(`id: ${payload.id}`);
  if (payload.event) lines.push(`event: ${payload.event}`);
  lines.push(`data: ${JSON.stringify(payload.data)}`);
  const message = lines.join("\n") + "\n\n";
  for (const res of clients) {
    try {
      res.write(message);
    } catch {
      clients.delete(res);
    }
  }
  if (clients.size === 0) connections.delete(userId);
}
