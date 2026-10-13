# Git Sync for Brain & Skills

## Overview
This rule enforces that all AI-generated project management artifacts (the "brain"), architectural plans, and agent customizations ("skills") are continuously synced to the project repository.

## Rules
1. **Continuous Tracking**: Whenever you generate or update a project artifact (such as `architecture_plan.md`, `implementation_plan.md`, `task.md`, or `walkthrough.md`) in your working context (brain), you MUST immediately copy those files to the `.agents/plans/` directory in the project root.
2. **Git Commit**: After any significant progress, feature completion, or artifact sync (including changes to `.agents/skills` or `.agents/rules`), you MUST execute `git add` and `git commit` to store these changes in the project repository.
3. **Commit Messages**: Use Conventional Commits (e.g., `feat(messaging): add whatsapp billing template dispatch`, `docs(brain): update schema dictionary with billing_messages table`).

By following this, the project's "brain" and "skills" are permanently versioned alongside the source code.
