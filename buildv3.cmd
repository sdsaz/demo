set ERRORLEVEL=0
set NPMINSTALL=0
set TERMINATE=0
set PACKAGE=%WORKSPACE%\dist
set BACKUP=%WORKSPACE%\Deploy\Backup
set ARCHIVE=%WORKSPACE%\Deploy\Archive
set HOSTURL1=https://%SERVER1%/msdeploy.axd?site=
set HOSTURL2=https://%SERVER2%/msdeploy.axd?site=

echo ==== Cleaning old backups from "%ARCHIVE%" location ====
for /f "skip=4 delims=" %%a in ('dir "%ARCHIVE%" /b /o-d /a-d') do del "%ARCHIVE%\%%a"
if %ERRORLEVEL% neq 0 (
	echo Error while cleaning old backup artifacts of %DISPLAYNAME% project
	set ERRORLEVEL=0
)

chdir /d "%WORKSPACE%"
if %NPMINSTALL% neq 1 goto :npminstall & :ngbuild

:npminstall
echo ==== Installing npm packages of %DISPLAYNAME% project ====
npm install -f | find "ERROR" >nul2>nul

:ngbuild
echo ==== Preparing deploy package of %DISPLAYNAME% project ====
npm run ng -- build --configuration production | find "ERROR" >nul2>nul
if not exist "dist" (
	echo Error while preparing deploy package of %DISPLAYNAME% project
	exit 1
)
timeout 2>nul

echo ==== Backing up current %DISPLAYNAME% project to "%BACKUP%" location ====
if exist "%BACKUP%" rmdir "%BACKUP%" /q /s
msdeploy.exe -verb:sync -source:ComputerName="%HOSTURL1%",UserName='%USERNAME1%',Password=%PASSWORD1%,ContentPath="%APP1%",AuthType='Basic',IncludeAcls='False' -dest:ContentPath="%BACKUP%" -allowUntrusted -skip:absolutePath=%SKIPBACKUP%
if %ERRORLEVEL% neq 0 (
	set ERRORLEVEL=0
	set TERMINATE=1
	echo Error while backing up %DISPLAYNAME% project
)
timeout 2>nul
if %TERMINATE% neq 0 goto :terminate

echo ==== Deploying %DISPLAYNAME% project package to %APP1% app ====
msdeploy.exe -verb:sync -source:ContentPath="%PACKAGE%" -dest:ContentPath="%APP1%",ComputerName="%HOSTURL1%",UserName='%USERNAME1%',Password=%PASSWORD1%,AuthType='Basic',IncludeAcls='False' -allowUntrusted -enableRule:AppOffline -skip:skipAction=Delete,absolutePath=%SKIPREMOTEDIRDELETE% -skip:objectName=filePath,absolutePath=%SKIPFILES% -disableLink:AppPoolExtension -disableLink:ContentExtension -disableLink:CertificateExtension
if %ERRORLEVEL% neq 0 (
	set ERRORLEVEL=0
	set TERMINATE=1
	echo Error while deploying %DISPLAYNAME% project package to %APP1% app
)
timeout 2>nul
if %TERMINATE% neq 0 goto :terminate

echo ==== Deploying %DISPLAYNAME% project package to %APP2% app ====
msdeploy.exe -verb:sync -source:ContentPath="%PACKAGE%" -dest:ContentPath="%APP2%",ComputerName="%HOSTURL1%",UserName='%USERNAME1%',Password=%PASSWORD1%,AuthType='Basic',IncludeAcls='False' -allowUntrusted -enableRule:AppOffline -skip:skipAction=Delete,absolutePath=%SKIPREMOTEDIRDELETE% -skip:objectName=filePath,absolutePath=%SKIPFILES% -disableLink:AppPoolExtension -disableLink:ContentExtension -disableLink:CertificateExtension
if %ERRORLEVEL% neq 0 (
	set ERRORLEVEL=0
	set TERMINATE=1
	echo Error while deploying %DISPLAYNAME% project package to %APP2% app
)
timeout 2>nul
if %TERMINATE% neq 0 goto :terminate

echo ==== Deploying %DISPLAYNAME% project package to %APP3% app ====
msdeploy.exe -verb:sync -source:ContentPath="%PACKAGE%" -dest:ContentPath="%APP3%",ComputerName="%HOSTURL1%",UserName='%USERNAME1%',Password=%PASSWORD1%,AuthType='Basic',IncludeAcls='False' -allowUntrusted -enableRule:AppOffline -skip:skipAction=Delete,absolutePath=%SKIPREMOTEDIRDELETE% -skip:objectName=filePath,absolutePath=%SKIPFILES% -disableLink:AppPoolExtension -disableLink:ContentExtension -disableLink:CertificateExtension
if %ERRORLEVEL% neq 0 (
	set ERRORLEVEL=0
	set TERMINATE=1
	echo Error while deploying %DISPLAYNAME% project package to %APP3% app
)
timeout 2>nul
if %TERMINATE% neq 0 goto :terminate

echo ==== Deploying %DISPLAYNAME% project package to %APP4% app ====
msdeploy.exe -verb:sync -source:ContentPath="%PACKAGE%" -dest:ContentPath="%APP4%",ComputerName="%HOSTURL2%",UserName='%USERNAME2%',Password=%PASSWORD2%,AuthType='Basic',IncludeAcls='False' -allowUntrusted -enableRule:AppOffline -skip:skipAction=Delete,absolutePath=%SKIPREMOTEDIRDELETE% -skip:objectName=filePath,absolutePath=%SKIPFILES% -disableLink:AppPoolExtension -disableLink:ContentExtension -disableLink:CertificateExtension
if %ERRORLEVEL% neq 0 (
	set ERRORLEVEL=0
	set TERMINATE=1
	echo Error while deploying %DISPLAYNAME% project package to %APP4% app
)
timeout 2>nul
if %TERMINATE% neq 0 goto :terminate

echo ===== Archiving backup and deployed artifacts of %DISPLAYNAME% project =====
if not exist "%ARCHIVE%" mkdir "%ARCHIVE%"
chdir /d "%BACKUP%"
rar.exe a -r "%ARCHIVE%\%BUILD_NUMBER%_backup.7z" "*.*" > nul
chdir /d "%PACKAGE%"
rar.exe a -r "%ARCHIVE%\%BUILD_NUMBER%.7z" "*.*" > nul
if %ERRORLEVEL% neq 0 (
	echo Error while archiving backup and deployed artifacts of %DISPLAYNAME% project
)

echo ===== Cleaning up  =====
rmdir "%PACKAGE%" /q /s > nul
rmdir "%BACKUP%" /q /s > nul
if %ERRORLEVEL% neq 0 (
	echo Error while cleaning deployed artifacts of %DISPLAYNAME% project
)

echo %DISPLAYNAME% project deployed success
exit 0

:terminate
if %TERMINATE% neq 0 (
	echo Terminating deploy process because of one or more errors
	exit 1
)