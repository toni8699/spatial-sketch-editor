#!/bin/sh
# P24A.1 deterministic normalization job (evidence spike, P24 reconciliation R1).
#
# Wraps the pinned `@gltf-transform/cli` in a hash-in/hash-out pipeline step:
#
#   acquire+hash -> version pin -> validate -> prune/dedup (safe only)
#     -> center --pivot below -> validate -> metrics -> provenance
#     -> atomic install
#
# Policy is explicit in the RECIPE argument; only `furniture-floor` exists until
# R1 selects more placement semantics. Unit conversion to metres is recorded,
# never silently baked: the caller passes the calibrated source scale and it
# lands in provenance as metadata (the current per-asset `defaultScale` fudge).
# Metre-baking joins the recipe only with a per-source calibration record
# (Kenney pack-level rule per the annex).
#
# Failure atomicity: every generated file stages in a temp sibling directory on
# the same filesystem and installs via rename with rollback — a failed run
# (including a failed replacement) never loses a previous good OUTDIR
# (P24A proof acceptance: no half-approved state).
#
# Usage: normalize-asset.sh <input.glb> <recipe> <unit-scale-to-meters> <outdir>
# Outputs: <outdir>/model.glb, <outdir>/metrics.json, <outdir>/provenance.json
set -eu

EXPECTED_TOOL_VERSION="4.4.1"
RECIPE_VERSION=1

if [ "$#" -ne 4 ]; then
  echo "usage: normalize-asset.sh <input.glb> <recipe> <unit-scale-to-meters> <outdir>" >&2
  exit 2
fi

INPUT="$1"
RECIPE="$2"
UNIT_SCALE="$3"
OUTDIR="$4"
CLI="node_modules/.bin/gltf-transform"

if [ "$RECIPE" != "furniture-floor" ]; then
  echo "unknown recipe: $RECIPE (only furniture-floor v$RECIPE_VERSION exists)" >&2
  exit 2
fi
case "$UNIT_SCALE" in
  '' | *[!0-9.]*) echo "unit scale must be numeric: $UNIT_SCALE" >&2; exit 2;;
esac
UNIT_SCALE_JSON="$(
  node -e '
    const n = Number(process.argv[1]);
    if (!Number.isFinite(n) || n <= 0) process.exit(1);
    process.stdout.write(JSON.stringify(n));
  ' "$UNIT_SCALE"
)" || {
  echo "unit scale must be finite and > 0: $UNIT_SCALE" >&2
  exit 2
}
if [ ! -f "$INPUT" ]; then
  echo "missing input: $INPUT" >&2
  exit 2
fi
case "$INPUT" in *.glb) ;; *) echo "input must be .glb" >&2; exit 2;; esac

ACTUAL_VERSION="$("$CLI" --version 2>/dev/null | head -1 | tr -d ' \t\r\n')"
if [ "$ACTUAL_VERSION" != "$EXPECTED_TOOL_VERSION" ]; then
  echo "tool version mismatch: expected $EXPECTED_TOOL_VERSION, ran $ACTUAL_VERSION" >&2
  exit 1
fi
RECIPE_HASH="$(shasum -a 256 "$0" | cut -d' ' -f1)"

file_bytes() { stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null; }

STAGE_PARENT="$(dirname "$OUTDIR")"
if [ ! -d "$STAGE_PARENT" ]; then
  echo "output parent directory does not exist: $STAGE_PARENT" >&2
  exit 2
fi
TXN="$(mktemp -d "$STAGE_PARENT/.p24a-txn.XXXXXX")"
STAGE="$TXN/stage"
BACKUP="$TXN/backup"
mkdir "$STAGE"
# Restore-then-clean: if a signal lands after the good output moved aside but
# before the candidate installs, the previous output comes back first — the
# trap never deletes a good destination.
cleanup() {
  if [ ! -e "$OUTDIR" ] && [ -e "$BACKUP" ]; then
    mv "$BACKUP" "$OUTDIR"
  fi
  rm -rf "$TXN"
}
trap 'cleanup' EXIT INT TERM

SOURCE_SHA="$(shasum -a 256 "$INPUT" | cut -d' ' -f1)"
BYTES_IN="$(file_bytes "$INPUT")"

"$CLI" validate "$INPUT" > "$STAGE/validate-in.txt" 2>&1 || {
  echo "input validation failed:" >&2
  cat "$STAGE/validate-in.txt" >&2
  exit 1
}

"$CLI" prune "$INPUT" "$STAGE/step1.glb" > /dev/null 2>&1
"$CLI" dedup "$STAGE/step1.glb" "$STAGE/step2.glb" > /dev/null 2>&1
"$CLI" center "$STAGE/step2.glb" "$STAGE/model.glb" --pivot below > /dev/null 2>&1

"$CLI" validate "$STAGE/model.glb" > "$STAGE/validate-out.txt" 2>&1 || {
  echo "output validation failed:" >&2
  cat "$STAGE/validate-out.txt" >&2
  exit 1
}

BYTES_OUT="$(file_bytes "$STAGE/model.glb")"
CONTENT_SHA="$(shasum -a 256 "$STAGE/model.glb" | cut -d' ' -f1)"
BBOX="$(node_modules/.bin/gltf-transform inspect "$STAGE/model.glb" 2>/dev/null | grep -o '\-*[0-9][0-9.]*, *\-*[0-9][0-9.]*, *\-*[0-9][0-9.]*' | head -2 | tr '\n' ';')"

cat > "$STAGE/metrics.json" <<EOF
{"bytesIn": $BYTES_IN, "bytesOut": $BYTES_OUT, "bboxMinMax": "$BBOX"}
EOF

cat > "$STAGE/provenance.json" <<EOF
{
  "tool": "@gltf-transform/cli",
  "toolVersionExpected": "$EXPECTED_TOOL_VERSION",
  "toolVersionActual": "$ACTUAL_VERSION",
  "recipe": "$RECIPE",
  "recipeVersion": $RECIPE_VERSION,
  "recipeHash": "$RECIPE_HASH",
  "steps": ["prune", "dedup", "center --pivot below"],
  "sourceUnitPolicy": "recorded-not-baked",
  "unitScaleToMeters": $UNIT_SCALE_JSON,
  "sourceSha256": "$SOURCE_SHA",
  "contentSha256": "$CONTENT_SHA",
  "input": "$INPUT"
}
EOF

if [ -e "$OUTDIR" ]; then
  mv "$OUTDIR" "$BACKUP"
fi
if mv "$STAGE" "$OUTDIR"; then
  rm -rf "$BACKUP"
else
  if [ -e "$BACKUP" ]; then
    mv "$BACKUP" "$OUTDIR"
  fi
  echo "atomic install failed; previous output restored" >&2
  exit 1
fi
rm -rf "$TXN"
trap - EXIT INT TERM

echo "source=$SOURCE_SHA"
echo "content=$CONTENT_SHA"
