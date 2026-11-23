// Copy of the update workflow, .github/workflows/actualizar-fchat.yml.
// It has to live in the code because Vercel's Deploy button clones the repository
// without the .github folder: Settings › Updates creates the file on GitHub in one
// click. update-workflow.test.ts checks that it matches the file. The file name is
// kept in Spanish because existing installations already have it under that name.

export const WORKFLOW_PATH = ".github/workflows/actualizar-fchat.yml"

export const WORKFLOW_YAML = `# Keeps your copy of FChat up to date with the latest version of paidbyfacu/fchat.
# Runs every 4 hours and whenever you click "Run workflow". When there is a new
# version, it commits it to your repository and Vercel deploys it on its own.
# Your .github folder is never touched. If you changed the code by hand, those
# changes are replaced by the official repository's: to keep them, disable this
# workflow in the Actions tab on GitHub.
name: Update FChat

on:
  schedule:
    - cron: "17 */4 * * *"
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: actualizar-fchat
  cancel-in-progress: false

jobs:
  actualizar:
    if: github.repository != 'paidbyfacu/fchat'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1

      - name: Fetch the latest version
        run: git fetch --depth=1 https://github.com/paidbyfacu/fchat.git main

      - name: Apply the new version
        run: |
          git read-tree --reset -u FETCH_HEAD
          git rm -r -q --cached --ignore-unmatch .github
          rm -rf .github
          git checkout HEAD -- .github
          if git diff --cached --quiet; then
            echo "You already have the latest version of FChat."
            exit 0
          fi
          version=$(node -p "require('./package.json').version")
          git config user.name "\${{ github.repository_owner }}"
          git config user.email "\${{ github.repository_owner_id }}+\${{ github.repository_owner }}@users.noreply.github.com"
          git commit -q -m "Update FChat to version $version"
          git push
          echo "FChat updated to version $version. Vercel will deploy it in a few minutes."
`
