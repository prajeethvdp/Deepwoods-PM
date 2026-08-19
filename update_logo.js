const fs = require('fs');
const path = require('path');

const b64Path = path.join(__dirname, 'public', 'logo_b64.txt');
const b64 = fs.readFileSync(b64Path, 'utf8').trim();

// 1. Update src/lib/emailService.ts
const emailServicePath = path.join(__dirname, 'src', 'lib', 'emailService.ts');
let tsContent = fs.readFileSync(emailServicePath, 'utf8');
const tsRegex = /const DEEPWOODS_LOGO_BASE64 = "[^"]+";/;
if (tsRegex.test(tsContent)) {
  tsContent = tsContent.replace(tsRegex, `const DEEPWOODS_LOGO_BASE64 = "${b64}";`);
  fs.writeFileSync(emailServicePath, tsContent, 'utf8');
  console.log('Updated emailService.ts with new logo base64!');
} else {
  console.error('DEEPWOODS_LOGO_BASE64 regex match failed in emailService.ts');
}

// 2. Update google-apps-script/Code.gs
const codeGsPath = path.join(__dirname, 'google-apps-script', 'Code.gs');
let gsContent = fs.readFileSync(codeGsPath, 'utf8');
const gsRegex = /const LOGO_BASE64_DATA = "[^"]+";/;
if (gsRegex.test(gsContent)) {
  gsContent = gsContent.replace(gsRegex, `const LOGO_BASE64_DATA = "${b64}";`);
  fs.writeFileSync(codeGsPath, gsContent, 'utf8');
  console.log('Updated Code.gs with new logo base64!');
} else {
  console.error('LOGO_BASE64_DATA regex match failed in Code.gs');
}
