#!/usr/bin/env bash
set -euo pipefail

# Rewrite authors on branch main:
# - raajeswariUSA -> rajeswari
# - Claude Sonnet -> biopathogenix <noreply@biopathogenix.com>

git checkout main

git filter-branch --env-filter '
if [ "$GIT_COMMITTER_NAME" = "rajeswariUSA" ]; then
  export GIT_COMMITTER_NAME="rajeswari"
fi
if [ "$GIT_AUTHOR_NAME" = "rajeswariUSA" ]; then
  export GIT_AUTHOR_NAME="rajeswari"
fi
if [ "$GIT_COMMITTER_NAME" = "Claude Sonnet" ]; then
  export GIT_COMMITTER_NAME="biopathogenix"
  export GIT_COMMITTER_EMAIL="noreply@biopathogenix.com"
fi
if [ "$GIT_AUTHOR_NAME" = "Claude Sonnet" ]; then
  export GIT_AUTHOR_NAME="biopathogenix"
  export GIT_AUTHOR_EMAIL="noreply@biopathogenix.com"
fi
' -- --branches main

# cleanup
for ref in $(git for-each-ref --format='%(refname)' refs/original/); do
  git update-ref -d "$ref" || true
done

git reflog expire --expire=now --all || true

git gc --prune=now --aggressive || true

# show resulting authors
git log --pretty=format:'%h %an <%ae>' | sort | uniq -c | sort -nr | head -n 50
