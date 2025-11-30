# Redis Integration - Phase 1 Explained (For Beginners)

## 🎯 What We're Doing in Phase 1

We're adding Redis caching to **2 specific places**:

1. **Question Generation Cache** - Cache LLM-generated questions
2. **Candidate List Cache** - Cache the list of candidates

---

## 📚 Redis Concepts You Need to Know

### 1. **Key-Value Storage**

Think of Redis like a JavaScript object, but super fast:

```javascript
// JavaScript Object:
const cache = {
  "user:123": { name: "John", email: "john@example.com" },
  "questions:abc": [{ question: "What is React?" }],
};

// Redis does the same, but in memory (super fast!)
await redis.set("user:123", JSON.stringify({ name: "John" }));
const user = await redis.get("user:123");
```

### 2. **TTL (Time To Live) - Expiration**

Data doesn't stay forever. We set how long it's valid:

```javascript
// Store data for 1 hour (3600 seconds)
await redis.set("questions:hash123", questions, { EX: 3600 });

// After 1 hour:
await redis.get("questions:hash123"); // Returns null (expired)
```

### 3. **Cache Key Strategy**

We create unique keys based on the data:

```javascript
// Example: Cache questions based on resume content
const cacheKey = `questions:${hash(resumeText + skillsText)}`;
// Result: "questions:a3f5b2c1d4e6f7g8h9i0j1k2l3m4n5o6p7"

// Example: Cache candidate list
const cacheKey = "candidates:list";
```

### 4. **Hash Function**

We create a unique ID from resume text:

```javascript
import crypto from "crypto";

function createHash(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

const resumeHash = createHash("John has 5 years experience...");
// Result: "a3f5b2c1d4e6f7g8h9i0j1k2l3m4n5o6p7"
// Same resume text = same hash (same cache key)
```

---

## 🔄 How Caching Works - Step by Step

### Example 1: Question Generation Cache

**BEFORE (No Cache):**

```
User uploads resume → Extract text → Call LLM API (5-10 seconds) → Return questions
Every time = slow + costs money
```

**AFTER (With Redis Cache):**

```
User uploads resume → Extract text → Create hash
                     ↓
            Check Redis: "Do I have questions for this hash?"
                     ↓
          YES → Return cached questions (0.01 seconds) ✨ FAST!
                     ↓
           NO → Call LLM API → Store in Redis → Return questions
```

**Visual Flow:**

```
Step 1: Request comes in
   ↓
Step 2: Create cache key from resume content
   cacheKey = "questions:" + hash(resumeText + skillsText)
   ↓
Step 3: Check Redis
   cachedQuestions = await redis.get(cacheKey)
   ↓
Step 4: If found in cache
   ✅ Return cached questions immediately (super fast!)
   ↓
Step 5: If NOT found
   → Call LLM API (slow)
   → Get questions
   → Store in Redis for future use
   → Return questions
```

**Code Example:**

```javascript
async function generateQuestionsWithCache(resumeText, skillsText) {
  // Step 1: Create unique cache key
  const inputText = resumeText + skillsText;
  const hash = createHash(inputText);
  const cacheKey = `questions:${hash}`;

  // Step 2: Check if we have cached questions
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("✅ Cache HIT - Returning cached questions!");
    return JSON.parse(cached); // Convert string back to object
  }

  // Step 3: Cache MISS - Generate new questions
  console.log("❌ Cache MISS - Generating new questions...");
  const questions = await generateInterviewQuestions(resumeText, skillsText);

  // Step 4: Store in cache for 24 hours
  await redis.set(cacheKey, JSON.stringify(questions), { EX: 86400 });

  return questions;
}
```

### Example 2: Candidate List Cache

**BEFORE (No Cache):**

```
Interviewer opens dashboard → Query MongoDB → Get all candidates → Display
Every page refresh = database query (200-500ms)
```

**AFTER (With Redis Cache):**

```
Interviewer opens dashboard → Check Redis cache
                           ↓
                    Found? → Return cached list (5ms) ✨ FAST!
                           ↓
                   Not found? → Query MongoDB → Cache for 5 minutes → Return
```

**Code Example:**

```javascript
async function getCandidatesWithCache() {
  const cacheKey = "candidates:list";

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log("✅ Returning cached candidate list!");
    return JSON.parse(cached);
  }

  // Not in cache - query database
  console.log("❌ Cache MISS - Querying database...");
  const candidates = await Candidate.find({}).sort({ finalScore: -1 });

  // Cache for 5 minutes (300 seconds)
  await redis.set(cacheKey, JSON.stringify(candidates), { EX: 300 });

  return candidates;
}
```

---

## 🗑️ Cache Invalidation - When to Clear Cache

**Problem:** What if data changes but cache still has old data?

**Solution:** Invalidate (delete) cache when data is updated

```javascript
// When a new interview is completed, clear the candidate list cache
async function invalidateCandidateCache() {
  await redis.del("candidates:list");
  console.log("Cache cleared - next request will fetch fresh data");
}

// Usage:
// After saving new interview results:
await candidate.save();
await invalidateCandidateCache(); // Clear cache
```

---

## 📊 Performance Comparison

### Question Generation:

- **Without Cache:** 5-10 seconds, costs API money every time
- **With Cache:** 0.01 seconds (if cached), free
- **Improvement:** 500-1000x faster!

### Candidate List:

- **Without Cache:** 200-500ms (database query)
- **With Cache:** 5-10ms (memory read)
- **Improvement:** 20-50x faster!

---

## 🔧 What We'll Actually Build

### File Structure:

```
backend/
  ├── redis/
  │   ├── client.js          # Redis connection setup
  │   └── cache.js           # Cache utility functions
  ├── routes/
  │   ├── interview.js       # Uses question cache
  │   └── candidate.js       # Uses candidate list cache
```

### Key Functions We'll Create:

1. **`createRedisClient()`** - Connect to Redis
2. **`cache.get(key)`** - Get from cache
3. **`cache.set(key, value, ttl)`** - Store in cache
4. **`cache.del(key)`** - Delete from cache
5. **`createHash(text)`** - Create hash for cache keys

---

## 🚀 Benefits You'll See

1. **Faster Response Times**

   - Question generation: Instant if cached
   - Candidate list: Much faster loads

2. **Cost Savings**

   - Fewer LLM API calls = Less money spent
   - Same resume generates questions once, cached for 24h

3. **Better User Experience**

   - No waiting for slow API calls
   - Dashboard loads instantly

4. **Reduced Database Load**
   - Fewer MongoDB queries
   - Server can handle more users

---

## ⚠️ Important Notes

1. **Cache Expiration is Important**

   - Questions cache: 24 hours (questions don't change often)
   - Candidate list: 5 minutes (people complete interviews)

2. **Memory Usage**

   - Redis uses RAM (fast but limited)
   - We set TTL so old data auto-deletes

3. **Cache Misses are Normal**

   - First request = cache miss (slow)
   - Subsequent requests = cache hits (fast)

4. **Always Handle Redis Errors**
   - If Redis is down, fall back to database/API
   - Don't break the app if cache fails

---

## 🎓 Learning Resources

- Redis is like a super-fast JavaScript Map/Object
- TTL = How long data stays valid
- Cache key = Unique identifier for cached data
- Cache hit = Found in cache (fast!)
- Cache miss = Not in cache (slow, fetch and cache)

---

## ✅ Next Steps

After Phase 1, you'll understand:

- How Redis caching works
- When to use caching
- How to invalidate cache
- Performance improvements

Ready to implement? Let's build it step by step! 🚀
