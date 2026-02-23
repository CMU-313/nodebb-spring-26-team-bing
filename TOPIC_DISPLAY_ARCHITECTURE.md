# Topic Display Architecture - Complete Tracing Guide

## Overview
When a user views a topic/post in NodeBB, multiple files work together to fetch, process, and display all the topic information (title, content, tags, posting user, etc.).

---

## Primary Files in the Display Flow

### 1. **Main Controller: `/src/controllers/topics.js`** ⭐ **PRIMARY FILE**

**This is the MAIN file responsible for displaying a topic with all information.**

**Key Function:** `topicsController.get()` (lines 25-157)

**What it does:**
- Receives HTTP GET request for a topic (line 25)
- Fetches basic topic data using `topics.getTopicData(tid)` (line 33)
- Gets user privileges and permissions (lines 37-43)
- Fetches all posts in the topic using `topics.getTopicWithPosts()` (line 85)
- Modifies posts based on user privileges (line 87)
- Builds breadcrumbs navigation (lines 176-184)
- Adds tags to the topic data (lines 199-274)
- Fetches topic author information (line 129)
- Gets crossposts (line 131)
- Creates pagination data (line 133-138)
- Prepares metadata tags (SEO, OpenGraph) (lines 193-272)
- **Finally renders the template with all data** (line 157):
  ```javascript
  res.render('topic', topicData);
  ```

**All Available Variables in `topicData`:**
- `tid` - Topic ID
- `cid` - Category ID
- `title` - Topic title (escaped)
- `titleRaw` - Topic title (raw)
- `content` - Main post content
- `posts` - Array of all posts in the topic
  - Each post contains:
    - `pid` - Post ID
    - `uid` - User ID
    - `content` - Post content
    - `timestamp` - Post creation time
    - `edited` - Last edit time
    - `user` - User object with username, userslug, picture, reputation, etc.
    - `index` - Post index/position
    - `votes` - Vote count
    - `replies` - Nested replies data
- `uid` - Topic creator ID
- `author` - Topic creator object (username, userslug)
- `category` - Category object (name, icon, slug, cid)
- `tags` - Array of tags
- `thumbs` - Array of thumbnail images
- `postcount` - Total number of posts
- `lastposttime` - Timestamp of last post
- `lastposter` - Last poster information
- `upvotes` - Total upvotes on topic
- `downvotes` - Total downvotes
- `views` - View count
- `privileges` - User privileges object
- `pagination` - Pagination data
- `breadcrumbs` - Navigation breadcrumbs
- And many more metadata fields...

---

### 2. **Topic Data Module: `/src/topics/index.js`**

**Provides data fetching functions used by the controller.**

**Key Functions:**
- `Topics.getTopicData(tid)` - Fetches single topic metadata
  - Returns: topic ID, title, category, creator info, timestamps, etc.
  
- `Topics.getTopicWithPosts(topicData, set, uid, start, stop, reverse)` (line 158)
  - **Fetches all posts for a topic with complete data**
  - Calls `Topics.getTopicPosts()` to get posts array
  - Each post includes: content, user data, timestamp, votes, etc.
  - Returns enriched topicData with `posts` array attached

- `Topics.getTopicsData(tids)` - Gets metadata for multiple topics
  
- `Topics.addPostData(postData, uid)` - Enriches post data with user info

---

### 3. **Topic Posts Module: `/src/topics/posts.js`**

**Handles fetching and processing posts within a topic.**

**Key Functions:**
- `Topics.getTopicPosts(topicData, set, start, stop, uid, reverse)` (line 22)
  - Gets posts from a specific range/index
  - Includes main post and nested replies
  - Filters based on user privileges
  - Enriches with user data, timestamps, content
  
- `Topics.getTopicWithPosts()` - Main function that orchestrates the post fetching
  - Uses `posts.getPostsByPids()` to fetch post content
  - Enumerates events (edits, moves, etc.)

---

### 4. **Posts Module: `/src/posts/index.js`**

**Low-level post data retrieval.**

**Key Functions:**
- `Posts.getPostsByPids(pids, uid)` - Gets post content by post IDs
  - Returns: pid, uid, content, timestamp, edited, votes, etc.
  
- `Posts.getPostsFields(pids, fields)` - Gets specific fields from posts

---

### 5. **Main Template: `/vendor/nodebb-theme-harmony-main/templates/topic.tpl`** ⭐ **PRIMARY TEMPLATE**

**This is the main HTML template that renders all topic information.**

**What it displays:**
```html
<!-- Breadcrumbs navigation -->
<!-- IMPORT partials/breadcrumbs-json-ld.tpl -->

<!-- Topic title and metadata -->
<h1 component="post/header">{title}</h1>

<!-- Topic labels (scheduled, pinned, locked) -->
<!-- Topic category and tags -->
<span component="topic/tags">
  <!-- IMPORT partials/topic/tags.tpl -->
</span>

<!-- Topic statistics (replies, views, votes) -->
<div component="topic/stats">
  <!-- IMPORT partials/topic/stats.tpl -->
</div>

<!-- Topic thumbnails -->
<div component="topic/thumb/list">
  <!-- IMPORT partials/topic/thumbs.tpl -->
</div>

<!-- Posts list -->
<ul component="topic" class="posts timeline">
  {{{ each posts }}}
    <li component="post">
      <!-- IMPORT partials/topic/post.tpl -->
      <!-- Each post displays:
        - Post content
        - User info (avatar, username, reputation)
        - Timestamp
        - Edit history
        - Votes
        - Reply buttons
      -->
    </li>
  {{{ end }}}
</ul>

<!-- Pagination -->
<!-- IMPORT partials/paginator.tpl -->

<!-- Sidebar widgets -->
```

---

### 6. **Supporting Partial Templates:**

- `/src/views/partials/topic/post.tpl` - Renders individual post with user info
- `/src/views/partials/topic/tags.tpl` - Renders topic tags
- `/src/views/partials/topic/stats.tpl` - Renders topic statistics (replies, views)
- `/src/views/partials/topic/thumbs.tpl` - Renders thumbnail images
- `/src/views/partials/data/topic.tpl` - Post data attributes (line 1 shows data structure)

---

## Data Flow Diagram

```
HTTP GET /topic/123/slug
    ↓
/src/controllers/topics.js::getTopic()
    ↓
topics.getTopicData(tid) → Fetch topic metadata
    ↓
topics.getTopicWithPosts() → Fetch posts array
    ↓
/src/topics/index.js::getTopicWithPosts()
    ↓
Topics.getTopicPosts() → Get posts from set
    ↓
/src/topics/posts.js::getTopicPosts()
    ↓
posts.getPostsByPids(pids, uid) → Get post content
    ↓
user.getUsersFields() → Get user info for each post
    ↓
Enrich with: votes, edits, timestamps, privileges, etc.
    ↓
Build topicData object with all fields (title, posts, author, category, tags, etc.)
    ↓
res.render('topic', topicData)
    ↓
/vendor/nodebb-theme-harmony-main/templates/topic.tpl
    ↓
HTML rendered with all topic information displayed
```

---

## Variable Mapping: From Controller to Template

### Controller Variables → Template Usage

| Controller Variable | Template Variable | Template File |
|---|---|---|
| `tid` | `{tid}` | topic.tpl |
| `title` | `{title}` | topic.tpl |
| `titleRaw` | `{titleRaw}` | For SEO |
| `posts[]` | `{posts}` | topic.tpl (each loop) |
| `posts[].content` | `{posts.content}` | partials/topic/post.tpl |
| `posts[].user` | `{posts.user}` | Shows username, avatar, reputation |
| `posts[].timestamp` | `{posts.timestamp}` | Shows post time |
| `posts[].index` | `{posts.index}` | Post position tracking |
| `category` | `{category}` | Topic header - shows category badge |
| `tags` | `{tags}` | partials/topic/tags.tpl |
| `author` | `{author}` | Topic creator info |
| `upvotes` | `{upvotes}` | Statistics display |
| `postcount` | `{postcount}` | Statistics - total replies |
| `thumbs` | `{thumbs}` | partials/topic/thumbs.tpl |
| `privileges` | `{privileges}` | Controls edit/delete buttons visibility |

---

## Summary

**To trace any topic display variable:**

1. **START**: `/src/controllers/topics.js` - Line 25 `getTopic()` function
2. **DATA FETCH**: Uses functions from `/src/topics/index.js` and `/src/topics/posts.js`
3. **BUILD DATA**: Assembles `topicData` object with all fields
4. **RENDER**: Passes `topicData` to template engine
5. **DISPLAY**: Template `/vendor/nodebb-theme-harmony-main/templates/topic.tpl` renders HTML

All variable names are consistent between controller and template, making it easy to trace any field back to its source.

