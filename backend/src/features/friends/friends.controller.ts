import type { Request, Response } from "express";
import { searchUsersSchema, sendFriendRequestSchema, requestIdParamSchema } from "./friends.validation.js";
import * as friendService from "./friends.service.js";
import { success, message, created } from "../../shared/response.js";

export async function search(req: Request, res: Response) {
  const { query } = searchUsersSchema.parse(req.query);
  const users = await friendService.searchUsers(query, req.user!.id);
  success(res, { users });
}

export async function send(req: Request, res: Response) {
  const { receiverId } = sendFriendRequestSchema.parse(req.body);
  const result = await friendService.sendFriendRequest(receiverId, req.user!.id);

  switch (result.kind) {
    case "already_sent":
      message(res, "Friend request already sent");
      break;
    case "auto_accepted":
      message(res, "Friend request accepted");
      break;
    case "created":
      created(res, { request: result.request });
      break;
    case "resent":
      success(res, { request: result.request });
      break;
  }
}

export async function listReceived(req: Request, res: Response) {
  const requests = await friendService.getReceivedRequests(req.user!.id);
  success(res, { requests });
}

export async function accept(req: Request, res: Response) {
  const { id } = requestIdParamSchema.parse(req.params);
  await friendService.acceptFriendRequest(id, req.user!.id);
  message(res, "Friend request accepted");
}

export async function reject(req: Request, res: Response) {
  const { id } = requestIdParamSchema.parse(req.params);
  await friendService.rejectFriendRequest(id, req.user!.id);
  message(res, "Friend request rejected");
}

export async function list(req: Request, res: Response) {
  const friends = await friendService.listFriends(req.user!.id);
  success(res, { friends });
}
