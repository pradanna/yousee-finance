#!/usr/bin/env bash
#
# Sync .claude/ with the team-shared .agents/ source of truth.
#
# The team authors rules, skills and workflows in .agents/ (Gemini layout).
# Claude Code expects a flatter layout, so this script regenerates the
# symlinks that bridge the two:
#
#   CLAUDE.md                 -> .agents/AGENTS.md
#   .claude/rules             -> .agents/rules
#   .claude/skills/<name>     -> .agents/skills/<category>/<name>
#   .claude/commands/<n>.md   -> .agents/workflows/<n>.md
#
# Idempotent. Runs automatically on SessionStart (see .claude/settings.json),
# or manually: ./.claude/sync-agents.sh
#
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
agents="$root/.agents"
claude="$root/.claude"
backup="$claude/.sync-backup"

if [ ! -d "$agents" ]; then
    echo "sync-agents: .agents/ not found, nothing to sync" >&2
    exit 0
fi

created=0

# Create a relative symlink, replacing whatever sits at the destination.
# A real (non-symlink) file is moved into .sync-backup/ instead of deleted.
mklink() {
    local rel="$1" dest="$2"

    if [ -L "$dest" ]; then
        [ "$(readlink "$dest")" = "$rel" ] && return 0
        rm -f "$dest"
    elif [ -e "$dest" ]; then
        mkdir -p "$backup"
        mv "$dest" "$backup/$(basename "$dest").$(date +%s)"
        echo "sync-agents: backed up real file $(basename "$dest") before linking" >&2
    fi

    mkdir -p "$(dirname "$dest")"
    ln -s "$rel" "$dest"
    created=$((created + 1))
}

# Guarantee a real directory at the path. A leftover symlink here would make
# every link we create below land inside .agents/ instead — never write into
# the team's source of truth.
ensure_dir() {
    local dir="$1"
    [ -L "$dir" ] && rm -f "$dir"
    mkdir -p "$dir"
}

# Remove symlinks in a directory whose target no longer exists.
prune() {
    local dir="$1"
    [ -d "$dir" ] || return 0
    local entry
    for entry in "$dir"/* "$dir"/.[!.]*; do
        [ -L "$entry" ] || continue
        [ -e "$entry" ] && continue
        rm -f "$entry"
        echo "sync-agents: pruned stale link $(basename "$entry")" >&2
    done
}

# --- Root instruction file -------------------------------------------------
[ -f "$agents/AGENTS.md" ] && mklink ".agents/AGENTS.md" "$root/CLAUDE.md"

# --- Rules (whole directory, no per-file maintenance) ----------------------
[ -d "$agents/rules" ] && mklink "../.agents/rules" "$claude/rules"

# --- Skills (flatten .agents/skills/<category>/<name> to <name>) -----------
ensure_dir "$claude/skills"
prune "$claude/skills"

shopt -s nullglob
for skill in "$agents"/skills/*/*/SKILL.md "$agents"/skills/*/SKILL.md; do
    dir="$(dirname "$skill")"
    name="$(basename "$dir")"
    rel="${dir#"$root"/}"
    depth_rel="../../$rel"
    mklink "$depth_rel" "$claude/skills/$name"
done

# --- Workflows become slash commands --------------------------------------
ensure_dir "$claude/commands"
prune "$claude/commands"

for workflow in "$agents"/workflows/*.md; do
    name="$(basename "$workflow")"
    mklink "../../.agents/workflows/$name" "$claude/commands/$name"
done
shopt -u nullglob

[ "$created" -gt 0 ] && echo "sync-agents: linked $created item(s) from .agents/" >&2

exit 0
