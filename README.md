# Drishtie's Birthday Website

Scenes: 3D candle-lit cake, New York night flythrough, loading, typed letter with photos, E-Gift (camera), final message.
Stack: React + Vite, Three.js (cake), GSAP (transitions). Plain CSS instead of Tailwind and no Framer Motion, to keep the site light and fast on phones.

## 1. Run locally
Install Node.js (LTS) from nodejs.org, then in this folder:
```
npm install
npm run dev
```
Open the address it prints (http://localhost:5173).

## 2. Add photographs
Copy images into `public/images/`, then edit `photos` in `src/config.js`, e.g. `{ src: '/images/drishtie-1.jpg', alt: 'Drishtie', ratio: 3/4 }`. `ratio` = width / height. Add or remove entries freely.

## 3. Replace the music
By default a soft instrumental Happy Birthday is generated in the browser (no file needed). To use your own, put a file in `public/audio/` and set `musicSrc: '/audio/birthday.mp3'` in `src/config.js`. Use only music you are allowed to use.

## 4. Change the message
Edit `letter` (each line is a paragraph), `gift` texts, `name`, and `cakeLines` in `src/config.js`.

## 5. Test the camera
Camera needs HTTPS or localhost. Click "Click to view your E-Gift" and choose Allow: you see a live preview. Choose Block to see the fallback. Nothing is recorded, saved or uploaded. To retest in Chrome, click the lock icon in the address bar and reset the camera permission.

## 6. Upload to GitHub
Create an empty repository on github.com (no README), then:
```
git init
git add .
git commit -m "Birthday website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## 7-8. Deploy with Vercel
1. Sign in at vercel.com with GitHub. 2. Add New > Project, import your repo. 3. Leave defaults (Framework: Vite, build `npm run build`, output `dist`). 4. Click Deploy. You get a link like `your-project.vercel.app`. Every future `git push` redeploys automatically.

## 9. Test on a phone
Same Wi-Fi: run `npm run dev`, open the "Network" address it prints on your phone. Better: open the Vercel link, which has HTTPS (needed for the camera). Tap once to start the cake scene so sound can play.
