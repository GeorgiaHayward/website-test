# 🎧 Ambisonic Audio Player

A modern web application for playing ambisonic audio files with device orientation control for immersive spatial audio experiences.

## ✨ Features

- **🎵 Ambisonic Audio Playback**: Supports WAV, MP3, and OGG ambisonic audio files
- **📱 Device Orientation Control**: Use your mobile device's sensors to navigate the 3D soundfield
- **🎛️ Manual Controls**: Manual azimuth and elevation sliders for desktop use
- **📊 Real-time Visualization**: Audio spectrum analyzer and spatial audio visualization
- **🎨 Modern UI**: Beautiful, responsive design with smooth animations
- **🌙 Dark Mode**: Automatic dark mode support based on system preferences
- **📱 Mobile-First**: Optimized for mobile devices with touch controls

## 🚀 Getting Started

### GitHub Pages Deployment

This app is designed to work perfectly with GitHub Pages:

1. **Fork or clone this repository**
2. **Enable GitHub Pages** in your repository settings
3. **Select source**: Deploy from main branch
4. **Access your app**: `https://yourusername.github.io/your-repo-name`

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/ambisonic-audio-player.git
   cd ambisonic-audio-player
   ```

2. **Serve locally** (required for Web Audio API):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using any other static file server
   ```

3. **Open in browser**: Navigate to `http://localhost:8000`

## 🎯 How to Use

### 1. Load Audio File
- Click "Choose Ambisonic Audio File" or drag & drop a file
- Supports WAV, MP3, and OGG formats
- Best results with 4+ channel ambisonic files (B-format)

### 2. Control Playback
- **Play/Pause**: Start or pause audio playback
- **Stop**: Stop playback and reset to beginning
- **Volume**: Adjust playback volume with the slider

### 3. Spatial Audio Control

#### Device Orientation (Mobile)
- Click "Enable Orientation" to activate device sensors
- Grant permission when prompted (required on iOS 13+)
- Tilt and rotate your device to move around in the soundfield:
  - **Rotate left/right**: Changes azimuth (horizontal direction)
  - **Tilt up/down**: Changes elevation (vertical direction)
  - **Roll**: Additional spatial dimension

#### Manual Controls (Desktop/Mobile)
- Use the azimuth slider to control left/right positioning
- Use the elevation slider to control up/down positioning
- Works alongside or instead of device orientation

### 4. Visualization
- **Frequency Spectrum**: Real-time audio frequency analysis
- **Spatial Visualization**: Shows listener position and sound source
- **Orientation Indicator**: Compass showing current heading

## 🛠️ Technical Details

### Web Audio API
- Uses modern Web Audio API for spatial audio processing
- HRTF-based 3D panner for realistic spatial audio
- Support for ambisonic audio decoding (simplified implementation)

### Device Orientation
- Supports both iOS and Android devices
- Handles permission requests for iOS 13+
- Smooth interpolation and calibration features

### Browser Compatibility
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 13+ requires permission)
- **Mobile browsers**: Optimized for mobile use

### File Format Support
- **WAV**: Best for high-quality ambisonic content
- **MP3**: Good compression with spatial audio support
- **OGG**: Alternative compressed format

## 📱 Mobile Usage Tips

1. **Use headphones** for the best spatial audio experience
2. **Enable orientation** for immersive control
3. **Calibrate** by pointing device forward when starting
4. **Hold device** in landscape mode for better control
5. **Grant permissions** when prompted for orientation access

## 🎨 Customization

The app is built with modular CSS and JavaScript, making it easy to customize:

- **Colors**: Modify the gradient colors in `styles.css`
- **Layout**: Adjust the responsive grid layout
- **Visualization**: Customize the audio visualizer settings
- **Controls**: Add or modify audio controls

## 🔧 Advanced Features

### Ambisonic Processing
- Automatic detection of multichannel ambisonic files
- Basic ambisonic rotation matrix implementation
- Extensible for advanced ambisonic libraries

### Spatial Audio
- 3D HRTF processing for realistic spatial audio
- Distance modeling and rolloff
- Listener orientation tracking

### Performance
- Optimized for mobile devices
- Efficient canvas rendering
- Smooth 60fps visualization

## 🐛 Troubleshooting

### Audio Won't Play
- Ensure the audio file is valid and supported
- Check browser audio permissions
- Try clicking play after user interaction (autoplay restrictions)

### Orientation Not Working
- Check device orientation sensor support
- Grant permission when prompted (iOS)
- Try calibrating the orientation
- Ensure HTTPS connection (required for sensors)

### Performance Issues
- Close other browser tabs
- Reduce visualization complexity
- Check device performance capabilities

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 🙏 Acknowledgments

- Web Audio API for spatial audio processing
- Device Orientation API for motion control
- Canvas API for visualization
- Modern CSS features for beautiful UI

---

**Built with ❤️ for spatial audio enthusiasts** 
