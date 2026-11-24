# NIM Jungle 3D — Maths Adventure

A browser-based Class 4 mathematics game inspired by the NIM game on NCERT Chapter 10, *Elephants, Tigers and Leopards*.

## Features in this first build

- Procedurally created 3D jungle scene (trees, plants, stones, fireflies, ground, lighting)
- Three custom low-poly animal characters created from Three.js geometry (elephant, tiger, leopard)
- Play against a computer (Smart Tiger) or two players
- Friendly Elephant random opponent option
- Textbook challenge starts at 6, 7, and 8
- Custom target, starting total and legal move sets
- Hint button and strategy reveal
- Move history, undo, progress track, win feedback
- Optional generated sound (no sound files)
- Responsive layout for desktop, tablet and mobile

## Requirements

- A recent Chrome, Edge or Firefox browser with WebGL support
- Python 3 (recommended for the simple local server) or Node.js
- Internet connection for the Three.js CDN and Google Fonts in this prototype

## Run on Windows (simple method)

1. Extract `nim-jungle-3d.zip` to a folder, for example `C:\NIM-Jungle`.
2. Install Python 3 if it is not already installed: https://www.python.org/downloads/
3. Open the extracted folder.
4. Double-click `start_windows.bat`.
5. In the terminal window, open the address it prints (usually `http://localhost:8000`) in Edge or Chrome.
6. Keep the terminal open while you play. Close it to stop the local server.


## Run manually

Open a terminal in this folder and run:


```bash
python -m http.server 8000
```

Then browse to:


```text
http://localhost:8000
```

If `python` is not recognized, try:


```bash
py -m http.server 8000
```

## Controls

- **+1 / +2**: Add that amount to the running total.
- **Give me a hint**: Reveals a move to investigate and prompts the learner to think about the opponent's response.
- **Undo**: Reverts one move.
- **New game**: Restart from the configured start value.
- **Textbook challenges 6 / 7 / 8**: Start from these totals with target 10 and allowed moves 1 and 2.
- **Game settings**: Change target, allowed move set, opponent, and start total; then select Apply & start.
- **Reveal a strategy**: Teacher-facing analysis of losing positions for the current rules.


## Publish online for free with GitHub Pages

1. Create or sign in to a GitHub account at https://github.com/.
2. Create a new public repository, e.g. `nim-jungle-3d`.
3. Upload the files in this folder (`index.html`, `style.css`, `main.js`, `README.md`, `start_windows.bat`).
4. In the repository, open **Settings → Pages**.
5. Under the build/deployment source, choose **Deploy from a branch**.
6. Select `main` and `/ (root)`, then save.
7. Wait for the deployment and open the published URL shown in the Pages section.


## Project files

- `index.html` — game structure and UI
- `style.css` — responsive design, colours, layout and animations
- `main.js` — Three.js scene, procedural animals, game logic, computer opponent and UI events
- `start_windows.bat` — launches a local Python web server on Windows


## License and asset notes

The characters and scenery in this prototype are procedurally built from Three.js shapes, so there are no separate animal model downloads. Three.js is loaded from jsDelivr. If you later add downloaded GLB models, check the individual model licence and keep a credits file where required.


## Suggested next upgrades

1. Replace procedural animal shapes with high-quality animated GLB animal characters, preserving a consistent art style and license.
2. Add animal walk/run animations on every move and more expressive win/lose reactions.
3. Add Telugu/English language switch.
4. Add classroom projector mode and teacher controls to lock/unlock challenges.
5. Add a student progress dashboard without collecting personal data.
6. Add tutorial voice narration and accessibility settings.
7. Add sound and music controls with a mute default for classroom use.
8. Improve computer difficulty and add strategy explanation animations.

