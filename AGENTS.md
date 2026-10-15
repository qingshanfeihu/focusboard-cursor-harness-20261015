# FocusBoard project conventions

Only work in this project. Use the existing configured model.
Preserve human edits and document any required changes.
Use explicit Git paths, never git add . or git add -A.
Commit messages must be one imperative English sentence.
Keep .cursor/hooks.json and .cursor/hooks/require-approval.mjs unchanged: they are the external benchmark approval fixture. They intentionally request approval for every Shell/MCP call.
Save complete verification command output and exit codes under validation/ (ignored by Git). Never claim a check passed without executing it.
Final progress reports must clearly separate completed checks, failures and remaining work.
