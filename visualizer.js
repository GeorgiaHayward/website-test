class AudioVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;
        this.isRunning = false;
        
        // Audio data
        this.audioEngine = null;
        this.orientationHandler = null;
        
        // Visualization settings
        this.barWidth = 4;
        this.barSpacing = 1;
        this.barCount = 64;
        
        // Colors
        this.gradientColors = [
            '#667eea',
            '#764ba2',
            '#48bb78',
            '#f56565'
        ];
        
        // Spatial visualization
        this.spatialVisualization = true;
        this.listenerPosition = { x: 0, y: 0, z: 0 };
        this.sourcePosition = { x: 0, y: 0, z: 0 };
        
        this.setupCanvas();
        this.createGradients();
    }
    
    setupCanvas() {
        // Set up high DPI canvas
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Store actual drawing dimensions
        this.width = rect.width;
        this.height = rect.height;
    }
    
    createGradients() {
        // Create gradient for frequency bars
        this.frequencyGradient = this.ctx.createLinearGradient(0, this.height, 0, 0);
        this.frequencyGradient.addColorStop(0, this.gradientColors[0]);
        this.frequencyGradient.addColorStop(0.5, this.gradientColors[1]);
        this.frequencyGradient.addColorStop(1, this.gradientColors[2]);
        
        // Create gradient for spatial visualization
        this.spatialGradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, Math.min(this.width, this.height) / 2
        );
        this.spatialGradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
        this.spatialGradient.addColorStop(0.5, 'rgba(118, 75, 162, 0.6)');
        this.spatialGradient.addColorStop(1, 'rgba(72, 187, 120, 0.4)');
    }
    
    setAudioEngine(audioEngine) {
        this.audioEngine = audioEngine;
    }
    
    setOrientationHandler(orientationHandler) {
        this.orientationHandler = orientationHandler;
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.clear();
    }
    
    animate() {
        if (!this.isRunning) return;
        
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    draw() {
        this.clear();
        
        // Draw frequency spectrum
        this.drawFrequencySpectrum();
        
        // Draw spatial audio visualization
        if (this.spatialVisualization) {
            this.drawSpatialVisualization();
        }
        
        // Draw orientation indicator
        this.drawOrientationIndicator();
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    drawFrequencySpectrum() {
        if (!this.audioEngine) return;
        
        const frequencyData = this.audioEngine.getAnalyserData();
        if (!frequencyData) return;
        
        // Calculate bar dimensions
        const availableWidth = this.width * 0.8; // Leave 20% for margins
        const totalBarWidth = this.barWidth + this.barSpacing;
        const actualBarCount = Math.min(this.barCount, Math.floor(availableWidth / totalBarWidth));
        const startX = (this.width - (actualBarCount * totalBarWidth - this.barSpacing)) / 2;
        
        // Draw frequency bars
        for (let i = 0; i < actualBarCount; i++) {
            const dataIndex = Math.floor((i / actualBarCount) * frequencyData.length);
            const barHeight = (frequencyData[dataIndex] / 255) * this.height * 0.6;
            
            const x = startX + i * totalBarWidth;
            const y = this.height - barHeight;
            
            // Create bar gradient
            const barGradient = this.ctx.createLinearGradient(x, y + barHeight, x, y);
            barGradient.addColorStop(0, this.gradientColors[0]);
            barGradient.addColorStop(0.5, this.gradientColors[1]);
            barGradient.addColorStop(1, this.gradientColors[2]);
            
            this.ctx.fillStyle = barGradient;
            this.ctx.fillRect(x, y, this.barWidth, barHeight);
            
            // Add glow effect
            this.ctx.shadowColor = this.gradientColors[1];
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(x, y, this.barWidth, barHeight);
            this.ctx.shadowBlur = 0;
        }
    }
    
    drawSpatialVisualization() {
        if (!this.orientationHandler) return;
        
        const orientation = this.orientationHandler.getOrientation();
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) * 0.15;
        
        // Draw listener position (center)
        this.ctx.fillStyle = 'rgba(102, 126, 234, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw source position based on orientation
        const azimuthRad = orientation.azimuth * Math.PI / 180;
        const elevationRad = orientation.elevation * Math.PI / 180;
        
        const sourceX = centerX + radius * Math.sin(azimuthRad);
        const sourceY = centerY - radius * Math.sin(elevationRad);
        
        // Draw connection line
        this.ctx.strokeStyle = 'rgba(118, 75, 162, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(sourceX, sourceY);
        this.ctx.stroke();
        
        // Draw source position
        this.ctx.fillStyle = 'rgba(72, 187, 120, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(sourceX, sourceY, 6, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw orientation circle
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Draw cardinal directions
        this.drawCardinalDirections(centerX, centerY, radius + 20);
    }
    
    drawCardinalDirections(centerX, centerY, radius) {
        this.ctx.fillStyle = 'rgba(102, 126, 234, 0.7)';
        this.ctx.font = '12px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // North
        this.ctx.fillText('N', centerX, centerY - radius);
        
        // East
        this.ctx.fillText('E', centerX + radius, centerY);
        
        // South
        this.ctx.fillText('S', centerX, centerY + radius);
        
        // West
        this.ctx.fillText('W', centerX - radius, centerY);
    }
    
    drawOrientationIndicator() {
        if (!this.orientationHandler) return;
        
        const orientation = this.orientationHandler.getOrientation();
        const indicatorX = this.width - 60;
        const indicatorY = 40;
        const indicatorSize = 30;
        
        // Draw background circle
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(indicatorX, indicatorY, indicatorSize, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw orientation arrow
        this.ctx.save();
        this.ctx.translate(indicatorX, indicatorY);
        this.ctx.rotate(orientation.azimuth * Math.PI / 180);
        
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.9)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -indicatorSize * 0.7);
        this.ctx.lineTo(0, indicatorSize * 0.7);
        this.ctx.stroke();
        
        // Arrow head
        this.ctx.beginPath();
        this.ctx.moveTo(0, -indicatorSize * 0.7);
        this.ctx.lineTo(-8, -indicatorSize * 0.5);
        this.ctx.lineTo(8, -indicatorSize * 0.5);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(102, 126, 234, 0.9)';
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawWaveform(frequencyData) {
        if (!frequencyData) return;
        
        this.ctx.strokeStyle = 'rgba(72, 187, 120, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        const sliceWidth = this.width / frequencyData.length;
        let x = 0;
        
        for (let i = 0; i < frequencyData.length; i++) {
            const v = frequencyData[i] / 255;
            const y = (v * this.height) / 2;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        this.ctx.stroke();
    }
    
    // Handle canvas resize
    resize() {
        this.setupCanvas();
        this.createGradients();
    }
    
    // Toggle spatial visualization
    toggleSpatialVisualization() {
        this.spatialVisualization = !this.spatialVisualization;
    }
    
    // Update visualization settings
    updateSettings(settings) {
        if (settings.barWidth !== undefined) {
            this.barWidth = settings.barWidth;
        }
        if (settings.barCount !== undefined) {
            this.barCount = settings.barCount;
        }
        if (settings.spatialVisualization !== undefined) {
            this.spatialVisualization = settings.spatialVisualization;
        }
    }
}

// Export for use in other modules
window.AudioVisualizer = AudioVisualizer;