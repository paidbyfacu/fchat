// Copia del workflow de actualización, .github/workflows/actualizar-fchat.yml.
// Hace falta en el código porque el botón Deploy de Vercel clona el repositorio
// sin la carpeta .github: desde Ajustes › Actualizaciones se crea el archivo en
// GitHub con un clic. update-workflow.test.ts revisa que sea igual al archivo.

export const WORKFLOW_PATH = ".github/workflows/actualizar-fchat.yml"

export const WORKFLOW_YAML = `# Actualiza tu copia de FChat con la última versión de paidbyfacu/fchat.
# Revisa cada 4 horas y también cuando tocas «Run workflow». Si hay una versión
# nueva, hace un commit en tu repositorio y Vercel la publica sola.
# Tu carpeta .github no se toca. Si cambiaste el código a mano, esos cambios se
# reemplazan por los del repositorio oficial: para conservarlos, desactiva este
# workflow en la pestaña Actions de GitHub.
name: Actualizar FChat

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

      - name: Traer la última versión
        run: git fetch --depth=1 https://github.com/paidbyfacu/fchat.git main

      - name: Aplicar la versión nueva
        run: |
          git read-tree --reset -u FETCH_HEAD
          git rm -r -q --cached --ignore-unmatch .github
          rm -rf .github
          git checkout HEAD -- .github
          if git diff --cached --quiet; then
            echo "Ya tienes la última versión de FChat."
            exit 0
          fi
          version=$(node -p "require('./package.json').version")
          git config user.name "\${{ github.repository_owner }}"
          git config user.email "\${{ github.repository_owner_id }}+\${{ github.repository_owner }}@users.noreply.github.com"
          git commit -q -m "Actualizar FChat a la versión $version"
          git push
          echo "FChat actualizado a la versión $version. Vercel la publica en unos minutos."
`
