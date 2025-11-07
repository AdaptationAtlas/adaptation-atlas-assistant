# API Client

A type-safe API client for the Adaptation Atlas Co-Pilot backend, with React hooks for easy integration.

## Features

- ✅ Fully typed using generated OpenAPI types
- ✅ Automatic JWT token management (localStorage)
- ✅ Streaming support (SSE and NDJSON)
- ✅ React hooks for auth and chat
- ✅ Error handling and automatic token cleanup on 401

## Quick Start

### Authentication

```tsx
import { useAuth } from '@/lib/api';

function LoginForm() {
  const { login, isAuthenticated, isLoading, error } = useAuth();

  const handleLogin = async () => {
    const success = await login('username', 'password');
    if (success) {
      console.log('Logged in!');
    }
  };

  return (
    <div>
      {error && <p>Error: {error}</p>}
      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      {isAuthenticated && <p>You are logged in!</p>}
    </div>
  );
}
```

### Get Current User

```tsx
import { useUser } from '@/lib/api';

function UserProfile() {
  const { user, isLoading, error, refetch } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Not logged in</div>;

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Chat (Simple)

The `useSimpleChat` hook is the easiest way to send a single message and receive responses:

```tsx
import { useSimpleChat } from '@/lib/api';

function ChatBox() {
  const { send, responses, isLoading, error } = useSimpleChat();

  const handleSend = async () => {
    await send('What crops are most vulnerable to drought in Kenya?');
  };

  return (
    <div>
      <button onClick={handleSend} disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Message'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <div>
        {responses.map((msg, idx) => (
          <div key={idx}>
            {msg.type === 'ai' && <p><strong>AI:</strong> {msg.content}</p>}
            {msg.type === 'tool' && (
              <p><em>Tool ({msg.name}): {msg.content}</em></p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Chat (Advanced)

For more control over multiple conversations, use `useChat`:

```tsx
import { useChat } from '@/lib/api';

function AdvancedChat() {
  const { messages, isStreaming, sendMessage, cancelStream, clearMessages } = useChat();

  const handleSend = async (query: string) => {
    await sendMessage(query, true); // true = use SSE, false = use NDJSON
  };

  return (
    <div>
      <button onClick={() => handleSend('Tell me about climate adaptation')}>
        Send
      </button>
      {isStreaming && (
        <button onClick={cancelStream}>Cancel Stream</button>
      )}
      <button onClick={clearMessages}>Clear</button>

      <div>
        {messages.map((msg, idx) => (
          <div key={idx}>
            <strong>{msg.type}:</strong> {msg.content}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Low-Level API

### Direct Endpoint Functions

```tsx
import { login, getCurrentUser, sendChatMessage } from '@/lib/api';

// Login
const token = await login('username', 'password');
console.log('Token:', token.access_token);

// Get user
const user = await getCurrentUser();
console.log('User:', user.username);

// Send chat message with streaming
await sendChatMessage(
  'What is climate adaptation?',
  {
    onMessage: (message) => console.log('Received:', message),
    onError: (error) => console.error('Error:', error),
    onComplete: () => console.log('Stream complete'),
  },
  true, // Use SSE (true) or NDJSON (false)
);
```

### Using the API Client Directly

```tsx
import { apiClient } from '@/lib/api';

// Custom request
const response = await apiClient.get('/custom-endpoint');

// With custom options
const data = await apiClient.post('/custom-endpoint', {
  customField: 'value',
});
```

## Message Types

The chat endpoint returns two types of messages:

### AI Response Message

```tsx
{
  type: 'ai',
  content: 'Here is the answer...',
  finish_reason: 'stop' // or 'length', 'tool_calls', etc.
}
```

### Tool Response Message

```tsx
{
  type: 'tool',
  name: 'select_dataset', // or 'create_chart', etc.
  content: 'Found dataset: ...',
  status: 'success' // or 'error'
}
```

## Streaming Formats

The backend supports two streaming formats:

### Server-Sent Events (SSE)

- Uses `Content-Type: text/event-stream`
- Format: `data: {...json...}\n\n`
- Better for real-time updates in browsers
- **Recommended for most use cases**

### NDJSON (Newline-Delimited JSON)

- Uses `Content-Type: application/x-ndjson`
- Format: `{...json...}\n`
- Simpler format, easier to parse in some cases

Set the format in `sendChatMessage` or `useChat`:

```tsx
sendMessage(query, true);  // SSE (default)
sendMessage(query, false); // NDJSON
```

## Authentication Flow

1. User calls `login(username, password)`
2. Token is stored in localStorage as `atlas_assistant_token`
3. All subsequent requests include `Authorization: Bearer <token>` header
4. On 401 response, token is automatically cleared
5. User can call `logout()` to manually clear the token

## Error Handling

All hooks and functions include error handling:

```tsx
const { error } = useAuth();
const { error: userError } = useUser();
const { error: chatError } = useChat();

// Errors are strings with descriptive messages
if (error) {
  console.error('Auth error:', error);
}
```

## TypeScript Types

All types are automatically generated from the backend OpenAPI spec:

```tsx
import type {
  User,
  Token,
  ChatRequest,
  AiResponseMessage,
  ToolResponseMessage,
  ChatMessage,
} from '@/lib/api';
```

## Backend URL Configuration

By default, the client connects to `http://127.0.0.1:8000`. To change this:

```tsx
import { apiClient } from '@/lib/api';

// Set a custom base URL
apiClient.baseUrl = 'https://api.example.com';

// Or create a new client instance
import { ApiClient } from '@/lib/api';
const customClient = new ApiClient('https://api.example.com');
```

## Development

The API client is located in `src/lib/api/`:

- `client.ts` - Base HTTP client with auth
- `endpoints.ts` - Endpoint functions
- `streaming.ts` - Streaming utilities
- `hooks.ts` - React hooks
- `index.ts` - Public exports

Types are auto-generated in `src/generated/types.gen.ts` by running:

```bash
npm run generate-types
```
