!macro customInit
  ; Generate and save license during installation
  !system 'node -e "const LicenseManager = require('./license-manager.js'); const manager = new LicenseManager(); const license = manager.generateLicense(); require('fs').writeFileSync('generated-license.dat', license);"'
  File /oname=$INSTDIR\license.dat "generated-license.dat"
!macroend

!macro customInstall
  WriteRegStr HKLM "Software\AadharApp" "InstallPath" "$INSTDIR"
  WriteRegStr HKLM "Software\AadharApp" "Version" "1.0.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AadharApp" "DisplayName" "Aadhar Form Generator"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AadharApp" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AadharApp" "QuietUninstallString" "$\"$INSTDIR\uninstall.exe$\" /S"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AadharApp" "Publisher" "Your Company Name"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AadharApp" "DisplayVersion" "1.0.0"
!macroend

!macro customUnInstall
  DeleteRegKey HKLM "Software\AadharApp"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\AadharApp"
  RMDir /r "$APPDATA\.aadhar-app"
!macroend 