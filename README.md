# Autocomplete Tags Interface (API)

A custom Directus interface that combines autocomplete search functionality with multi-select tags. Search through **any external API** and select multiple items as tags, stored in JSON or CSV format.

Based on the native [input-autocomplete-api](https://github.com/directus/directus/tree/main/app/src/interfaces/input-autocomplete-api) interface pattern.

## Features

- 🌐 **External API Search**: Query any REST API endpoint for autocomplete results
- 🔍 **Real-time Search**: Debounced or throttled API requests
- 🏷️ **Multi-select Tags**: Select multiple items and display them as removable tags
- 📦 **Flexible Storage**: Store values as JSON array or CSV string
- 🎯 **Path-based Extraction**: Use dot notation to extract values from nested API responses
- ➕ **Custom Tags**: Optionally allow adding custom tags not from the API
- ⚡ **Performance**: Configurable throttle/debounce with customizable rates
- 🔧 **Flexible Configuration**: Works with any API structure

## Installation

1. The extension is already in your Directus extensions folder
2. Build the extension:
   ```bash
   cd docker/extensions/autocomplete-tags
   npm run build
   ```
3. Restart your Directus instance

## Usage

### Basic Setup

1. In Directus Studio, go to **Settings > Data Model**
2. Select your collection and add a new field
3. Choose **Autocomplete Tags (API)** as the interface
4. Configure the field:
   - **Type**: Select `JSON` for array storage or `String/Text` for CSV storage
   - **API URL**: Enter your API endpoint with `{{value}}` placeholder
   - **Results Path**: Path to results array in API response
   - **Text Path**: Field to display from each result
   - **Value Path**: Field to store from each result

### Configuration Options

#### Required Options

- **API URL**: The external API endpoint
  - Example: `https://api.github.com/search/users?q={{value}}`
  - Use `{{value}}` as placeholder for the search query
  - The placeholder will be URL-encoded automatically

#### Response Configuration

- **Results Path**: Path to results array in API response
  - Example: `data.results` or `items`
  - Leave empty if the response itself is an array
  - Supports nested paths with dot notation

- **Text Path**: Path to display text in each result item
  - Example: `name`, `title`, `login`
  - Default: `name`
  - Supports nested paths: `user.name`

- **Value Path**: Path to value to store
  - Example: `id`, `slug`, `login`
  - Defaults to text path if not specified
  - Supports nested paths: `user.id`

#### Request Configuration

- **Trigger**: When to trigger API requests
  - **Debounce** (default): Wait for user to stop typing
  - **Throttle**: Execute at regular intervals while typing

- **Rate (ms)**: Milliseconds to wait before triggering
  - Default: 500ms for debounce
  - Recommendation: 300-800ms for debounce, 1000-2000ms for throttle

#### Storage Options

- **Storage Format**: Choose how to store the tags
  - **JSON (Array)**: Stores as `["value1", "value2"]` - recommended
  - **CSV (Comma-separated)**: Stores as `"value1, value2"`

#### Display Options

- **Placeholder**: Custom placeholder text for the search input
- **Icon Left/Right**: Add icons to the search input
- **Allow Custom Tags**: Enable users to add custom tags not from the API

### Example Configurations

#### 1. GitHub Users Search

```yaml
Field Type: JSON
API URL: https://api.github.com/search/users?q={{value}}
Results Path: items
Text Path: login
Value Path: id
Storage Format: json
Trigger: debounce
Rate: 500
```

**API Response Structure:**
```json
{
  "items": [
    { "login": "octocat", "id": 583231 },
    { "login": "torvalds", "id": 1024025 }
  ]
}
```

**Stored Value:** `[583231, 1024025]`

#### 2. Movie Database (TMDB)

```yaml
Field Type: JSON
API URL: https://api.themoviedb.org/3/search/movie?api_key=YOUR_KEY&query={{value}}
Results Path: results
Text Path: title
Value Path: id
Storage Format: json
```

**API Response:**
```json
{
  "results": [
    { "id": 550, "title": "Fight Club" },
    { "id": 680, "title": "Pulp Fiction" }
  ]
}
```

#### 3. Simple Array Response

```yaml
Field Type: JSON
API URL: https://api.example.com/tags?search={{value}}
Results Path: [leave empty]
Text Path: name
Value Path: slug
```

**API Response (direct array):**
```json
[
  { "name": "JavaScript", "slug": "javascript" },
  { "name": "TypeScript", "slug": "typescript" }
]
```

**Stored Value:** `["javascript", "typescript"]`

#### 4. Nested Data Structure

```yaml
API URL: https://api.example.com/search?q={{value}}
Results Path: data.items
Text Path: attributes.name
Value Path: id
```

**API Response:**
```json
{
  "data": {
    "items": [
      { "id": "abc", "attributes": { "name": "Item 1" } },
      { "id": "def", "attributes": { "name": "Item 2" } }
    ]
  }
}
```

#### 5. OpenStreetMap Nominatim (Places)

```yaml
API URL: https://nominatim.openstreetmap.org/search?format=json&q={{value}}
Results Path: [leave empty]
Text Path: display_name
Value Path: place_id
Trigger: debounce
Rate: 1000
```

#### 6. REST Countries API

```yaml
API URL: https://restcountries.com/v3.1/name/{{value}}
Results Path: [leave empty]
Text Path: name.common
Value Path: cca3
```

## API Response Requirements

Your API should return:

1. **JSON format** (required)
2. **Array of items** (either directly or at a specified path)
3. **Consistent structure** for all items

### Supported Response Formats

**Direct Array:**
```json
[
  { "id": 1, "name": "Item 1" },
  { "id": 2, "name": "Item 2" }
]
```

**Nested Object:**
```json
{
  "data": {
    "results": [
      { "id": 1, "name": "Item 1" }
    ]
  }
}
```

**With Metadata:**
```json
{
  "items": [...],
  "total": 100,
  "page": 1
}
```

## Path Syntax

Use dot notation to navigate nested objects:

| Path | Accesses |
|------|----------|
| `name` | `{ name: "value" }` |
| `user.name` | `{ user: { name: "value" } }` |
| `data.items` | `{ data: { items: [...] } }` |
| `attributes.display_name` | `{ attributes: { display_name: "value" } }` |

## CORS Considerations

Since this interface makes requests directly from the browser, the external API must support CORS (Cross-Origin Resource Sharing).

### If the API doesn't support CORS:

1. **Use a proxy**: Create a server-side proxy that forwards requests
2. **Use a CORS proxy service** (for development only)
3. **Request CORS support** from the API provider

### Example Proxy Setup (Node.js/Express)

```javascript
app.get('/api/proxy', async (req, res) => {
  const query = req.query.q;
  const response = await fetch(`https://external-api.com/search?q=${query}`);
  const data = await response.json();
  res.json(data);
});
```

Then use: `https://your-domain.com/api/proxy?q={{value}}`

## Throttle vs Debounce

### Debounce (Recommended for most cases)
- Waits for user to stop typing
- Makes request after specified delay
- Best for: Text search, user input
- Example: User types "java" → waits 500ms → makes request

### Throttle
- Executes at regular intervals
- Makes request while user is still typing
- Best for: Real-time updates, live search
- Example: User types "javascript" → makes request every 1000ms

## Field Type Recommendations

| Storage Format | Recommended Field Type | SQL Type |
|---------------|----------------------|----------|
| JSON | JSON | `json` |
| CSV | String or Text | `varchar` or `text` |

## API Usage Examples

### Querying Items with Tags

```typescript
// Find posts with specific tag
const posts = await directus.items('posts').readByQuery({
  filter: {
    tags: {
      _contains: "javascript"
    }
  }
});
```

### Creating Items with Tags

```typescript
// JSON format
await directus.items('posts').createOne({
  title: 'My Post',
  tags: ['javascript', 'vue', 'directus']
});

// CSV format
await directus.items('posts').createOne({
  title: 'My Post',
  tags: 'javascript, vue, directus'
});
```

## Development

### Building

```bash
npm run build
```

### Watch Mode (Development)

```bash
npm run dev
```

### Validation

```bash
npm run validate
```

## Troubleshooting

### No results showing up

- **Check the API URL**: Test it in your browser with a sample value
- **Verify Results Path**: Use browser dev tools to inspect the actual API response structure
- **Check CORS**: Open browser console and look for CORS errors
- **Test Text/Value Paths**: Ensure they match the actual field names in the API response

### CORS errors

```
Access to fetch at 'https://api.example.com' from origin 'https://your-directus.com' 
has been blocked by CORS policy
```

**Solution**: Use a proxy endpoint or request CORS support from the API

### API not being called

- **Check Rate setting**: Make sure you're waiting long enough
- **Verify URL format**: Ensure `{{value}}` placeholder is present
- **Check browser console**: Look for JavaScript errors

### Wrong values being stored

- **Verify Value Path**: Check it matches your API response structure
- **Test with browser dev tools**: Inspect the API response to confirm field names
- **Try without Value Path**: Let it default to Text Path

## Performance Tips

1. **Set appropriate rate limits**:
   - 300-500ms for debounce (general use)
   - 500-1000ms for debounce (slower APIs)
   - 1000-2000ms for throttle

2. **Use specific paths**: Extract only what you need from API responses

3. **Cache on API side**: If you control the API, implement caching

4. **Consider rate limiting**: Some APIs have rate limits - use throttle to avoid hitting them

## Security Considerations

- **API Keys**: Don't expose API keys in the URL. Use a backend proxy instead
- **Input Validation**: The search value is URL-encoded automatically
- **XSS Protection**: Display values are handled by Vue's template system
- **HTTPS**: Always use HTTPS endpoints in production

## Example API Providers

These APIs work well with this interface:

- **GitHub API**: Search users, repos, issues (no auth needed for basic search)
- **REST Countries**: Country information
- **OpenStreetMap Nominatim**: Place search
- **TheMealDB**: Recipe search
- **The Movie DB (TMDB)**: Movie/TV search (requires free API key)
- **JSONPlaceholder**: Test API for development

## Support

For issues or questions:
1. Check this README
2. Review QUICKSTART.md for setup
3. Check browser console for errors
4. Verify API response structure
5. Test API endpoint independently

## License

MIT - This extension follows the same license as your Directus installation.
