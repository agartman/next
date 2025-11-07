#!/bin/bash

# Semantic commit template for opencode
# Usage: ./commit.sh "commit message"

if [ $# -eq 0 ]; then
    echo "Usage: ./commit.sh \"commit message\""
    exit 1
fi

COMMIT_MESSAGE="$1"

# Perform semantic commit
git add .
git commit -m "$COMMIT_MESSAGE"
echo "Committed with message: $COMMIT_MESSAGE"