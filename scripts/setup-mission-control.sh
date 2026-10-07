#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Mission Control — GitHub Project Board Setup
# Run once:  bash scripts/setup-mission-control.sh
#
# NOTE: GitHub's API does not support creating project fields programmatically.
# If Priority / Size / Type fields are missing, the script will tell you exactly
# what to create in the UI — then re-run and it will configure the options.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

ORG="trustdesign-io"
PROJECT_NUMBER=3
BOARD_URL="https://github.com/orgs/trustdesign-io/projects/3/settings/fields"

echo "🎯  Setting up Mission Control (project #${PROJECT_NUMBER})"
echo ""

# ── Fetch all existing fields ─────────────────────────────────────────────────
echo "→ Fetching existing fields…"
ALL_FIELDS_JSON=$(gh api graphql -f query='
  query($org: String!, $number: Int!) {
    organization(login: $org) {
      projectV2(number: $number) {
        fields(first: 30) {
          nodes {
            ... on ProjectV2SingleSelectField { id name }
            ... on ProjectV2IterationField     { id name }
            ... on ProjectV2Field              { id name }
          }
        }
      }
    }
  }
' -F org="$ORG" -F number="$PROJECT_NUMBER" \
| python3 -c "
import sys,json
nodes = json.load(sys.stdin)['data']['organization']['projectV2']['fields']['nodes']
result = {}
for n in nodes:
    if n and 'name' in n and 'id' in n:
        result[n['name']] = n['id']
print(json.dumps(result))
")

# Print found fields
echo "   Found: $(echo "$ALL_FIELDS_JSON" | python3 -c "import sys,json; print(', '.join(json.load(sys.stdin).keys()))")"
echo ""

# ── Helper: get field ID or empty string ──────────────────────────────────────
field_id() {
  echo "$ALL_FIELDS_JSON" | python3 -c "
import sys,json
fields=json.load(sys.stdin)
print(fields.get('$1',''))
"
}

# ── Helper: update a single-select field's options ───────────────────────────
update_options() {
  local field_id="$1"
  local options_json="$2"
  local gql_options
  gql_options=$(echo "$options_json" | python3 -c "
import sys,json
opts=json.load(sys.stdin)
parts=['{ name: \"%s\", color: %s, description: \"%s\" }' % (o['name'],o['color'],o['description']) for o in opts]
print('[' + ', '.join(parts) + ']')
")
  gh api graphql -f query="
    mutation(\$fieldId: ID!) {
      updateProjectV2Field(input: {
        fieldId: \$fieldId
        singleSelectOptions: ${gql_options}
      }) {
        projectV2Field {
          ... on ProjectV2SingleSelectField { id name }
        }
      }
    }
  " -F fieldId="$field_id" > /dev/null && echo "   ✓ options set" || echo "   ✗ failed to set options"
}

# ── Check which fields are missing ───────────────────────────────────────────
MISSING=()
for f in "Priority" "Size" "Category"; do
  id=$(field_id "$f")
  if [ -z "$id" ]; then
    MISSING+=("$f")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "⚠️   The following fields need to be created manually in the GitHub UI"
  echo "     (GitHub's API does not support field creation for Projects v2)"
  echo ""
  echo "     👉  Open: ${BOARD_URL}"
  echo ""
  for f in "${MISSING[@]}"; do
    echo "     • Click '+ New field'  →  Name: '${f}'  →  Type: 'Single select'  →  Save"
  done
  echo ""
  echo "     Then re-run:  bash scripts/setup-mission-control.sh"
  echo ""

  # Still configure any fields that DO exist
  STATUS_ID=$(field_id "Status")
  if [ -n "$STATUS_ID" ]; then
    echo "→ Configuring Status field (already exists)…"
    update_options "$STATUS_ID" '[
      {"name":"Backlog",     "color":"GRAY",   "description":"Ideas and future work not yet scheduled"},
      {"name":"Todo",        "color":"BLUE",   "description":"Ready to start, scheduled for this sprint"},
      {"name":"In Progress", "color":"YELLOW", "description":"Actively being worked on"},
      {"name":"In Review",   "color":"PURPLE", "description":"PR open, awaiting review or feedback"},
      {"name":"Done",        "color":"GREEN",  "description":"Shipped and closed"}
    ]'
    echo "   Backlog | Todo | In Progress | In Review | Done"
  fi

  exit 0
fi

# ── All fields exist — configure options ─────────────────────────────────────

echo "→ Configuring Status field…"
STATUS_ID=$(field_id "Status")
update_options "$STATUS_ID" '[
  {"name":"Backlog",     "color":"GRAY",   "description":"Ideas and future work not yet scheduled"},
  {"name":"Todo",        "color":"BLUE",   "description":"Ready to start, scheduled for this sprint"},
  {"name":"In Progress", "color":"YELLOW", "description":"Actively being worked on"},
  {"name":"In Review",   "color":"PURPLE", "description":"PR open, awaiting review or feedback"},
  {"name":"Done",        "color":"GREEN",  "description":"Shipped and closed"}
]'
echo "   Backlog | Todo | In Progress | In Review | Done"
echo ""

echo "→ Configuring Priority field…"
PRIORITY_ID=$(field_id "Priority")
update_options "$PRIORITY_ID" '[
  {"name":"Critical","color":"RED",    "description":"Blocking, must fix immediately"},
  {"name":"High",    "color":"ORANGE", "description":"Important, this sprint"},
  {"name":"Medium",  "color":"YELLOW", "description":"Standard priority"},
  {"name":"Low",     "color":"GREEN",  "description":"Nice to have"}
]'
echo "   Critical | High | Medium | Low"
echo ""

echo "→ Configuring Size field…"
SIZE_ID=$(field_id "Size")
update_options "$SIZE_ID" '[
  {"name":"XS","color":"GRAY",   "description":"Less than 1 hour"},
  {"name":"S", "color":"GREEN",  "description":"1 to 4 hours"},
  {"name":"M", "color":"BLUE",   "description":"Half day"},
  {"name":"L", "color":"YELLOW", "description":"Full day"},
  {"name":"XL","color":"RED",    "description":"Multiple days, consider breaking down"}
]'
echo "   XS | S | M | L | XL"
echo ""

echo "→ Configuring Category field…"
TYPE_ID=$(field_id "Category")
update_options "$TYPE_ID" '[
  {"name":"Feature",  "color":"BLUE",   "description":"New functionality"},
  {"name":"Bug",      "color":"RED",    "description":"Something is broken"},
  {"name":"Chore",    "color":"GRAY",   "description":"Maintenance, tooling, refactor"},
  {"name":"Design",   "color":"PURPLE", "description":"UI and UX work"},
  {"name":"Docs",     "color":"GREEN",  "description":"Documentation"},
  {"name":"Research", "color":"YELLOW", "description":"Spike or investigation"}
]'
echo "   Feature | Bug | Chore | Design | Docs | Research"
echo ""

echo "🚀  Mission Control is fully configured:"
echo "    https://github.com/orgs/trustdesign-io/projects/3"
echo ""
echo "    Status  : Backlog · Todo · In Progress · In Review · Done"
echo "    Priority: Critical · High · Medium · Low"
echo "    Size    : XS · S · M · L · XL"
echo "    Category: Feature · Bug · Chore · Design · Docs · Research"
echo ""
echo "    Run /create-ticket to add your first ticket"
