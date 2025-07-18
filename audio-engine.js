class AmbisonicAudioEngine {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.source = null;
        this.gainNode = null;
        this.analyser = null;
        this.pannerNode = null;
        this.convolverNode = null;
        this.isPlaying = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.duration = 0;
        
        // Ambisonic processing nodes
        this.ambisonicDecoder = null;
        this.rotationMatrix = null;
        
        // Spatial audio parameters
        this.azimuth = 0;
        this.elevation = 0;
        this.roll = 0;
        
        // Callbacks
        this.onTimeUpdate = null;
        this.onEnded = null;
        
        this.initializeAudioContext();
    }
    
    async initializeAudioContext() {
        try {
            // Create audio context with optimal settings
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 48000,
                latencyHint: 'interactive'
            });
            
            // Resume context if suspended (required for mobile)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.setupAudioNodes();
            console.log('Audio context initialized successfully');
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            throw error;
        }
    }
    
    setupAudioNodes() {
        // Create gain node for volume control
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 0.7;
        
        // Create analyser for visualization
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
        
        // Create 3D panner for spatial audio
        this.pannerNode = this.audioContext.createPanner();
        this.pannerNode.panningModel = 'HRTF';
        this.pannerNode.distanceModel = 'inverse';
        this.pannerNode.refDistance = 1;
        this.pannerNode.maxDistance = 10000;
        this.pannerNode.rolloffFactor = 1;
        this.pannerNode.coneInnerAngle = 360;
        this.pannerNode.coneOuterAngle = 0;
        this.pannerNode.coneOuterGain = 0;
        
        // Set listener position
        if (this.audioContext.listener.positionX) {
            // Modern browsers
            this.audioContext.listener.positionX.value = 0;
            this.audioContext.listener.positionY.value = 0;
            this.audioContext.listener.positionZ.value = 0;
            this.audioContext.listener.forwardX.value = 0;
            this.audioContext.listener.forwardY.value = 0;
            this.audioContext.listener.forwardZ.value = -1;
            this.audioContext.listener.upX.value = 0;
            this.audioContext.listener.upY.value = 1;
            this.audioContext.listener.upZ.value = 0;
        } else {
            // Fallback for older browsers
            this.audioContext.listener.setPosition(0, 0, 0);
            this.audioContext.listener.setOrientation(0, 0, -1, 0, 1, 0);
        }
        
        // Connect nodes
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.pannerNode);
        this.pannerNode.connect(this.audioContext.destination);
    }
    
    async loadAudioFile(file) {
        try {
            // Resume context if needed
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.duration = this.audioBuffer.duration;
            
            console.log(`Audio loaded: ${this.audioBuffer.numberOfChannels} channels, ${this.audioBuffer.sampleRate}Hz, ${this.duration.toFixed(2)}s`);
            
            // Check if it's likely an ambisonic file (4+ channels)
            if (this.audioBuffer.numberOfChannels >= 4) {
                this.setupAmbisonicDecoding();
            }
            
            return {
                duration: this.duration,
                sampleRate: this.audioBuffer.sampleRate,
                channels: this.audioBuffer.numberOfChannels
            };
        } catch (error) {
            console.error('Failed to load audio file:', error);
            throw error;
        }
    }
    
    setupAmbisonicDecoding() {
        // For true ambisonic decoding, we would need a proper decoder
        // This is a simplified implementation that processes the first 4 channels
        // In a real implementation, you'd use libraries like JSAmbisonics or Omnitone
        console.log('Setting up ambisonic decoding for', this.audioBuffer.numberOfChannels, 'channels');
        
        // Create a simple matrix for basic ambisonic rotation
        this.rotationMatrix = this.createRotationMatrix(0, 0, 0);
    }
    
    createRotationMatrix(azimuth, elevation, roll) {
        // Convert degrees to radians
        const az = azimuth * Math.PI / 180;
        const el = elevation * Math.PI / 180;
        const rl = roll * Math.PI / 180;
        
        // Create rotation matrices
        const cosAz = Math.cos(az);
        const sinAz = Math.sin(az);
        const cosEl = Math.cos(el);
        const sinEl = Math.sin(el);
        const cosRl = Math.cos(rl);
        const sinRl = Math.sin(rl);
        
        // Simplified rotation matrix for basic ambisonic rotation
        return {
            azimuth: az,
            elevation: el,
            roll: rl,
            cosAz, sinAz, cosEl, sinEl, cosRl, sinRl
        };
    }
    
    updateSpatialPosition(azimuth, elevation, roll = 0) {
        this.azimuth = azimuth;
        this.elevation = elevation;
        this.roll = roll;
        
        // Update rotation matrix
        this.rotationMatrix = this.createRotationMatrix(azimuth, elevation, roll);
        
        // Convert spherical coordinates to Cartesian for the panner
        const azRad = azimuth * Math.PI / 180;
        const elRad = elevation * Math.PI / 180;
        
        // Calculate 3D position
        const distance = 5; // Fixed distance from listener
        const x = distance * Math.cos(elRad) * Math.sin(azRad);
        const y = distance * Math.sin(elRad);
        const z = distance * Math.cos(elRad) * Math.cos(azRad);
        
        // Update panner position
        if (this.pannerNode) {
            if (this.pannerNode.positionX) {
                // Modern browsers
                this.pannerNode.positionX.value = x;
                this.pannerNode.positionY.value = y;
                this.pannerNode.positionZ.value = z;
            } else {
                // Fallback for older browsers
                this.pannerNode.setPosition(x, y, z);
            }
        }
        
        // Update listener orientation for ambisonic content
        if (this.audioContext.listener.forwardX) {
            // Modern browsers
            this.audioContext.listener.forwardX.value = Math.sin(azRad);
            this.audioContext.listener.forwardY.value = Math.sin(elRad);
            this.audioContext.listener.forwardZ.value = -Math.cos(azRad) * Math.cos(elRad);
            
            // Update up vector based on roll
            this.audioContext.listener.upX.value = Math.sin(roll * Math.PI / 180);
            this.audioContext.listener.upY.value = Math.cos(roll * Math.PI / 180);
            this.audioContext.listener.upZ.value = 0;
        } else {
            // Fallback for older browsers
            this.audioContext.listener.setOrientation(
                Math.sin(azRad), Math.sin(elRad), -Math.cos(azRad) * Math.cos(elRad),
                Math.sin(roll * Math.PI / 180), Math.cos(roll * Math.PI / 180), 0
            );
        }
    }
    
    async play() {
        if (!this.audioBuffer) {
            throw new Error('No audio buffer loaded');
        }
        
        if (this.isPlaying) {
            return;
        }
        
        // Resume context if needed
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        // Create new source
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.audioBuffer;
        this.source.loop = false;
        
        // Connect source to processing chain
        this.source.connect(this.gainNode);
        
        // Set up ended callback
        this.source.onended = () => {
            this.isPlaying = false;
            this.startTime = 0;
            this.pauseTime = 0;
            if (this.onEnded) {
                this.onEnded();
            }
        };
        
        // Start playback
        const offset = this.pauseTime;
        this.source.start(0, offset);
        this.startTime = this.audioContext.currentTime - offset;
        this.isPlaying = true;
        
        // Start time updates
        this.startTimeUpdates();
    }
    
    stop() {
        if (this.source && this.isPlaying) {
            this.source.stop();
            this.source = null;
            this.isPlaying = false;
            this.startTime = 0;
            this.pauseTime = 0;
            this.stopTimeUpdates();
        }
    }
    
    pause() {
        if (this.source && this.isPlaying) {
            this.pauseTime = this.audioContext.currentTime - this.startTime;
            this.source.stop();
            this.source = null;
            this.isPlaying = false;
            this.stopTimeUpdates();
        }
    }
    
    setVolume(volume) {
        if (this.gainNode) {
            // Use exponential scaling for more natural volume control
            this.gainNode.gain.value = volume * volume;
        }
    }
    
    getCurrentTime() {
        if (this.isPlaying) {
            return this.audioContext.currentTime - this.startTime;
        }
        return this.pauseTime;
    }
    
    getDuration() {
        return this.duration;
    }
    
    getAnalyserData() {
        if (!this.analyser) return null;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        
        return dataArray;
    }
    
    startTimeUpdates() {
        this.timeUpdateInterval = setInterval(() => {
            if (this.onTimeUpdate && this.isPlaying) {
                this.onTimeUpdate(this.getCurrentTime(), this.duration);
            }
        }, 100);
    }
    
    stopTimeUpdates() {
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
        }
    }
    
    // Utility methods
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Cleanup
    dispose() {
        this.stop();
        this.stopTimeUpdates();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Export for use in other modules
window.AmbisonicAudioEngine = AmbisonicAudioEngine;