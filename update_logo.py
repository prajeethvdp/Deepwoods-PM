import base64

with open('public/logo.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

# 1. emailService.ts
with open('src/lib/emailService.ts', 'r', encoding='utf-8') as f:
    f1 = f.read()

idx1 = f1.find('const DEEPWOODS_LOGO_BASE64 = "')
if idx1 != -1:
    end1 = f1.find('";', idx1)
    new_f1 = f1[:idx1] + 'const DEEPWOODS_LOGO_BASE64 = "' + b64 + f1[end1:]
    with open('src/lib/emailService.ts', 'w', encoding='utf-8') as f:
        f.write(new_f1)
    print("Updated emailService.ts!")

# 2. Code.gs
with open('google-apps-script/Code.gs', 'r', encoding='utf-8') as f:
    f2 = f.read()

idx2 = f2.find('const LOGO_BASE64_DATA = "')
if idx2 != -1:
    end2 = f2.find('";', idx2)
    new_f2 = f2[:idx2] + 'const LOGO_BASE64_DATA = "' + b64 + f2[end2:]
    with open('google-apps-script/Code.gs', 'w', encoding='utf-8') as f:
        f.write(new_f2)
    print("Updated Code.gs!")
