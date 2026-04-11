## 2025-05-18 - ReactMarkdown Components Inline Definition Anti-pattern

**Learning:** Defining the `components` prop inline as an object literal inside a functional component using `<ReactMarkdown>` forces React to unnecessarily unmount and remount the entire markdown DOM tree on every render, severely impacting performance.
**Action:** Always extract the `components` prop object outside the component definition or memoize it using `useMemo` when using `ReactMarkdown` to prevent unnecessary re-renders.
