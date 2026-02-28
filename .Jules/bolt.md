## 2026-03-05 - [Array shift bottleneck in recursive directory scanner p-limit queue]

**Learning:** `Array.shift()` inside a custom `p-limit` queue scales poorly for highly recursive tasks. Recursive scanning adds thousands of IO tasks to the concurrent limit queue, turning the `O(n)` array-shift operation into a noticeable performance bottleneck (`O(n^2)` total shift penalty over large trees).
**Action:** Replace the custom `Array.shift()` based queue with an `O(1)` linked list queue (`{ value: Task, next?: Node }`) structure for `p-limit` when dealing with huge numbers of potential concurrent requests.

## 2026-02-28 - [Eliminate spread syntax when processing file lists]

**Learning:** Spread syntax (`...array`) causes "Maximum call stack size exceeded" errors when used on large arrays (e.g., > 200,000 files). This is because the JS engine attempts to place each element onto the call stack as an argument to `push` or `[]`.
**Action:** When adding elements to an array or initializing an array with a very large number of elements (like files and children nodes), always use an iterative loop (`for (const item of items) { array.push(item); }`) instead of spread operators (`array.push(...items)`).
