# Quick Start Guide: Writing Blog Posts

## Adding a New Post

### Step 1: Create the File

Navigate to the `content/posts/` directory and create a new Markdown file:

```bash
cd content/posts/
touch my-new-post.md
```

**File naming conventions:**
- Use lowercase letters
- Separate words with hyphens
- Be descriptive but concise
- Don't include dates in filename (use frontmatter instead)

Examples:
- ✅ `understanding-ghg-accounting.md`
- ✅ `transit-oriented-development.md`
- ❌ `post1.md` (not descriptive)
- ❌ `My Post.md` (spaces and capitals)

### Step 2: Add Frontmatter

Every post MUST start with frontmatter. Copy this template:

```yaml
---
title: "Your Post Title"
date: "2025-01-30"
excerpt: "A brief description (1-2 sentences)"
tags: ["tag1", "tag2", "tag3"]
author: "Harrison Weiss"
---
```

**Frontmatter fields explained:**

- **title** (required): The title of your post
- **date** (required): Publication date in YYYY-MM-DD format
- **excerpt** (required): Brief description shown in post listings
- **tags** (required): Array of relevant tags for categorization
- **author** (optional): Defaults to "Harrison Weiss" if omitted

### Step 3: Write Your Content

After the frontmatter, write your post using Markdown:

```markdown
# Main Heading

Your introduction paragraph...

## Section Heading

Your content here...
```

### Step 4: Preview (Development Mode)

If running the dev server:

```bash
npm run dev
```

Navigate to `http://localhost:3000/blog` to see your post appear automatically.

### Step 5: Publish

#### Option A: Automatic (with file watcher running)

The watcher will detect your new post and rebuild automatically within 5 seconds.

#### Option B: Manual

```bash
npm run build
```

Then deploy the updated `dist/` directory to your server.

## Writing Tips

### Use Descriptive Headings

Create a clear hierarchy with your headings:

```markdown
# Post Title (H1 - used in frontmatter)

## Major Section (H2)

### Subsection (H3)

#### Minor Point (H4)
```

### Add Code with Syntax Highlighting

Specify the language for proper highlighting:

````markdown
```python
def calculate_emissions(activity, factor):
    return activity * factor
```

```javascript
const total = items.reduce((sum, item) => sum + item, 0);
```

```bash
npm install
npm run build
```
````

### Include Math Equations

For inline equations: `$E = mc^2$`

For block equations:

```markdown
$$
\text{Emissions} = \text{Activity} \times \text{Factor}
$$
```

### Use Tables for Data

```markdown
| Item | Value | Unit |
|------|-------|------|
| Electricity | 10,000 | kWh |
| Natural Gas | 5,000 | therms |
```

### Add Images

1. Place images in `public/images/`
2. Reference in markdown:

```markdown
![Description of image](/images/filename.jpg)
```

## Content Guidelines

### Target Length

- Short posts: 300-600 words (quick insights, updates)
- Standard posts: 800-1,500 words (most articles)
- Long-form posts: 2,000+ words (deep dives, research)

### Writing Style

- **Clear and direct**: Avoid jargon where possible
- **Evidence-based**: Link to sources and data
- **Professional but accessible**: Academic tone without being stuffy
- **Well-structured**: Use headings, lists, and white space

### Tag Selection

Choose 2-5 relevant tags per post. Common tags:

- `sustainability`
- `GHG accounting`
- `public sector`
- `transportation`
- `policy`
- `climate`
- `urban planning`
- `data analysis`

Create new tags as needed, but be consistent.

## Common Markdown Syntax

### Text Formatting

```markdown
*italic* or _italic_
**bold** or __bold__
***bold italic*** or ___bold italic___
~~strikethrough~~
`inline code`
```

### Lists

```markdown
- Unordered list item
- Another item
  - Nested item
  
1. Ordered list item
2. Another item
   1. Nested item
```

### Links

```markdown
[Link text](https://example.com)
[Link with title](https://example.com "Title on hover")
```

### Blockquotes

```markdown
> This is a blockquote
> It can span multiple lines
```

### Horizontal Rules

```markdown
---
or
***
or
___
```

## Troubleshooting

### Post not appearing

1. Check frontmatter is valid YAML
2. Ensure date format is correct (YYYY-MM-DD)
3. Rebuild: `npm run build`
4. Clear browser cache

### Build fails

1. Check for syntax errors in your markdown
2. Verify all frontmatter fields are present
3. Check for unclosed code blocks
4. Review error message in terminal

### Math not rendering

1. Ensure KaTeX syntax is correct
2. Use `$$` for block equations
3. Use `$` for inline equations
4. Escape special characters if needed

### Code not highlighting

1. Specify language after opening fence: `` ```python ``
2. Ensure language is supported (python, javascript, bash, etc.)
3. Check for unclosed code fences

## Examples

See the example posts in `content/posts/`:
- `welcome-to-public-presence.md`
- `understanding-scope-emissions.md`
- `POST_TEMPLATE.md` (copy this for new posts)

## Resources

- [Markdown Guide](https://www.markdownguide.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [KaTeX Supported Functions](https://katex.org/docs/supported.html)

---

Happy writing! 📝
