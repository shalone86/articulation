#!/usr/bin/env bash
# Publish this app to a Hugging Face Space (free hosting for the speech checker,
# and a complete working copy of the app at https://<user>-<space>.hf.space).
#
#   1. Create a token with "write" access: https://huggingface.co/settings/tokens
#   2. HF_TOKEN=hf_xxx ./deploy/huggingface/deploy.sh <your-hf-username> [space-name]
#
# The script creates the Space (Docker SDK) if needed, then pushes server/, public/
# and the Space Dockerfile/README. Re-run it to deploy updates.
set -euo pipefail
user="${1:?usage: HF_TOKEN=... deploy.sh <hf-username> [space-name]}"
space="${2:-articulation}"
: "${HF_TOKEN:?set HF_TOKEN to a Hugging Face token with write access}"
root="$(cd "$(dirname "$0")/../.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# Create the Space (ignore "already exists").
curl -fsS -X POST https://huggingface.co/api/repos/create \
  -H "Authorization: Bearer $HF_TOKEN" -H "Content-Type: application/json" \
  -d "{\"type\":\"space\",\"name\":\"$space\",\"sdk\":\"docker\",\"private\":${HF_PRIVATE:-false}}" >/dev/null \
  || echo "(Space probably exists already — continuing)"

git clone -q "https://user:$HF_TOKEN@huggingface.co/spaces/$user/$space" "$work/space"
cd "$work/space"
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r "$root/server" "$root/public" .
cp "$root/deploy/huggingface/Dockerfile" "$root/deploy/huggingface/README.md" .
rm -rf server/__pycache__
git add -A
git -c user.name="deploy" -c user.email="deploy@localhost" commit -qm "Deploy $(cd "$root" && git rev-parse --short HEAD 2>/dev/null || date +%F)" || { echo "Nothing changed."; exit 0; }
git push -q origin HEAD:main
echo "Pushed. Build log: https://huggingface.co/spaces/$user/$space  ·  App: https://$user-$space.hf.space"
