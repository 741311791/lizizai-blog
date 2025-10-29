#!/bin/bash

# GitHub Push Script for Letters Clone
# This script helps push the code to GitHub repository

REPO_URL="https://github.com/741311791/lizizai-blog.git"

echo "================================================"
echo "  Letters Clone - GitHub Push Script"
echo "================================================"
echo ""
echo "Repository: $REPO_URL"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

# Check if remote exists
if git remote | grep -q "origin"; then
    echo "✓ Remote 'origin' already exists"
else
    echo "Adding remote 'origin'..."
    git remote add origin "$REPO_URL"
fi

echo ""
echo "Current branch: $(git branch --show-current)"
echo "Latest commit: $(git log -1 --oneline)"
echo ""

# Ask for confirmation
read -p "Do you want to push to GitHub? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Pushing to GitHub..."
    echo ""
    
    # Try to push
    if git push -u origin main; then
        echo ""
        echo "✅ Successfully pushed to GitHub!"
        echo ""
        echo "Next steps:"
        echo "1. Visit https://vercel.com/new"
        echo "2. Import your GitHub repository: lizizai-blog"
        echo "3. Set Root Directory to: frontend"
        echo "4. Deploy!"
        echo ""
    else
        echo ""
        echo "❌ Push failed. You may need to authenticate."
        echo ""
        echo "Options:"
        echo "1. Use GitHub Personal Access Token:"
        echo "   git remote set-url origin https://<TOKEN>@github.com/741311791/lizizai-blog.git"
        echo "   git push -u origin main"
        echo ""
        echo "2. Use SSH (if configured):"
        echo "   git remote set-url origin git@github.com:741311791/lizizai-blog.git"
        echo "   git push -u origin main"
        echo ""
        echo "3. Generate token at: https://github.com/settings/tokens"
        echo ""
    fi
else
    echo ""
    echo "Push cancelled."
    echo ""
fi
