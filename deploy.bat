@echo off
setlocal DisableDelayedExpansion
cd /d "%~dp0"

echo.
echo ============================================================
echo   Raton Tama - despliegue automatico en GitHub Pages
echo ============================================================
echo.

echo [1/10] Comprobando Node.js y npm...
where node >nul 2>nul
if errorlevel 1 goto error_node
where npm >nul 2>nul
if errorlevel 1 goto error_npm
call node --version
if errorlevel 1 goto error_node
call npm --version
if errorlevel 1 goto error_npm

echo.
echo [2/10] Preparando Git, rama main y remoto origin...
where git >nul 2>nul
if errorlevel 1 goto error_git
if not exist ".git" git init
if errorlevel 1 goto error_git
git branch -M main
if errorlevel 1 goto error_git
git remote get-url origin >nul 2>nul
if errorlevel 1 git remote add origin https://github.com/CoipoNorte/Raton-Tama.git
if errorlevel 1 goto error_remote
git remote set-url origin https://github.com/CoipoNorte/Raton-Tama.git
if errorlevel 1 goto error_remote

echo.
echo [3/10] Comprobando .gitignore...
if exist ".gitignore" goto ignore_listo
> ".gitignore" echo node_modules/
>> ".gitignore" echo dist/
>> ".gitignore" echo dist-ssr/
>> ".gitignore" echo .vite/
>> ".gitignore" echo .cache/
>> ".gitignore" echo coverage/
>> ".gitignore" echo *.log
>> ".gitignore" echo .DS_Store
>> ".gitignore" echo .vscode/
>> ".gitignore" echo .idea/
:ignore_listo

echo.
echo [4/10] Asegurando scripts predeploy y deploy...
call node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.scripts=p.scripts||{};p.scripts.predeploy='npm run build';p.scripts.deploy='gh-pages -d dist';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');"
if errorlevel 1 goto error_scripts

echo.
echo [5/10] Verificando la ruta base de GitHub Pages...
call node -e "const fs=require('fs');const p='vite.config.ts';let s=fs.readFileSync(p,'utf8');s=s.includes('base:')?s.replace(/base:\s*[^,]+,/,'  base: \'/Raton-Tama/\','):s.replace('export default defineConfig({','export default defineConfig({\n  base: \'/Raton-Tama/\',');fs.writeFileSync(p,s);"
if errorlevel 1 goto error_base

echo.
echo [6/10] Instalando dependencias y gh-pages...
call npm install
if errorlevel 1 goto error_install
call npm install --save-dev --save-exact gh-pages@6.1.1
if errorlevel 1 goto error_install

echo.
echo [7/10] Construyendo y comprobando dist/index.html...
call npm run build
if errorlevel 1 goto error_build
if not exist "dist\index.html" goto error_dist

echo.
echo [8/10] Guardando los cambios en Git si los hay...
git add -A
if errorlevel 1 goto error_git_add
git diff --cached --quiet
if errorlevel 1 git config user.name >nul 2>nul
if errorlevel 1 git config user.name "Raton Tama Deploy"
if errorlevel 1 goto error_git_identity
git config user.email >nul 2>nul
if errorlevel 1 git config user.email "coiponorte@users.noreply.github.com"
if errorlevel 1 goto error_git_identity
git diff --cached --quiet
if errorlevel 1 git commit -m "Deploy Raton Tama"
if errorlevel 1 goto error_commit

echo.
echo [9/10] Enviando main a GitHub...
git push origin main
if errorlevel 1 goto error_push

echo.
echo [10/10] Publicando la carpeta dist en gh-pages...
call npm run deploy
if errorlevel 1 goto error_deploy

echo.
echo Despliegue completado.
echo En GitHub, abre Settings, Pages y selecciona gh-pages / (root).
echo Si ya estaba activado, recarga la pagina publicada con Ctrl+F5.
echo URL: https://coiponorte.github.io/Raton-Tama/
echo.
pause
exit /b 0

:error_node
echo ERROR: instala Node.js y vuelve a ejecutar este archivo.
goto error_final
:error_npm
echo ERROR: npm no esta disponible. Reinstala Node.js con npm incluido.
goto error_final
:error_git
echo ERROR: Git no esta disponible o no se pudo preparar la rama main.
goto error_final
:error_remote
echo ERROR: no se pudo configurar el remoto de GitHub.
goto error_final
:error_scripts
echo ERROR: no se pudieron preparar los scripts de despliegue.
goto error_final
:error_base
echo ERROR: no se pudo configurar base en vite.config.ts.
goto error_final
:error_install
echo ERROR: fallo la instalacion de dependencias.
goto error_final
:error_build
echo ERROR: npm run build no termino correctamente.
goto error_final
:error_dist
echo ERROR: no se encontro dist\index.html despues de compilar.
goto error_final
:error_git_add
echo ERROR: Git no pudo anadir los cambios.
goto error_final
:error_git_identity
echo ERROR: configura user.name y user.email en Git.
goto error_final
:error_commit
echo ERROR: Git no pudo crear el commit automatico.
goto error_final
:error_push
echo ERROR: no se pudo enviar main. Comprueba el acceso al repositorio.
goto error_final
:error_deploy
echo ERROR: gh-pages no pudo publicar dist.
goto error_final
:error_final
echo Revisa el mensaje anterior y vuelve a ejecutar deploy.bat.
echo.
pause
exit /b 1