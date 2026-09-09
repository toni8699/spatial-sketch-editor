#!/bin/sh
# P24A.1 deterministic normalization job (evidence spike, P24 reconciliation R1).
#
# Wraps the pinned `@gltf-transform/cli` (4.4.1, devDependency) in a
# hash-in/hash-out pipeline step:
#
#   acquire+hash -> validate -> prune/dedup (safe only) -> center --pivot below
#     -> validate -> metrics -> provenance.json
#
# Policy is explicit in the RECIPE argument; only `furniture-floor` exists until
# R1 selects more placement semantics. Unit conversion to metres is NOT baked
# here yet — source units are recorded in provenance and applied as an explicit
# scale factor (the current per-asset `defaultScale` fudge), because silently
# rescaling breaks the "rerun cannot change semantic output" acceptance.
# Metre-baking joins the recipe only with a per-source calibration record
# (Kenney pack-level rule per the annex).
#
# Usage: normalize-asset.sh <input.glb> <furniture-floor> <outdir>
# Outputs: <outdir>/model.glb, <outdir>/metrics.json, <outdir>/provenance.json
set -eu

if [ "$#" -ne 3 ]; then
  echo "usage: normalize-asset.sh <input.glb> <recipe> <outdir>" >&2
  exit 2
fi

INPUT="$1"
RECIPE="$2"
OUTDIR="$3"
CLI="node_modules/.bin/gltf-transform"

if [ "$RECIPE" != "furniture-floor" ]; then
  echo "unknown recipe: $RECIPE (only furniture-floor exists)" >&2
  exit 2
fi
if [ ! -f "$INPUT" ]; then
  echo "missing input: $INPUT" >&2
  exit 2
fi
case "$INPUT" in *.glb) ;; *) echo "input must be .glb" >&2; exit 2;; esac

mkdir -p "$OUTDIR"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/p24a-normalize.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT INT TERM

SOURCE_SHA="$(shasum -a 256 "$INPUT" | cut -d' ' -f1)"
file_bytes() { stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null; }
BYTES_IN="$(file_bytes "$INPUT")"

"$CLI" validate "$INPUT" > "$WORK/validate-in.txt" 2>&1 || {
  echo "input validation failed:" >&2
  cat "$WORK/validate-in.txt" >&2
  exit 1
}

"$CLI" prune "$INPUT" "$WORK/step1.glb" > /dev/null 2>&1
"$CLI" dedup "$WORK/step1.glb" "$WORK/step2.glb" > /dev/null 2>&1
"$CLI" center "$WORK/step2.glb" "$OUTDIR/model.glb" --pivot below > /dev/null 2>&1

"$CLI" validate "$OUTDIR/model.glb" > "$WORK/validate-out.txt" 2>&1 || {
  echo "output validation failed:" >&2
  cat "$WORK/validate-out.txt" >&2
  exit 1
}

BYTES_OUT="$(file_bytes "$OUTDIR/model.glb")"
CONTENT_SHA="$(shasum -a 256 "$OUTDIR/model.glb" | cut -d' ' -f1)"
BBOX="$(node_modules/.bin/gltf-transform inspect "$OUTDIR/model.glb" 2>/dev/null | grep -o '\-*[0-9][0-9.]*, *\-*[0-9][0-9.]*, *\-*[0-9][0-9.]*' | head -2 | tr '\n' ';')"

cat > "$OUTDIR/metrics.json" <<EOF
{"bytesIn": $BYTES_IN, "bytesOut": $BYTES_OUT, "bboxMinMax": "$BBOX"}
EOF

cat > "$OUTDIR/provenance.json" <<EOF
{
  "tool": "@gltf-transform/cli",
  "toolVersion": "4.4.1",
  "recipe": "$RECIPE",
  "steps": ["prune", "dedup", "center --pivot below"],
  "sourceSha256": "$SOURCE_SHA",
  "contentSha256": "$CONTENT_SHA",
  "input": "$INPUT"
}
EOF

echo "source=$SOURCE_SHA"
echo "content=$CONTENT_SHA"
