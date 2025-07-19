class AmbisonicAudioApp {
    constructor() {
        // Initialize components
        this.audioEngine = null;
        this.orientationHandler = null;
        this.visualizer = null;
        
        // DOM elements
        this.elements = {
            playButton: document.getElementById('playButton'),
            stopButton: document.getElementById('stopButton'),
            progressFill: document.getElementById('progressFill'),
            currentTime: document.getElementById('currentTime'),
            totalTime: document.getElementById('totalTime'),
            fileName: document.getElementById('fileName'),
            duration: document.getElementById('duration'),
            sampleRate: document.getElementById('sampleRate')
        };
        
        // State
        this.isOrientationEnabled = false;
        this.audioLoaded = false;
        this.isLoading = false;
        this.hasUserInteracted = false;
        
        this.init();
    }
    
    async init() {
        try {
            console.log('Starting app initialization...');
            
            // Initialize audio engine (but do not load audio yet)
            console.log('Initializing audio engine...');
            this.audioEngine = new AmbisonicAudioEngine();
            
            // Initialize orientation handler
            console.log('Initializing orientation handler...');
            this.orientationHandler = new OrientationHandler();
            
            // Try to enable orientation, but do not fail if not possible
            try {
                await this.orientationHandler.enable();
                this.isOrientationEnabled = true;
                console.log('Device orientation enabled automatically.');
            } catch (err) {
                this.isOrientationEnabled = false;
                console.warn('Device orientation could not be enabled automatically:', err);
            }
            
            // Initialize visualizer (if present)
            if (document.getElementById('visualizer')) {
                console.log('Initializing visualizer...');
                this.visualizer = new AudioVisualizer('visualizer');
                this.visualizer.setAudioEngine(this.audioEngine);
                this.visualizer.setOrientationHandler(this.orientationHandler);
            }
            
            // Set up event listeners
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            
            // Set up callbacks
            console.log('Setting up callbacks...');
            this.setupCallbacks();
            
            // Do NOT load audio here!
            // Only load after user clicks Play
            this.elements.playButton.disabled = false;
            this.elements.playButton.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Play</span>';
            
            console.log('Ambisonic Audio App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize audio system. Please check your browser compatibility.');
        }
    }
    
    async loadDefaultAudio() {
        try {
            console.log('loadDefaultAudio: Starting...');
            this.isLoading = true;
            this.elements.playButton.disabled = true;
            this.elements.playButton.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Loading...</span>';
            
            this.showLoading('Loading ambisonic audio file...');
            
            // Load the actual ambisonic audio file
            console.log('loadDefaultAudio: Calling audioEngine.createTestTone()...');
            const audioInfo = await this.audioEngine.createTestTone();
            console.log('loadDefaultAudio: Audio loaded successfully:', audioInfo);
            
            this.audioLoaded = true;
            this.isLoading = false;
            console.log('loadDefaultAudio: Setting audioLoaded to true');
            
            // Update UI
            console.log('loadDefaultAudio: Updating UI...');
            this.elements.duration.textContent = this.formatTime(audioInfo.duration);
            this.elements.sampleRate.textContent = `${audioInfo.sampleRate} Hz`;
            
            // Enable controls
            console.log('loadDefaultAudio: Enabling controls...');
            this.elements.playButton.disabled = false;
            this.elements.playButton.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Play</span>';
            this.elements.stopButton.disabled = false;
            
            // Start visualizer
            console.log('loadDefaultAudio: Starting visualizer...');
            this.visualizer.start();
            
            this.hideLoading();
            console.log('loadDefaultAudio: Complete!');
            
            console.log('Ambisonic audio file loaded successfully:', audioInfo);
            
        } catch (error) {
            console.error('loadDefaultAudio: Failed to load ambisonic audio file:', error);
            this.isLoading = false;
            this.elements.playButton.disabled = false;
            this.elements.playButton.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Play</span>';
            this.showError(`Failed to load audio file: ${error.message}. Please ensure "Ambisonic Audio.flac" is in the same directory and refresh the page.`);
            this.hideLoading();
        }
    }
    
    setupEventListeners() {
        // Audio controls
        this.elements.playButton.addEventListener('click', () => {
            this.togglePlayback();
        });
        
        this.elements.stopButton.addEventListener('click', () => {
            this.stopPlayback();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.visualizer.resize();
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
    }
    
    async togglePlayback() {
        if (this.isLoading) {
            this.showError('Audio is still loading. Please wait...');
            return;
        }
        
        if (!this.audioLoaded) {
            // First user gesture: load and play audio
            if (!this.hasUserInteracted) {
                this.hasUserInteracted = true;
                await this.loadDefaultAudio();
                // After loading, auto-play
                await this.togglePlayback();
                return;
            } else {
                this.showError('Audio not loaded yet. Please wait...');
                return;
            }
        }
        
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
    
    updateOrientation(azimuth, elevation, roll) {
        // Update audio engine
        this.audioEngine.updateSpatialPosition(azimuth, elevation, roll);
    }
    
    updateProgress(currentTime, duration) {
        const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
        this.elements.progressFill.style.width = `${progress}%`;
        this.elements.currentTime.textContent = this.formatTime(currentTime);
        this.elements.totalTime.textContent = this.formatTime(duration);
    }
    
    handlePlaybackEnded() {
        this.elements.playButton.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Play</span>';
        this.elements.playButton.classList.remove('playing');
        this.updateProgress(0, this.audioEngine.getDuration());
    }
    
    showLoading(message) {
        // Simple loading indicator
        console.log(message);
    }
    
    hideLoading() {
        // Hide loading indicator
        console.log('Loading complete');
    }
    
    showError(message) {
        // Simple error display
        console.error(message);
        alert(message);
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AmbisonicAudioApp();
});