export { apiClient, ApiClient } from './client';

export {
  login,
  logout,
  getCurrentUser,
  sendChatMessage,
  isAuthenticated,
  getToken,
} from './endpoints';

export {
  readStream,
  createStreamController,
  type StreamOptions,
  type ChatMessage,
} from './streaming';

export { useAuth, useUser, useChat, useSimpleChat } from './hooks';