# Ambisonic Audio Player

A web-based ambisonic audio player that provides spatial audio experience with device orientation control.

## Features

- **Ambisonic Audio File**: Loads and plays your "Ambisonic Audio.WAV" file automatically
- **Device Orientation Control**: Use your phone or tablet's orientation sensors to control spatial audio
- **Manual Controls**: Sliders for azimuth and elevation when device orientation is not available
- **Real-time Visualizer**: Audio frequency visualization
- **Volume Control**: Adjustable volume with percentage display
- **Progress Tracking**: Shows current time and total duration

## How to Use

1. **Add Your Audio File**: Place your "Ambisonic Audio.WAV" file in the project directory
2. **Start the Server**: Run `python3 -m http.server 8000` in the project directory
3. **Open in Browser**: Navigate to `http://localhost:8000`
4. **Click Play**: Your ambisonic audio file will start playing immediately
5. **Enable Orientation**: Click "Enable Orientation" to use device sensors (works best on mobile)
6. **Manual Control**: Use the sliders to manually control spatial position
7. **Adjust Volume**: Use the volume slider to control audio level

## Technical Details

- **Audio File**: "Ambisonic Audio.WAV" (your file)
- **Format Support**: WAV ambisonic files (B-format recommended)
- **Spatial Processing**: HRTF-based 3D audio rendering
- **Browser Support**: Modern browsers with Web Audio API support

## Mobile Experience

For the best experience:
- Use a mobile device with orientation sensors
- Enable device orientation permissions when prompted
- Tilt your device to move around in the 3D soundfield
- Use headphones for better spatial audio perception

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (limited orientation support)
- Mobile browsers with Web Audio API support

## File Structure

```
website-test/
├── index.html          # Main HTML interface
├── app.js             # Main application logic
├── audio-engine.js    # Audio processing and ambisonic decoding
├── orientation-handler.js # Device orientation handling
├── visualizer.js      # Audio visualization
├── styles.css         # Styling
└── Ambisonic Audio.WAV # Your ambisonic audio file
```

## Development

The application is built with vanilla JavaScript and uses:
- Web Audio API for audio processing
- Device Orientation API for sensor input
- Canvas API for visualization
- Modern CSS for responsive design

## Troubleshooting

- **No Audio**: Ensure your browser supports Web Audio API and check volume settings
- **File Not Found**: Make sure "Ambisonic Audio.WAV" is in the same directory as index.html
- **Orientation Not Working**: Check device permissions and browser compatibility
- **Performance Issues**: Close other tabs and applications to free up resources 

---

## 1. **Create a GitHub Repository**

1. Go to [github.com](https://github.com/) and log in.
2. Click the "+" in the top right and select **New repository**.
3. Name your repo (e.g., `sound-room`), set it to **Public**, and click **Create repository**.

---

## 2. **Push Your Project to GitHub**

If your project isn’t already a git repo, run these commands in your project folder:

```sh
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sound-room.git
git push -u origin main
```
Replace `YOUR_USERNAME` and `sound-room` with your actual GitHub username and repo name.

---

## 3. **Enable GitHub Pages**

1. Go to your repo on GitHub.
2. Click **Settings** > **Pages** (in the left sidebar).
3. Under **Source**, select the `main` branch and `/ (root)` folder.
4. Click **Save**.

GitHub will give you a URL like:  
`https://YOUR_USERNAME.github.io/sound-room/`

---

## 4. **Access Your Site**

- Wait a minute or two for the site to build.
- Visit the URL provided by GitHub Pages.

---

## 5. **(Optional) Update URLs for Audio/Assets**

If you use absolute paths (like `/Ambisonic Audio.flac`), change them to relative paths (`Ambisonic Audio.flac`) for GitHub Pages compatibility.

---

## 6. **(Optional) Add a .nojekyll File**

If you have files/folders that start with an underscore, add an empty file named `.nojekyll` to your repo root to prevent GitHub Pages from ignoring them.

---

**Let me know if you want a ready-to-copy `.gitignore` or help with any of these steps!**  
Once you’ve pushed and enabled Pages, send me your link and I can help you check it! 
