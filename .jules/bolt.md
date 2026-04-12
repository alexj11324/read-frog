## 2024-06-25 - ReactMarkdown components performance bottleneck
**Learning:** Defining the `components` prop inline inside a functional component using `ReactMarkdown` forces React to unnecessarily unmount and remount the entire markdown DOM tree on every render, severely impacting performance, especially for larger markdown content.
**Action:** Always extract the `components` prop object outside the component definition or memoize it when using `ReactMarkdown`.
