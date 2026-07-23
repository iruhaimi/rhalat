# عطلات رحلاتكم (VisaFaster)

منصة عطلات رحلاتكم لخدمات التأشيرات السياحية والأعمال — تطبيق ويب و iOS/Android.

**Production**: https://visafaster.com

## Local development

Requires Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Tech stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Native iOS build

Use the clean rebuild script before every Xcode build:

```sh
npm install
npm run ios:rebuild-clean
npx cap open ios
```
