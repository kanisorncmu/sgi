// ========================================
// PART 2: 3D POINT RENDERING & VISUAL EFFECTS
// Add this code to Part 1 after the console.log line
// ========================================

class SentimentPoint {
    constructor(x, y, z, data) {
        this.originalPos = createVector(x, y, z);
        this.pos = this.originalPos.copy();
        this.data = data;
        this.color = sentimentColors[data.label_str];
        this.size = map(data.like_count, 0, 100, 3, 12);
        this.baseSize = this.size;
        this.glowSize = 0;
        this.opacity = 255;
        
        // Animation properties
        this.pulse = random(TWO_PI);
        this.orbitSpeed = random(0.001, 0.005);
        this.orbitRadius = random(2, 8);
        this.floatOffset = random(TWO_PI);
        this.rotationSpeed = random(0.01, 0.03);
        
        // Interaction properties
        this.isHovered = false;
        this.isSelected = false;
        this.targetSize = this.baseSize;
        this.intensity = Math.max(data.pos, data.neg, data.neu);
        
        // Clustering properties
        this.clusterId = this.assignCluster();
        this.connections = [];
        
        // Visual effects
        this.trailPoints = [];
        this.maxTrail = 5;
        this.sparkles = [];
    }
    
    assignCluster() {
        // Assign cluster based on sentiment and geographic location
        const lat = this.data.lat;
        const sentiment = this.data.label_str;
        
        if (lat > 16) return sentiment + '_north';
        else if (lat > 14) return sentiment + '_central';
        else return sentiment + '_south';
    }
    
    update() {
        // Orbital motion around original position
        const orbitX = sin(time * this.orbitSpeed) * this.orbitRadius;
        const orbitZ = cos(time * this.orbitSpeed) * this.orbitRadius;
        const floatY = sin(time * 0.02 + this.floatOffset) * 3;
        
        this.pos = createVector(
            this.originalPos.x + orbitX,
            this.originalPos.y + floatY,
            this.originalPos.z + orbitZ
        );
        
        // Update size based on interactions
        this.size = lerp(this.size, this.targetSize, 0.1);
        
        // Pulsing animation based on sentiment intensity
        const pulseFactor = 1 + sin(time * 0.05 + this.pulse) * this.intensity * 0.3;
        this.size = this.baseSize * pulseFactor;
        
        // Update trail
        this.updateTrail();
        
        // Update sparkles for highly liked posts
        if (this.data.like_count > 50) {
            this.updateSparkles();
        }
        
        // Check for hover state
        this.checkHover();
    }
    
    updateTrail() {
        // Add current position to trail
        this.trailPoints.push(this.pos.copy());
        
        // Limit trail length
        if (this.trailPoints.length > this.maxTrail) {
            this.trailPoints.shift();
        }
    }
    
    updateSparkles() {
        // Add new sparkles occasionally
        if (random() < 0.02) {
            const sparkle = {
                pos: createVector(
                    this.pos.x + random(-20, 20),
                    this.pos.y + random(-20, 20),
                    this.pos.z + random(-20, 20)
                ),
                life: 30,
                size: random(1, 3),
                color: this.color.slice()
            };
            this.sparkles.push(sparkle);
        }
        
        // Update existing sparkles
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const sparkle = this.sparkles[i];
            sparkle.life--;
            sparkle.size *= 0.98;
            
            if (sparkle.life <= 0) {
                this.sparkles.splice(i, 1);
            }
        }
    }
    
    checkHover() {
        // Get screen position for hover detection
        const screenPos = this.getScreenPosition();
        if (screenPos && screenPos.z > 0) { // Only check if in front of camera
            const distance = dist(mouseX, mouseY, screenPos.x, screenPos.y);
            const wasHovered = this.isHovered;
            this.isHovered = distance < 15;
            
            if (this.isHovered && !wasHovered) {
                this.onHoverStart();
            } else if (!this.isHovered && wasHovered) {
                this.onHoverEnd();
            }
        } else {
            this.isHovered = false;
        }
    }
    
    getScreenPosition() {
        // Project 3D position to screen coordinates
        const camX = sin(cameraAngleY) * cos(cameraAngleX) * cameraDistance;
        const camY = sin(cameraAngleX) * cameraDistance;
        const camZ = cos(cameraAngleY) * cos(cameraAngleX) * cameraDistance;
        
        // Simple projection calculation
        const dx = this.pos.x - camX;
        const dy = this.pos.y - camY;
        const dz = this.pos.z - camZ;
        
        if (dz > 0) {
            const scale = 500 / dz;
            return createVector(
                width / 2 + dx * scale,
                height / 2 - dy * scale,
                dz
            );
        }
        return null;
    }
    
    onHoverStart() {
        this.targetSize = this.baseSize * 1.5;
        this.glowSize = 25;
        hoveredPoint = this;
        
        // Show quick tooltip
        showQuickTooltip();
    }
    
    onHoverEnd() {
        this.targetSize = this.baseSize;
        this.glowSize = 0;
        if (hoveredPoint === this) {
            hoveredPoint = null;
        }
    }
    
    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        
        // Get display color based on view mode
        const displayColor = this.getDisplayColor();
        
        // Draw glow effect
        if (this.glowSize > 0 || this.isSelected) {
            const glowRadius = this.glowSize || 20;
            for (let i = 3; i > 0; i--) {
                const alpha = 30 / i;
                fill(displayColor[0], displayColor[1], displayColor[2], alpha);
                noStroke();
                sphere(this.size + glowRadius * i / 3);
            }
        }
        
        // Draw main point
        fill(displayColor[0], displayColor[1], displayColor[2], this.opacity);
        noStroke();
        sphere(this.size);
        
        // Draw point details for different view modes
        switch(viewMode) {
            case 0: this.drawSentimentDetails(); break;
            case 1: this.drawGeographicDetails(); break;
            case 2: this.drawTemporalDetails(); break;
            case 3: this.drawIntensityDetails(); break;
        }
        
        pop();
        
        // Draw external effects
        this.drawTrail();
        this.drawSparkles();
        this.drawConnections();
    }
    
    drawSentimentDetails() {
        // Draw sentiment-specific visual elements
        const sentiment = this.data.label_str;
        
        if (this.isHovered || this.isSelected) {
            // Draw sentiment spikes
            stroke(this.color[0], this.color[1], this.color[2], 150);
            strokeWeight(1);
            
            const spikeLength = this.size * 2;
            
            switch(sentiment) {
                case 'positive':
                    // Upward spikes for positive
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * TWO_PI / 6);
                        const x = cos(angle) * spikeLength * 0.5;
                        const z = sin(angle) * spikeLength * 0.5;
                        line(0, 0, 0, x, -spikeLength, z);
                    }
                    break;
                    
                case 'negative':
                    // Downward jagged spikes
                    for (let i = 0; i < 8; i++) {
                        const angle = (i * TWO_PI / 8);
                        const x = cos(angle) * spikeLength * 0.7;
                        const z = sin(angle) * spikeLength * 0.7;
                        line(0, 0, 0, x, spikeLength, z);
                    }
                    break;
                    
                case 'neutral':
                    // Horizontal ring
                    noFill();
                    stroke(this.color[0], this.color[1], this.color[2], 100);
                    strokeWeight(2);
                    rotateX(PI/2);
                    ellipse(0, 0, spikeLength * 2);
                    break;
            }
        }
    }
    
    drawGeographicDetails() {
        // Show province/district information
        if (this.isHovered) {
            fill(255);
            textAlign(CENTER);
            textSize(8);
            text(this.data.province, 0, this.size + 15);
        }
    }
    
    drawTemporalDetails() {
        // Show time-based visualization
        const dateValue = new Date(this.data.date).getTime();
        const normalizedTime = map(dateValue, Date.now() - 86400000 * 30, Date.now(), 0, 1);
        
        // Draw temporal rings
        if (normalizedTime > 0.8) {
            stroke(255, 255, 0, 100);
            strokeWeight(1);
            noFill();
            ellipse(0, 0, this.size * 3);
        }
    }
    
    drawIntensityDetails() {
        // Visual representation of sentiment intensity
        const rings = Math.floor(this.intensity * 5) + 1;
        
        for (let i = 0; i < rings; i++) {
            stroke(this.color[0], this.color[1], this.color[2], 50 - i * 10);
            strokeWeight(1);
            noFill();
            ellipse(0, 0, this.size * (2 + i));
        }
    }
    
    drawTrail() {
        // Draw motion trail
        if (this.trailPoints.length > 1) {
            stroke(this.color[0], this.color[1], this.color[2], 50);
            strokeWeight(1);
            noFill();
            
            beginShape();
            for (let i = 0; i < this.trailPoints.length; i++) {
                const point = this.trailPoints[i];
                const alpha = map(i, 0, this.trailPoints.length - 1, 10, 50);
                stroke(this.color[0], this.color[1], this.color[2], alpha);
                vertex(point.x, point.y, point.z);
            }
            endShape();
        }
    }
    
    drawSparkles() {
        // Draw sparkle effects for popular posts
        for (const sparkle of this.sparkles) {
            push();
            translate(sparkle.pos.x, sparkle.pos.y, sparkle.pos.z);
            
            const alpha = map(sparkle.life, 0, 30, 0, 255);
            fill(sparkle.color[0], sparkle.color[1], sparkle.color[2], alpha);
            noStroke();
            
            // Star shape
            beginShape(TRIANGLES);
            for (let i = 0; i < 8; i++) {
                const angle = (i * TWO_PI / 8);
                const radius = (i % 2 === 0) ? sparkle.size : sparkle.size * 0.5;
                const x = cos(angle) * radius;
                const y = sin(angle) * radius;
                vertex(x, y, 0);
                vertex(0, 0, 0);
                const nextAngle = ((i + 1) * TWO_PI / 8);
                const nextRadius = ((i + 1) % 2 === 0) ? sparkle.size : sparkle.size * 0.5;
                vertex(cos(nextAngle) * nextRadius, sin(nextAngle) * nextRadius, 0);
            }
            endShape();
            
            pop();
        }
    }
    
    drawConnections() {
        // Draw connections to nearby points in the same cluster
        if (showClusters) {
            for (const connection of this.connections) {
                const otherPoint = connection.point;
                const distance = p5.Vector.dist(this.pos, otherPoint.pos);
                
                if (distance < 50) {
                    const alpha = map(distance, 0, 50, 30, 5);
                    stroke(this.color[0], this.color[1], this.color[2], alpha);
                    strokeWeight(0.5);
                    line(this.pos.x, this.pos.y, this.pos.z,
                         otherPoint.pos.x, otherPoint.pos.y, otherPoint.pos.z);
                }
            }
        }
    }
    
    getDisplayColor() {
        switch(viewMode) {
            case 0: // Sentiment colors
                return this.color;
                
            case 1: // Geographic gradient
                const latNorm = map(this.data.lat, 13, 21, 0, 1);
                return [
                    255 * latNorm,
                    100 + 155 * (1 - latNorm),
                    100 + 155 * latNorm
                ];
                
            case 2: // Temporal colors
                const dateValue = new Date(this.data.date).getTime();
                const timeNorm = map(dateValue, Date.now() - 86400000 * 7, Date.now(), 0, 1);
                return [
                    255 * timeNorm,
                    255 * (1 - timeNorm),
                    100
                ];
                
            case 3: // Intensity colors
                const intensity = this.intensity;
                if (intensity > 0.8) return intensityColors.high;
                else if (intensity > 0.5) return intensityColors.medium;
                else return intensityColors.low;
                
            default:
                return this.color;
        }
    }
    
    onClick() {
        // Handle click interaction
        this.isSelected = !this.isSelected;
        selectedPoint = this.isSelected ? this : null;
        
        if (this.isSelected) {
            showDetailModal(this.data);
        }
        
        // Add click effect
        this.addClickEffect();
    }
    
    addClickEffect() {
        // Create expanding ring effect
        const ring = {
            pos: this.pos.copy(),
            radius: this.size,
            maxRadius: 50,
            alpha: 255,
            color: this.color.slice()
        };
        
        clickEffects.push(ring);
    }
}

// Background star field for atmosphere
class BackgroundStar {
    constructor(x, y, z) {
        this.pos = createVector(x, y, z);
        this.size = random(0.5, 2);
        this.brightness = random(50, 150);
        this.twinkle = random(TWO_PI);
        this.color = [
            random(150, 255),
            random(150, 255),
            random(200, 255)
        ];
    }
    
    update() {
        this.brightness = 80 + sin(time * 0.02 + this.twinkle) * 40;
        
        // Slow drift
        this.pos.x += sin(time * 0.001 + this.twinkle) * 0.1;
        this.pos.y += cos(time * 0.001 + this.twinkle) * 0.1;
    }
    
    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        
        fill(this.color[0], this.color[1], this.color[2], this.brightness);
        noStroke();
        sphere(this.size);
        
        // Add star spikes for brighter stars
        if (this.brightness > 120) {
            stroke(this.color[0], this.color[1], this.color[2], this.brightness * 0.7);
            strokeWeight(0.5);
            const spike = this.size * 3;
            line(-spike, 0, 0, spike, 0, 0);
            line(0, -spike, 0, 0, spike, 0);
        }
        
        pop();
    }
}

// Initialize background stars
function generateBackgroundStars(count = 800) {
    backgroundStars = [];
    for (let i = 0; i < count; i++) {
        const star = new BackgroundStar(
            random(-2000, 2000),
            random(-2000, 2000),
            random(-2000, 2000)
        );
        backgroundStars.push(star);
    }
}

// Click effects system
let clickEffects = [];

function updateClickEffects() {
    for (let i = clickEffects.length - 1; i >= 0; i--) {
        const effect = clickEffects[i];
        effect.radius += 2;
        effect.alpha -= 5;
        
        if (effect.alpha <= 0 || effect.radius >= effect.maxRadius) {
            clickEffects.splice(i, 1);
        }
    }
}

function drawClickEffects() {
    for (const effect of clickEffects) {
        push();
        translate(effect.pos.x, effect.pos.y, effect.pos.z);
        
        stroke(effect.color[0], effect.color[1], effect.color[2], effect.alpha);
        strokeWeight(2);
        noFill();
        
        // Draw expanding rings
        for (let i = 0; i < 3; i++) {
            const r = effect.radius + i * 10;
            const a = effect.alpha / (i + 1);
            stroke(effect.color[0], effect.color[1], effect.color[2], a);
            ellipse(0, 0, r);
        }
        
        pop();
    }
}

// Enhanced tooltip system
function showQuickTooltip() {
    if (!hoveredPoint) return;
    
    // This will be implemented in Part 3 with the interaction system
}

console.log('Part 2 loaded: 3D rendering and visual effects ready');
