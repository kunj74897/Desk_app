!macro customInit
  ; Generate and save license during installation
  !system 'node -e "const LicenseManager = require('./license-manager.js'); const manager = new LicenseManager(); const license = manager.generateLicense(); require('fs').writeFileSync('generated-license.dat', license);"'
  File /oname=$INSTDIR\license.dat "generated-license.dat"
!macroend 