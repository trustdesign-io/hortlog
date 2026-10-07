#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Add Claude Code voice shortcut text replacements to macOS
# Run once:  bash scripts/add-text-replacements.sh
# Then log out and back in (or restart) for changes to take effect.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

echo "→ Adding Claude Code text replacements…"

# Read existing replacements
EXISTING=$(defaults read -g NSUserDictionaryReplacementItems 2>/dev/null || echo "()")

# Build new entries
declare -a ENTRIES=(
  '{ on = 1; replace = "take task"; with = "/take-task "; }'
  '{ on = 1; replace = "create ticket"; with = "/create-ticket "; }'
  '{ on = 1; replace = "show board"; with = "/board"; }'
  '{ on = 1; replace = "apply brand"; with = "/apply-brand "; }'
  '{ on = 1; replace = "new feature"; with = "/new-feature "; }'
  '{ on = 1; replace = "new page"; with = "/new-page "; }'
  '{ on = 1; replace = "new component"; with = "/new-component "; }'
  '{ on = 1; replace = "move ticket"; with = "/move-ticket "; }'
  '{ on = 1; replace = "take next"; with = "/take-task next"; }'
  '{ on = 1; replace = "review code"; with = "/review"; }'
  '{ on = 1; replace = "update ticket"; with = "/update-ticket "; }'
  '{ on = 1; replace = "review pr"; with = "/review-pr "; }'
  '{ on = 1; replace = "review pull request"; with = "/review-pr "; }'
)

for ENTRY in "${ENTRIES[@]}"; do
  defaults write -g NSUserDictionaryReplacementItems -array-add "$ENTRY"
  PHRASE=$(echo "$ENTRY" | grep -o 'replace = "[^"]*"' | cut -d'"' -f2)
  EXPANSION=$(echo "$ENTRY" | grep -o 'with = "[^"]*"' | cut -d'"' -f2)
  echo "   ✓  \"${PHRASE}\"  →  \"${EXPANSION}\""
done

echo ""
echo "✅  Done. Log out and back in for changes to take effect."
echo ""
echo "Usage (speak these phrases while dictating into Claude Code):"
echo "   'take task next'          → /take-task next"
echo "   'take task 7'             → /take-task 7"
echo "   'create ticket ...'       → /create-ticket ..."
echo "   'show board'              → /board"
echo "   'move ticket 7 done'      → /move-ticket 7 done"
echo "   'new feature ...'         → /new-feature ..."
echo "   'apply brand ...'         → /apply-brand ..."
echo "   'update ticket 42 ...'   → /update-ticket 42 ..."
