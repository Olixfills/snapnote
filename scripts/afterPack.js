const { execFileSync } = require('child_process');
const path = require('path');

// Apple Silicon refuses to run ANY unsigned Mach-O binary — without at least
// an ad-hoc signature, macOS reports the app as "damaged" (not just
// "unidentified developer") and offers no way to open it, only trash it.
// We don't have a paid Developer ID, so sign with "-" (ad-hoc): it satisfies
// the OS's signature requirement without needing a real certificate. Users
// still see the normal unsigned-app Gatekeeper prompt on first launch.
module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;

  const appName = `${context.packager.appInfo.productFilename}.app`;
  const appPath = path.join(context.appOutDir, appName);

  console.log(`[afterPack] ad-hoc signing ${appPath}`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], {
    stdio: 'inherit',
  });
};
