#!/bin/sh
# Replace author/committer names as requested
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
