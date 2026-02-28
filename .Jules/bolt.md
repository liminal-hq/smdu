
## 2026-03-05 - [Array shift bottleneck in recursive directory scanner p-limit queue]
**Learning:** `Array.shift()` inside a custom `p-limit` queue scales poorly for highly recursive tasks. Recursive scanning adds thousands of IO tasks to the concurrent limit queue, turning the `O(n)` array-shift operation into a noticeable performance bottleneck (`O(n^2)` total shift penalty over large trees).
**Action:** Replace the custom `Array.shift()` based queue with an `O(1)` linked list queue (`{ value: Task, next?: Node }`) structure for `p-limit` when dealing with huge numbers of potential concurrent requests.
