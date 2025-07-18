class OrientationHandler {
    constructor() {
        this.isEnabled = false;
        this.hasPermission = false;
        this.isSupported = false;
        
        // Current orientation values
        this.alpha = 0;   // Z-axis rotation (compass heading)
        this.beta = 0;    // X-axis rotation (tilt front/back)
        this.gamma = 0;   // Y-axis rotation (tilt left/right)
        
        // Processed values for spatial audio
        this.azimuth = 0;
        this.elevation = 0;
        this.roll = 0;
        
        // Calibration offset
        this.calibrationOffset = { alpha: 0, beta: 0, gamma: 0 };
        
        // Callbacks
        this.onOrientationChange = null;
        this.onPermissionChange = null;
        
        // Smoothing
        this.smoothingFactor = 0.8;
        this.lastValues = { azimuth: 0, elevation: 0, roll: 0 };
        
        this.checkSupport();
    }
    
    checkSupport() {
        // Check if device orientation is supported
        this.isSupported = 'DeviceOrientationEvent' in window;
        
        if (!this.isSupported) {
            console.warn('Device orientation not supported');
            return;
        }
        
        // Check if permission is required (iOS 13+)
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            console.log('Device orientation permission required');
        } else {
            console.log('Device orientation available without permission');
        }
    }
    
    async requestPermission() {
        if (!this.isSupported) {
            throw new Error('Device orientation not supported');
        }
        
        try {
            // Request permission for iOS 13+
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                const permission = await DeviceOrientationEvent.requestPermission();
                this.hasPermission = permission === 'granted';
                
                if (!this.hasPermission) {
                    throw new Error('Device orientation permission denied');
                }
            } else {
                // For other browsers, assume permission is granted
                this.hasPermission = true;
            }
            
            // Also request motion permission if available
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                await DeviceMotionEvent.requestPermission();
            }
            
            if (this.onPermissionChange) {
                this.onPermissionChange(this.hasPermission);
            }
            
            return this.hasPermission;
        } catch (error) {
            console.error('Failed to request orientation permission:', error);
            this.hasPermission = false;
            
            if (this.onPermissionChange) {
                this.onPermissionChange(this.hasPermission);
            }
            
            throw error;
        }
    }
    
    async enable() {
        if (!this.isSupported) {
            throw new Error('Device orientation not supported');
        }
        
        if (!this.hasPermission) {
            await this.requestPermission();
        }
        
        if (this.isEnabled) {
            return;
        }
        
        // Add event listeners
        window.addEventListener('deviceorientation', this.handleOrientation.bind(this), true);
        window.addEventListener('devicemotion', this.handleMotion.bind(this), true);
        
        this.isEnabled = true;
        console.log('Orientation tracking enabled');
    }
    
    disable() {
        if (!this.isEnabled) {
            return;
        }
        
        // Remove event listeners
        window.removeEventListener('deviceorientation', this.handleOrientation.bind(this), true);
        window.removeEventListener('devicemotion', this.handleMotion.bind(this), true);
        
        this.isEnabled = false;
        console.log('Orientation tracking disabled');
    }
    
    handleOrientation(event) {
        // Get raw orientation values
        this.alpha = event.alpha || 0;   // 0-360 degrees
        this.beta = event.beta || 0;     // -180 to 180 degrees
        this.gamma = event.gamma || 0;   // -90 to 90 degrees
        
        // Apply calibration offset
        const calibratedAlpha = this.alpha - this.calibrationOffset.alpha;
        const calibratedBeta = this.beta - this.calibrationOffset.beta;
        const calibratedGamma = this.gamma - this.calibrationOffset.gamma;
        
        // Convert to spatial audio coordinates
        this.processOrientation(calibratedAlpha, calibratedBeta, calibratedGamma);
    }
    
    handleMotion(event) {
        // Additional motion data can be used for more sophisticated processing
        if (event.rotationRate) {
            // Could use rotation rate for smoother interpolation
            // This is optional enhancement
        }
    }
    
    processOrientation(alpha, beta, gamma) {
        // Convert device orientation to spatial audio coordinates
        // This mapping depends on how you want the device orientation to affect the audio
        
        // Method 1: Direct mapping
        // Azimuth: use alpha (compass heading) - rotate left/right
        // Elevation: use beta (tilt) - tilt up/down
        // Roll: use gamma (roll) - roll left/right
        
        let newAzimuth = alpha;
        let newElevation = -beta; // Negative because device beta is opposite to audio elevation
        let newRoll = gamma;
        
        // Normalize angles
        newAzimuth = this.normalizeAngle(newAzimuth, -180, 180);
        newElevation = this.clampAngle(newElevation, -90, 90);
        newRoll = this.clampAngle(newRoll, -90, 90);
        
        // Apply smoothing
        this.azimuth = this.smoothValue(this.lastValues.azimuth, newAzimuth, this.smoothingFactor);
        this.elevation = this.smoothValue(this.lastValues.elevation, newElevation, this.smoothingFactor);
        this.roll = this.smoothValue(this.lastValues.roll, newRoll, this.smoothingFactor);
        
        // Store for next frame
        this.lastValues.azimuth = this.azimuth;
        this.lastValues.elevation = this.elevation;
        this.lastValues.roll = this.roll;
        
        // Notify listeners
        if (this.onOrientationChange) {
            this.onOrientationChange(this.azimuth, this.elevation, this.roll);
        }
    }
    
    calibrate() {
        // Store current orientation as calibration offset
        this.calibrationOffset.alpha = this.alpha;
        this.calibrationOffset.beta = this.beta;
        this.calibrationOffset.gamma = this.gamma;
        
        console.log('Orientation calibrated:', this.calibrationOffset);
    }
    
    resetCalibration() {
        this.calibrationOffset = { alpha: 0, beta: 0, gamma: 0 };
        console.log('Orientation calibration reset');
    }
    
    // Utility methods
    normalizeAngle(angle, min, max) {
        const range = max - min;
        while (angle < min) angle += range;
        while (angle > max) angle -= range;
        return angle;
    }
    
    clampAngle(angle, min, max) {
        return Math.max(min, Math.min(max, angle));
    }
    
    smoothValue(oldValue, newValue, factor) {
        // Handle angle wrapping for azimuth
        if (Math.abs(newValue - oldValue) > 180) {
            if (newValue > oldValue) {
                oldValue += 360;
            } else {
                newValue += 360;
            }
        }
        
        const smoothed = oldValue * factor + newValue * (1 - factor);
        return this.normalizeAngle(smoothed, -180, 180);
    }
    
    // Get current orientation values
    getOrientation() {
        return {
            azimuth: this.azimuth,
            elevation: this.elevation,
            roll: this.roll,
            raw: {
                alpha: this.alpha,
                beta: this.beta,
                gamma: this.gamma
            }
        };
    }
    
    // Set smoothing factor (0 = no smoothing, 1 = maximum smoothing)
    setSmoothingFactor(factor) {
        this.smoothingFactor = Math.max(0, Math.min(1, factor));
    }
    
    // Check if orientation is available and working
    isWorking() {
        return this.isSupported && this.hasPermission && this.isEnabled;
    }
    
    // Get status information
    getStatus() {
        return {
            supported: this.isSupported,
            hasPermission: this.hasPermission,
            enabled: this.isEnabled,
            working: this.isWorking()
        };
    }
}

// Export for use in other modules
window.OrientationHandler = OrientationHandler;