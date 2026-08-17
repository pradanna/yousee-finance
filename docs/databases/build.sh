#!/usr/bin/env bash
#
# Concatenate the per-table DBML files into one pasteable schema.
#
#   ./build.sh   ->  schema.dbml
#
# DBML allows forward references, so alphabetical concatenation is safe:
# a Ref may point at a table defined later in the file.
#
set -euo pipefail

cd "$(dirname "$0")"

OUT=schema.dbml

{
    echo "// ============================================================================="
    echo "// YouSee Finance — Database Schema"
    echo "// GENERATED FILE — do not edit."
    echo "// Edit tables/<table>.dbml, then run ./build.sh"
    echo "// ============================================================================="
    echo

    for f in tables/*.dbml; do
        echo "// ---- ${f} ----"
        cat "$f"
        echo
    done
} > "$OUT"

# A duplicate table name is a hard error in dbdiagram.io — catch it here.
dupes=$(grep -oE '^Table [A-Za-z_]+' "$OUT" | sort | uniq -d || true)
if [[ -n "$dupes" ]]; then
    echo "ERROR: duplicate table definitions:" >&2
    echo "$dupes" >&2
    exit 1
fi

# Every Ref endpoint must resolve to a table defined in the schema.
tables=$(grep -oE '^Table [A-Za-z_]+' "$OUT" | awk '{print $2}' | sort -u)
missing=0
while read -r t; do
    [[ -z "$t" ]] && continue
    grep -qx "$t" <<< "$tables" || { echo "ERROR: unresolved Ref target: $t" >&2; missing=1; }
done < <(grep -oE '^Ref: [A-Za-z_]+\.[A-Za-z_]+ [<>-] [A-Za-z_]+\.[A-Za-z_]+' "$OUT" \
         | sed -E 's/^Ref: ([A-Za-z_]+)\..* ([A-Za-z_]+)\..*/\1\n\2/' | sort -u)
[[ "$missing" -eq 1 ]] && exit 1

echo "built ${OUT}"
echo "  $(grep -c '^Table ' "$OUT") tables"
echo "  $(grep -c '^Ref: '   "$OUT") refs"
echo "  $(grep -c '^Enum '   "$OUT") enums"
