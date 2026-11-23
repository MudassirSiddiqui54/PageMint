import { deleteAccountData } from '../services/account.service.js';
import { clearTokenCookies } from '../utils/tokens.js';

export async function deleteAccount(req, res) {
  await deleteAccountData(req.user);
  clearTokenCookies(res);
  // Avoid returning internal storage paths or identifiers to the client.
  res.status(204).end();
}
