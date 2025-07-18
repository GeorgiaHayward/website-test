class AmbisonicAudioApp {
    constructor() {
        // Initialize components
        this.audioEngine = null;
        this.orientationHandler = null;
        this.visualizer = null;
        
        // DOM elements
        this.elements = {
            audioFile: document.getElementById('audioFile'),
            playButton: document.getElementById('playButton'),
            stopButton: document.getElementById('stopButton'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            progressFill: document.getElementById('progressFill'),
            currentTime: document.getElementById('currentTime'),
            totalTime: document.getElementById('totalTime'),
            enableOrientation: document.getElementById('enableOrientation'),
            orientationStatus: document.getElementById('orientationStatus'),
            orientationData: document.getElementById('orientationData'),
            azimuth: document.getElementById('azimuth'),
            elevation: document.getElementById('elevation'),
            roll: document.getElementById('roll'),
            azimuthSlider: document.getElementById('azimuthSlider'),
            elevationSlider: document.getElementById('elevationSlider'),
            azimuthValue: document.getElementById('azimuthValue'),
            elevationValue: document.getElementById('elevationValue'),
            audioInfo: document.getElementById('audioInfo'),
            fileName: document.getElementById('fileName'),
            duration: document.getElementById('duration'),
            sampleRate: document.getElementById('sampleRate')
        };
        
        // State
        this.isOrientationEnabled = false;
        this.currentFile = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize audio engine
            this.audioEngine = new AmbisonicAudioEngine();
            
            // Initialize orientation handler
            this.orientationHandler = new OrientationHandler();
            
            // Initialize visualizer
            this.visualizer = new AudioVisualizer('visualizer');
            this.visualizer.setAudioEngine(this.audioEngine);
            this.visualizer.setOrientationHandler(this.orientationHandler);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up callbacks
            this.setupCallbacks();
            
            console.log('Ambisonic Audio App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize audio system. Please check your browser compatibility.');
        }
    }
    
    setupEventListeners() {
        // File input
        this.elements.audioFile.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });
        
        // Audio controls
        this.elements.playButton.addEventListener('click', () => {
            this.togglePlayback();
        });
        
        this.elements.stopButton.addEventListener('click', () => {
            this.stopPlayback();
        });
        
        // Volume control
        this.elements.volumeSlider.addEventListener('input', (e) => {
            this.setVolume(parseFloat(e.target.value));
        });
        
        // Orientation control
        this.elements.enableOrientation.addEventListener('click', () => {
            this.toggleOrientation();
        });
        
        // Manual orientation controls
        this.elements.azimuthSlider.addEventListener('input', (e) => {
            this.setManualOrientation();
        });
        
        this.elements.elevationSlider.addEventListener('input', (e) => {
            this.setManualOrientation();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.visualizer.resize();
        });
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, this.preventDefaults, false);
        });
        
        // Drop zone
        document.addEventListener('drop', (e) => {
            this.handleDrop(e);
        });
    }
    
    setupCallbacks() {
        // Audio engine callbacks
        this.audioEngine.onTimeUpdate = (currentTime, duration) => {
            this.updateProgress(currentTime, duration);
        };
        
        this.audioEngine.onEnded = () => {
            this.handlePlaybackEnded();
        };
        
        // Orientation handler callbacks
        this.orientationHandler.onOrientationChange = (azimuth, elevation, roll) => {
            this.updateOrientation(azimuth, elevation, roll);
        };
        
        this.orientationHandler.onPermissionChange = (hasPermission) => {
            this.updateOrientationStatus(hasPermission);
        };
    }
    
    async handleFileSelect(file) {
        if (!file) return;
        
        try {
            this.showLoading('Loading audio file...');
            
            // Load audio file
            const audioInfo = await this.audioEngine.loadAudioFile(file);
            this.currentFile = file;
            
            // Update UI
            this.elements.fileName.textContent = file.name;
            this.elements.duration.textContent = this.formatTime(audioInfo.duration);
            this.elements.sampleRate.textContent = `${audioInfo.sampleRate} Hz`;
            this.elements.audioInfo.style.display = 'block';
            
            // Enable controls
            this.elements.playButton.disabled = false;
            this.elements.stopButton.disabled = false;
            
            // Start visualizer
            this.visualizer.start();
            
            this.hideLoading();
            
            console.log('Audio file loaded successfully:', audioInfo);
            
        } catch (error) {
            console.error('Failed to load audio file:', error);
            this.showError('Failed to load audio file. Please ensure it\'s a valid audio file.');
            this.hideLoading();
        }
    }
    
    async togglePlayback() {
        try {
            if (this.audioEngine.isPlaying) {
                this.audioEngine.pause();
                this.elements.playButton.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Play</span>';
                this.elements.playButton.classList.remove('playing');
            } else {
                await this.audioEngine.play();
                this.elements.playButton.innerHTML = '<span class="btn-icon">⏸️</span><span class="btn-text">Pause</span>';
                this.elements.playButton.classList.add('playing');
            }
        } catch (error) {
            console.error('Playback error:', error);
            this.showError('Playback failed. Please try again.');
        }
    }
    
    stopPlayback() {
        this.audioEngine.stop();
        this.elements.playButton.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Play</span>';
        this.elements.playButton.classList.remove('playing');
        this.updateProgress(0, this.audioEngine.getDuration());
    }
    
    setVolume(volume) {
        this.audioEngine.setVolume(volume);
        this.elements.volumeValue.textContent = `${Math.round(volume * 100)}%`;
    }
    
    async toggleOrientation() {
        try {
            if (this.isOrientationEnabled) {
                this.orientationHandler.disable();
                this.isOrientationEnabled = false;
                this.elements.enableOrientation.innerHTML = '<span class="btn-icon">📱</span><span class="btn-text">Enable Orientation</span>';
                this.elements.orientationData.style.display = 'none';
                this.updateOrientationStatus(false);
            } else {
                await this.orientationHandler.enable();
                this.isOrientationEnabled = true;
                this.elements.enableOrientation.innerHTML = '<span class="btn-icon">🧭</span><span class="btn-text">Disable Orientation</span>';
                this.elements.orientationData.style.display = 'block';
                this.updateOrientationStatus(true);
            }
        } catch (error) {
            console.error('Orientation error:', error);
            this.showError('Failed to enable device orientation. Please check your device and browser settings.');
        }
    }
    
    setManualOrientation() {
        const azimuth = parseFloat(this.elements.azimuthSlider.value);
        const elevation = parseFloat(this.elements.elevationSlider.value);
        
        this.elements.azimuthValue.textContent = `${azimuth}°`;
        this.elements.elevationValue.textContent = `${elevation}°`;
        
        // Update audio engine
        this.audioEngine.updateSpatialPosition(azimuth, elevation, 0);
        
        // Update orientation display
        this.updateOrientationDisplay(azimuth, elevation, 0);
    }
    
    updateOrientation(azimuth, elevation, roll) {
        // Update audio engine
        this.audioEngine.updateSpatialPosition(azimuth, elevation, roll);
        
        // Update UI
        this.updateOrientationDisplay(azimuth, elevation, roll);
        
        // Update manual sliders to reflect device orientation
        this.elements.azimuthSlider.value = azimuth;
        this.elements.elevationSlider.value = elevation;
        this.elements.azimuthValue.textContent = `${azimuth.toFixed(1)}°`;
        this.elements.elevationValue.textContent = `${elevation.toFixed(1)}°`;
    }
    
    updateOrientationDisplay(azimuth, elevation, roll) {
        this.elements.azimuth.textContent = `${azimuth.toFixed(1)}°`;
        this.elements.elevation.textContent = `${elevation.toFixed(1)}°`;
        this.elements.roll.textContent = `${roll.toFixed(1)}°`;
    }
    
    updateOrientationStatus(isEnabled) {
        const status = this.orientationHandler.getStatus();
        let statusText = 'Orientation: ';
        
        if (!status.supported) {
            statusText += 'Not Supported';
        } else if (!status.hasPermission) {
            statusText += 'Permission Denied';
        } else if (isEnabled) {
            statusText += 'Active';
        } else {
            statusText += 'Disabled';
        }
        
        this.elements.orientationStatus.querySelector('.status-text').textContent = statusText;
    }
    
    updateProgress(currentTime, duration) {
        if (duration > 0) {
            const progress = (currentTime / duration) * 100;
            this.elements.progressFill.style.width = `${progress}%`;
        }
        
        this.elements.currentTime.textContent = this.formatTime(currentTime);
        this.elements.totalTime.textContent = this.formatTime(duration);
    }
    
    handlePlaybackEnded() {
        this.elements.playButton.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Play</span>';
        this.elements.playButton.classList.remove('playing');
        this.updateProgress(0, this.audioEngine.getDuration());
    }
    
    handleDrop(e) {
        e.preventDefault();
        const files = e.dataTransfer.files;
        
        if (files.length > 0) {
            this.handleFileSelect(files[0]);
        }
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    showLoading(message) {
        // Simple loading implementation
        console.log('Loading:', message);
    }
    
    hideLoading() {
        console.log('Loading complete');
    }
    
    showError(message) {
        console.error('Error:', message);
        alert(message); // Simple error display - could be enhanced with better UI
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AmbisonicAudioApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause audio when page is hidden (optional)
        // window.app?.audioEngine?.pause();
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.audioEngine.dispose();
        window.app.orientationHandler.disable();
        window.app.visualizer.stop();
    }
});