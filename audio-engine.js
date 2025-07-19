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
            console.log('AudioEngine: Initializing audio context...');
            
            // Create audio context with optimal settings
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 48000,
                latencyHint: 'interactive'
            });
            
            console.log('AudioEngine: Audio context created, state:', this.audioContext.state);
            
            // Resume context if suspended (required for mobile)
            if (this.audioContext.state === 'suspended') {
                console.log('AudioEngine: Resuming suspended audio context...');
                await this.audioContext.resume();
                console.log('AudioEngine: Audio context resumed, new state:', this.audioContext.state);
            }
            
            this.setupAudioNodes();
            console.log('AudioEngine: Audio context initialized successfully');
        } catch (error) {
            console.error('AudioEngine: Failed to initialize audio context:', error);
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
    
    async createTestTone() {
        try {
            // Resume context if needed
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            console.log('Attempting to load Ambisonic Audio.flac...');
            
            // Load the specific ambisonic audio file with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for large file
            
            console.log('Starting fetch with 60 second timeout...');
            
            let response;
            try {
                response = await fetch('Ambisonic%20Audio.flac', {
                    signal: controller.signal
                });
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                throw new Error(`Fetch failed: ${fetchError.message}`);
            }
            
            clearTimeout(timeoutId);
            console.log('Fetch response status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`Failed to load audio file: ${response.status} ${response.statusText}`);
            }
            
            console.log('Audio file fetched successfully, decoding...');
            const arrayBuffer = await response.arrayBuffer();
            console.log('Array buffer size:', arrayBuffer.byteLength, 'bytes');
            
            console.log('Starting audio decoding...');
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.duration = this.audioBuffer.duration;
            
            console.log(`Audio loaded: ${this.audioBuffer.numberOfChannels} channels, ${this.audioBuffer.sampleRate}Hz, ${this.duration.toFixed(2)}s`);
            
            // Set up ambisonic processing
            this.setupAmbisonicDecoding();
            
            return {
                duration: this.duration,
                sampleRate: this.audioBuffer.sampleRate,
                channels: this.audioBuffer.numberOfChannels
            };
        } catch (error) {
            console.error('Failed to load ambisonic audio file:', error);
            
            // Fallback: Create a test tone if the file loading fails
            console.log('Creating fallback test tone...');
            return this.createFallbackTestTone();
        }
    }
    
    createFallbackTestTone() {
        try {
            console.log('Creating enhanced fallback test tone...');
            
            // Create a 10-second ambisonic test tone
            const duration = 10;
            const sampleRate = this.audioContext.sampleRate;
            const length = duration * sampleRate;
            
            // Create a 4-channel ambisonic buffer (B-format: W, X, Y, Z)
            this.audioBuffer = this.audioContext.createBuffer(4, length, sampleRate);
            this.duration = duration;
            
            // Enhanced frequencies with more dramatic separation
            const frequencies = [220, 440, 880, 1320]; // A3, A4, A5, E6 - more spread
            const amplitudes = [0.4, 0.35, 0.3, 0.25]; // Different amplitudes per channel
            
            // Generate test tones for each channel with enhanced spatial characteristics
            for (let channel = 0; channel < 4; channel++) {
                const channelData = this.audioBuffer.getChannelData(channel);
                const frequency = frequencies[channel];
                const amplitude = amplitudes[channel];
                
                for (let i = 0; i < length; i++) {
                    const time = i / sampleRate;
                    
                    // Base tone with enhanced amplitude
                    const tone = amplitude * Math.sin(2 * Math.PI * frequency * time);
                    
                    // Enhanced harmonics for richer spatial sound
                    const harmonic1 = 0.15 * Math.sin(2 * Math.PI * frequency * 2 * time);
                    const harmonic2 = 0.1 * Math.sin(2 * Math.PI * frequency * 3 * time);
                    const harmonic3 = 0.05 * Math.sin(2 * Math.PI * frequency * 4 * time);
                    
                    // Enhanced spatial movement with different patterns per channel
                    const spatialMod1 = 0.12 * Math.sin(2 * Math.PI * 0.3 * time + channel * Math.PI / 2);
                    const spatialMod2 = 0.08 * Math.sin(2 * Math.PI * 0.7 * time + channel * Math.PI);
                    
                    // Add channel-specific modulation for more dramatic separation
                    const channelMod = 0.1 * Math.sin(2 * Math.PI * (0.2 + channel * 0.1) * time);
                    
                    channelData[i] = tone + harmonic1 + harmonic2 + harmonic3 + spatialMod1 + spatialMod2 + channelMod;
                }
            }
            
            console.log(`Enhanced fallback test tone created: ${this.audioBuffer.numberOfChannels} channels, ${sampleRate}Hz, ${duration.toFixed(2)}s`);
            
            // Set up ambisonic processing
            this.setupAmbisonicDecoding();
            
            return {
                duration: this.duration,
                sampleRate: sampleRate,
                channels: this.audioBuffer.numberOfChannels
            };
        } catch (error) {
            console.error('Failed to create enhanced fallback test tone:', error);
            throw error;
        }
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
        
        // Enhanced spatial positioning with more dramatic effects
        const azRad = azimuth * Math.PI / 180;
        const elRad = elevation * Math.PI / 180;
        
        // More dramatic distance variation based on orientation
        const baseDistance = 3;
        const distanceVariation = 2 * Math.sin(azRad * 2); // Creates more movement
        const distance = baseDistance + distanceVariation;
        
        // Enhanced 3D position calculation with more dramatic movement
        const x = distance * Math.cos(elRad) * Math.sin(azRad);
        const y = distance * Math.sin(elRad) * 1.5; // Amplify elevation effect
        const z = distance * Math.cos(elRad) * Math.cos(azRad);
        
        // Update panner position with enhanced effects
        if (this.pannerNode) {
            if (this.pannerNode.positionX) {
                // Modern browsers - more dramatic positioning
                this.pannerNode.positionX.value = x * 1.5; // Amplify horizontal movement
                this.pannerNode.positionY.value = y * 1.5; // Amplify vertical movement
                this.pannerNode.positionZ.value = z * 1.5; // Amplify depth movement
                
                // Enhanced cone angles for more dramatic spatial effects
                this.pannerNode.coneInnerAngle = 30; // Narrower inner cone
                this.pannerNode.coneOuterAngle = 90; // Wider outer cone
                this.pannerNode.coneOuterGain = 0.3; // More dramatic falloff
            } else {
                // Fallback for older browsers
                this.pannerNode.setPosition(x * 1.5, y * 1.5, z * 1.5);
            }
        }
        
        // Enhanced listener orientation for more dramatic ambisonic effects
        if (this.audioContext.listener.forwardX) {
            // Modern browsers - more dramatic listener orientation
            this.audioContext.listener.forwardX.value = Math.sin(azRad) * 1.2;
            this.audioContext.listener.forwardY.value = Math.sin(elRad) * 1.2;
            this.audioContext.listener.forwardZ.value = -Math.cos(azRad) * Math.cos(elRad) * 1.2;
            
            // Enhanced up vector based on roll with more dramatic effect
            this.audioContext.listener.upX.value = Math.sin(roll * Math.PI / 180) * 1.5;
            this.audioContext.listener.upY.value = Math.cos(roll * Math.PI / 180) * 1.5;
            this.audioContext.listener.upZ.value = 0;
        } else {
            // Fallback for older browsers
            this.audioContext.listener.setOrientation(
                Math.sin(azRad) * 1.2,
                Math.sin(elRad) * 1.2,
                -Math.cos(azRad) * Math.cos(elRad) * 1.2,
                Math.sin(roll * Math.PI / 180) * 1.5,
                Math.cos(roll * Math.PI / 180) * 1.5,
                0
            );
        }
        
        // Apply additional gain modulation based on orientation for more dramatic effect
        if (this.gainNode) {
            const orientationGain = 0.7 + 0.3 * Math.cos(azRad) * Math.cos(elRad);
            this.gainNode.gain.value = Math.max(0.3, Math.min(1.0, orientationGain));
        }
    }
    
    async play() {
        if (!this.audioBuffer) {
            throw new Error('No audio loaded');
        }
        
        try {
            // Resume context if needed
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Stop any existing playback
            if (this.source) {
                this.source.stop();
            }
            
            // Create new source
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = this.audioBuffer;
            
            // Connect source to gain node
            this.source.connect(this.gainNode);
            
            // Set up ended callback
            this.source.onended = () => {
                this.isPlaying = false;
                if (this.onEnded) {
                    this.onEnded();
                }
            };
            
            // Calculate start time
            const now = this.audioContext.currentTime;
            const startTime = this.pauseTime > 0 ? now - this.pauseTime : now;
            
            // Start playback
            this.source.start(0, this.pauseTime > 0 ? this.pauseTime : 0);
            this.isPlaying = true;
            this.startTime = startTime;
            
            // Start time updates
            this.startTimeUpdates();
            
            console.log('Playback started');
            
        } catch (error) {
            console.error('Failed to start playback:', error);
            throw error;
        }
    }
    
    stop() {
        if (this.source) {
            this.source.stop();
            this.source = null;
        }
        this.isPlaying = false;
        this.pauseTime = 0;
        this.stopTimeUpdates();
        
        // Reset progress
        if (this.onTimeUpdate) {
            this.onTimeUpdate(0, this.duration);
        }
    }
    
    pause() {
        if (this.source && this.isPlaying) {
            this.source.stop();
            this.source = null;
            this.isPlaying = false;
            this.pauseTime = this.getCurrentTime();
            this.stopTimeUpdates();
        }
    }
    
    setVolume(volume) {
        if (this.gainNode) {
            this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
    
    getCurrentTime() {
        if (!this.isPlaying || !this.source) {
            return this.pauseTime;
        }
        return this.audioContext.currentTime - this.startTime;
    }
    
    getDuration() {
        return this.duration;
    }
    
    getAnalyserData() {
        if (!this.analyser) return null;
        
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }
    
    startTimeUpdates() {
        this.stopTimeUpdates();
        this.timeUpdateInterval = setInterval(() => {
            if (this.isPlaying && this.onTimeUpdate) {
                const currentTime = this.getCurrentTime();
                this.onTimeUpdate(currentTime, this.duration);
            }
        }, 100);
    }
    
    stopTimeUpdates() {
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    dispose() {
        this.stop();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Export for use in other modules
window.AmbisonicAudioEngine = AmbisonicAudioEngine;