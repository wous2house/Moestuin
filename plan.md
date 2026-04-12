1. **Explore `src/pages/Home.tsx`**: Add `customEmojiUrl` fallback rendering to `selectedPlant.icon` in the detail modal (`selectedPlant` in `Home.tsx`).
2. **Explore `src/pages/Harvests.tsx`**: Add `customEmojiUrl` fallback rendering to `plant?.icon` where it is missing, specifically around line 269 and 379. Also review any others that show up in `grep -rnw src -e "\.icon"`.
3. **Execute Pre-Commit Checks**: Follow required checks from `pre_commit_instructions` tool.
4. **Submit changes**: Commit all modified files and complete the task.
