# YouTube Broadcasts Auto-Generation

This system auto-generates the YouTube embed HTML files from a centralized configuration.

## Files

- **broadcasts-config.json** - Configuration file containing all broadcast metadata
- **generate-broadcasts.js** - Script that generates the HTML files

## Adding or Modifying Broadcasts

1. Edit `broadcasts-config.json` with your broadcast details:
   - `name`: The filename (without .html extension)
   - `title`: The display title for the iframe
   - `embedCode`: The YouTube video ID and SI parameter (e.g., "m6KcpljdfRs?si=Z8qAVB7jQT9I7zqc")
   - `params`: Any additional parameters (e.g., "&amp;controls=0&autoplay=1&rel=0&loop=1")

2. Run the generation script:
   ```bash
   node generate-broadcasts.js
   ```

3. The HTML files will be generated in `public/broadcasts/videos/`

## Example Configuration

```json
{
  "name": "bcwelcomeyt",
  "title": "Intro Video",
  "embedCode": "m6KcpljdfRs?si=Z8qAVB7jQT9I7zqc",
  "params": "&amp;controls=0&autoplay=1&rel=0"
}
```

This will generate `public/broadcasts/videos/bcwelcomeyt.html` with:
- Title: "Intro Video"
- Embed URL: `https://www.youtube.com/embed/m6KcpljdfRs?si=Z8qAVB7jQT9I7zqc&amp;controls=0&autoplay=1&rel=0`
