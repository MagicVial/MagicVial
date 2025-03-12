# API Reference

This document provides comprehensive reference information for the MagicVial API, enabling developers to integrate with our platform and build applications that enhance the alchemical experience.

## Getting Started

### Authentication

All API requests require authentication using an API key:

```javascript
const response = await fetch('https://api.magicvial.co/v1/materials', {
  headers: {
    'Authorization': `Bearer ${YOUR_API_KEY}`,
    'Content-Type': 'application/json'
  }
});
```

To obtain an API key, register as a developer on the [MagicVial Developer Portal](https://developers.magicvial.co).

### Base URL

All API requests should be made to:

```
https://api.magicvial.co/v1/
```

### Response Format

All responses are returned in JSON format with the following structure:

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

Error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found",
    "details": { ... }
  }
}
```

### Rate Limiting

API requests are limited to 100 requests per minute per API key. Headers indicate your current rate limit status:

- `X-RateLimit-Limit`: Maximum requests per minute
- `X-RateLimit-Remaining`: Remaining requests in the current window
- `X-RateLimit-Reset`: Time until the rate limit resets (in seconds)

## SDK Installation

We provide SDKs for multiple languages to simplify integration:

### JavaScript/TypeScript

```bash
npm install @magicvial/sdk
```

```javascript
import { MagicVialClient } from '@magicvial/sdk';

const client = new MagicVialClient({
  apiKey: 'YOUR_API_KEY',
  environment: 'production' // or 'development'
});
```

### Python

```bash
pip install magicvial-sdk
```

```python
from magicvial import MagicVialClient

client = MagicVialClient(
  api_key='YOUR_API_KEY',
  environment='production'
)
```

## Core Resources

### Materials

Materials are the building blocks used in the crafting process.

#### List Materials

Retrieves a paginated list of materials.

```javascript
// Using SDK
const materials = await client.materials.list({
  limit: 20,
  offset: 0,
  type: 'basic'
});

// Direct API call
const response = await fetch('https://api.magicvial.co/v1/materials?limit=20&offset=0&type=basic', {
  headers: { 'Authorization': `Bearer ${YOUR_API_KEY}` }
});
```

**Query Parameters:**
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `type` (optional): Filter by material type ('basic', 'rare', 'seasonal', 'mysterious')
- `rarity` (optional): Filter by rarity level ('common', 'uncommon', 'rare', 'epic', 'legendary')

#### Get Material

Retrieves a specific material by ID.

```javascript
// Using SDK
const material = await client.materials.get('mat_12345');

// Direct API call
const response = await fetch('https://api.magicvial.co/v1/materials/mat_12345', {
  headers: { 'Authorization': `Bearer ${YOUR_API_KEY}` }
});
```

**Path Parameters:**
- `id`: Material ID

#### Get User Materials

Retrieves materials owned by a specific user.

```javascript
// Using SDK
const userMaterials = await client.materials.getUserMaterials('user_12345');

// Direct API call
const response = await fetch('https://api.magicvial.co/v1/users/user_12345/materials', {
  headers: { 'Authorization': `Bearer ${YOUR_API_KEY}` }
});
```

**Path Parameters:**
- `userId`: User ID

**Query Parameters:**
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

### Recipes

Recipes define the combinations of materials needed to create specific outputs.

#### List Recipes

Retrieves a paginated list of recipes.

```javascript
// Using SDK
const recipes = await client.recipes.list({
  limit: 20,
  offset: 0,
  difficulty: 'basic'
});

// Direct API call
const response = await fetch('https://api.magicvial.co/v1/recipes?limit=20&offset=0&difficulty=basic', {
  headers: { 'Authorization': `Bearer ${YOUR_API_KEY}` }
});
```

**Query Parameters:**
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `difficulty` (optional): Filter by difficulty ('basic', 'advanced', 'legendary')
- `creator` (optional): Filter by creator type ('system', 'community')

#### Get Recipe

Retrieves a specific recipe by ID.

```javascript
// Using SDK
const recipe = await client.recipes.get('recipe_12345');

// Direct API call
const response = await fetch('https://api.magicvial.co/v1/recipes/recipe_12345', {
  headers: { 'Authorization': `Bearer ${YOUR_API_KEY}` }
});
```

**Path Parameters:**
- `id`: Recipe ID

### Crafting

The crafting endpoints handle the process of combining materials to create new tokens.

#### Attempt Crafting

Initiates a crafting attempt using specified materials and recipe.

```javascript
// Using SDK
const result = await client.crafting.attempt({
  materials: ['mat_12345', 'mat_67890'],
  recipeId: 'recipe_12345',
  options: {
    useGuildBoost: true
  }
});

// Direct API call
const response = await fetch('https://api.magicvial.co/v1/crafting/attempt', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${YOUR_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    materials: ['mat_12345', 'mat_67890'],
    recipeId: 'recipe_12345',
    options: {
      useGuildBoost: true
    }
  })
});
```

**Request Body:**
- `materials`: Array of material IDs to use in crafting
- `recipeId`: ID of the recipe to follow (optional for experimental crafting)
- `options` (optional):
  - `useGuildBoost` (boolean): Whether to apply guild crafting bonuses
  - `useBooster` (boolean): Whether to use crafting success boosters

#### Get Crafting History

Retrieves the crafting history for a user.

```javascript
// Using SDK
const history = await client.crafting.getHistory({
  userId: 'user_12345',
  limit: 20,
  offset: 0
});

// Direct API call
const response = await fetch('https://api.magicvial.co/v1/crafting/history?userId=user_12345&limit=20&offset=0', {
  headers: { 'Authorization': `Bearer ${YOUR_API_KEY}` }
});
```

**Query Parameters:**
- `userId`: User ID
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `success` (optional): Filter by success status (boolean)

### Guilds

The guild endpoints manage collective groups of alchemists.

#### List Guilds

Retrieves a paginated list of guilds.

```javascript
// Using SDK
const guilds = await client.guilds.list({
  limit: 20,
  offset: 0,
  sortBy: 'memberCount'
});

// Direct API call
const response = await fetch('https://api.magicvial.co/v1/guilds?limit=20&offset=0&sortBy=memberCount', {
  headers: { 'Authorization': `Bearer ${YOUR_API_KEY}` }
});
```

**Query Parameters:**
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): Sort field ('memberCount', 'level', 'createdAt')
- `sortDirection` (optional): Sort direction ('asc', 'desc')

#### Get Guild

Retrieves a specific guild by ID.

```javascript
// Using SDK
const guild = await client.guilds.get('guild_12345');

// Direct API call
const response = await fetch('https://api.magicvial.co/v1/guilds/guild_12345', {
  headers: { 'Authorization': `Bearer ${YOUR_API_KEY}` }
});
```

**Path Parameters:**
- `id`: Guild ID

#### Create Guild

Creates a new guild.

```javascript
// Using SDK
const newGuild = await client.guilds.create({
  name: 'Alchemy Masters',
  description: 'A guild dedicated to mastering the art of alchemy',
  founderUserId: 'user_12345',
  initialMembers: ['user_67890', 'user_54321']
});

// Direct API call
const response = await fetch('https://api.magicvial.co/v1/guilds', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${YOUR_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Alchemy Masters',
    description: 'A guild dedicated to mastering the art of alchemy',
    founderUserId: 'user_12345',
    initialMembers: ['user_67890', 'user_54321']
  })
});
```

**Request Body:**
- `name`: Guild name (required)
- `description`: Guild description (required)
- `founderUserId`: User ID of the guild founder (required)
- `initialMembers`: Array of user IDs for initial members (optional)
- `emblem`: Guild emblem configuration (optional)
- `access`: Guild access policy ('public', 'private') (optional, default: 'public')

## Event Webhooks

You can register webhooks to receive real-time notifications about events in the MagicVial ecosystem.

### Registering a Webhook

```javascript
// Using SDK
const webhook = await client.webhooks.create({
  url: 'https://your-app.com/webhooks/magicvial',
  events: ['crafting.success', 'crafting.failure', 'guild.member_joined'],
  secret: 'your_webhook_secret'
});

// Direct API call
const response = await fetch('https://api.magicvial.co/v1/webhooks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${YOUR_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://your-app.com/webhooks/magicvial',
    events: ['crafting.success', 'crafting.failure', 'guild.member_joined'],
    secret: 'your_webhook_secret'
  })
});
```

### Webhook Payload Structure

```json
{
  "id": "evt_12345",
  "type": "crafting.success",
  "created": 1627984000,
  "data": {
    // Event-specific data
  }
}
```

### Verifying Webhook Signatures

For security, verify webhook signatures using the `x-magicvial-signature` header:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_ERROR` | Invalid or missing API key |
| `AUTHORIZATION_ERROR` | Insufficient permissions for the requested operation |
| `RESOURCE_NOT_FOUND` | The requested resource does not exist |
| `VALIDATION_ERROR` | Invalid request parameters |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |
| `INSUFFICIENT_MATERIALS` | Not enough materials for crafting |
| `INVALID_RECIPE` | Recipe does not exist or is invalid |
| `GUILD_REQUIREMENTS_NOT_MET` | Requirements for guild creation or action not met |

## Pagination

All list endpoints support pagination using the `limit` and `offset` parameters.

Example:

```javascript
// First page (20 items)
const page1 = await client.materials.list({ limit: 20, offset: 0 });

// Second page (next 20 items)
const page2 = await client.materials.list({ limit: 20, offset: 20 });
```

The response includes pagination information:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

## Versioning

The API uses a date-based versioning system. The current version is `v1`.

Future versions will be released as `v2`, `v3`, etc., with appropriate migration periods.

## Support

For API support, please contact our developer team at:

- Email: dev@magicvial.co
- Developer Forum: [forum.magicvial.co](https://forum.magicvial.co)
- Discord: [discord.gg/magicvial](https://discord.gg/magicvial) 