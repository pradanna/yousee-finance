---
description: Automated Domain-Driven Commit. Analyzes uncommitted changes, groups them by Lite DDD domains, and executes atomic git commits.
---

# Workflow: `/commit`

**Trigger:** When the user types `/commit` in the chat.

**Execution Steps:**
1. **Activate Skill:** Immediately activate the `domain-driven-commit` skill.
2. **Analyze Changes:** Run `git status` and `git diff` to analyze the uncommitted changes in the repository.
3. **Categorize by Domain:** Group the modified files according to the Lite DDD Domains (`Identity`, `Master`, `Procurement`, `Billing`, `Accounting`, `Shared`, `Core`, or `Frontend`).
4. **Draft Commits & Request Approval (CRITICAL):**
   - Present the proposed commit titles, changelogs, and the files assigned to each commit to the user.
   - **STOP** and wait for the user's explicit approval before running any `git add` or `git commit` commands.
5. **Execute Commits:**
   - Once approved, add files domain by domain using `git add <files>`.
   - Run `git commit` ensuring you include both the title and a detailed changelog description body as defined in the skill.
6. **Report:** Provide the user with a final summary of the commits that were successfully created.
