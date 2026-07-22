# iOS clean rebuild

Use this only when the iPhone app opens an old WebView or shows any Lovable-hosted page.

## Required command

From the project root:

```bash
npm install
npm run ios:rebuild-clean
```

Open Xcode only after the script prints:

```bash
SUCCESS ✅ — iOS bundle is clean.
```

Then run:

```bash
npx cap open ios
```

Before running from Xcode, delete the old app from the iPhone/simulator and use:

```text
Product → Clean Build Folder → Run
```

## If your Mac says: Missing script: "ios:rebuild-clean"

Your local folder is not on the latest project files. First run:

```bash
git pull
npm run
```

If the script still does not appear, replace your local folder with a fresh clone/export of the current GitHub project, then run:

```bash
npm install
npm run ios:rebuild-clean
```

Do not open Xcode before the clean rebuild succeeds.