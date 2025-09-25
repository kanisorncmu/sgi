// ========================================
// PART 3: INTERACTION SYSTEM & COMPLETE INTEGRATION
// Add this code after Part 2 to complete the visualization
// ========================================

// Enhanced camera and interaction system
function draw() {
    if (isLoading) return;
    
    background(5, 5, 15);
    time++;
    
    // Update camera
    updateCamera();
    
    // Set up 3D lighting
    setupLighting();
    
    // Auto rotation
    if (autoRotate && !isDragging) {
        cameraAngleY += 0.002;
    }
    
    // Apply camera transformation
    rotateX(cameraAngleX);
    rotateY(cameraAngleY);
    
    // Draw background stars
    for (const star of backgroundStars) {
        star.update();
        star.display();
    }
    
    // Update and draw all data points
    hoveredPoint = null;
    for (const point of dataPoints) {
        point.update();
        point.display();
    }
    
    // Draw cluster connections if enabled
    if (showClusters) {
        drawClusterConnections();
    }
    
    // Update and draw click effects
    updateClickEffects();
    drawClickEffects();
    
    // Draw UI elements
    drawUI();
}

function setupLighting() {
    // Ambient light for general illumination
    ambientLight(30, 30, 50);
    
    // Directional lights for depth
    directionalLight(100, 150, 200, -0.5, 0.5, -1);
    directionalLight(80, 100, 150, 0.5, -0.3, 1);
    
    // Point lights for dramatic effect
    pointLight(200, 100, 255, 0, -300, 200);
    pointLight(100, 200, 255, 300, 100, -200);
}

function updateCamera() {
    // Smooth zoom transition
    cameraDistance = lerp(cameraDistance, targetCameraDistance, 0.05);
    
    // Calculate camera position
    const camX = sin(cameraAngleY) * cos(cameraAngleX) * cameraDistance;
    const camY = sin(cameraAngleX) * cameraDistance;
    const camZ = cos(cameraAngleY) * cos(cameraAngleX) * cameraDistance;
    
    camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
}

function drawClusterConnections() {
    // Draw connections between points in the same cluster
    const connectionDistance = 60;
    const maxConnections = 3;
    
    for (let i = 0; i < dataPoints.length; i += 5) { // Sample every 5th point for performance
        const point = dataPoints[i];
        let connections = 0;
        
        for (let j = i + 1; j < dataPoints.length && connections < maxConnections; j += 5) {
            const other = dataPoints[j];
            
            // Only connect points in the same sentiment cluster
            if (point.clusterId === other.clusterId) {
                const distance = p5.Vector.dist(point.pos, other.pos);
                
                if (distance < connectionDistance) {
                    const alpha = map(distance, 0, connectionDistance, 40, 5);
                    const color = point.getDisplayColor();
                    
                    stroke(color[0], color[1], color[2], alpha);
                    strokeWeight(0.3);
                    line(
                        point.pos.x, point.pos.y, point.pos.z,
                        other.pos.x, other.pos.y, other.pos.z
                    );
                    connections++;
                }
            }
        }
    }
}

function drawUI() {
    // Draw 2D UI elements over the 3D scene
    camera(); // Reset to 2D mode
    
    // Draw hover tooltip
    if (hoveredPoint) {
        drawHoverTooltip();
    }
    
    // Draw zoom indicator
    drawZoomIndicator();
    
    // Draw coordinate system reference
    drawCoordinateReference();
    
    // Draw performance stats
    drawPerformanceStats();
}

function drawHoverTooltip() {
    const data = hoveredPoint.data;
    
    // Position tooltip near mouse
    const tooltipX = mouseX + 15;
    const tooltipY = mouseY - 10;
    
    // Tooltip background
    push();
    fill(0, 0, 0, 220);
    stroke(0, 255, 255, 150);
    strokeWeight(1);
    
    const tooltipWidth = 280;
    const tooltipHeight = 120;
    
    rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
    
    // Tooltip content
    fill(255);
    noStroke();
    textSize(11);
    textAlign(LEFT);
    
    text(`📍 ${data.province}, ${data.district}`, tooltipX + 10, tooltipY + 20);
    text(`💭 Sentiment: ${data.label_str.toUpperCase()}`, tooltipX + 10, tooltipY + 35);
    text(`📊 Confidence: ${(hoveredPoint.intensity * 100).toFixed(1)}%`, tooltipX + 10, tooltipY + 50);
    text(`❤️ Likes: ${data.like_count}`, tooltipX + 10, tooltipY + 65);
    
    // Truncate long text
    const displayText = data.text.length > 35 ? 
                       data.text.substring(0, 35) + '...' : data.text;
    text(`💬 "${displayText}"`, tooltipX + 10, tooltipY + 80);
    
    text(`📅 ${data.date.toLocaleDateString()}`, tooltipX + 10, tooltipY + 95);
    
    pop();
}

function drawZoomIndicator() {
    const zoomPercent = Math.round(((1200 - cameraDistance) / 1000) * 100);
    
    push();
    fill(0, 255, 255, 180);
    noStroke();
    textAlign(LEFT);
    textSize(12);
    text(`🔍 Zoom: ${zoomPercent}%`, 20, height - 80);
    
    // View mode indicator
    const modes = ['Sentiment', 'Geographic', 'Temporal', 'Intensity'];
    text(`👁️ Mode: ${modes[viewMode]}`, 20, height - 60);
    
    // Point count
    text(`📊 Points: ${dataPoints.length.toLocaleString()}`, 20, height - 40);
    pop();
}

function drawCoordinateReference() {
    // Draw a small 3D coordinate system reference in the corner
    push();
    translate(width - 80, height - 80);
    
    // X axis - Red
    stroke(255, 100, 100);
    strokeWeight(3);
    line(0, 0, 20, 0);
    fill(255, 100, 100);
    noStroke();
    textSize(10);
    text('X', 25, 5);
    
    // Y axis - Green  
    stroke(100, 255, 100);
    strokeWeight(3);
    line(0, 0, 0, -20);
    fill(100, 255, 100);
    noStroke();
    text('Y', 5, -25);
    
    // Z axis - Blue (simulated)
    stroke(100, 100, 255);
    strokeWeight(3);
    line(0, 0, -14, 14);
    fill(100, 100, 255);
    noStroke();
    text('Z', -25, 20);
    
    pop();
}

function drawPerformanceStats() {
    if (frameCount % 60 === 0) { // Update every second
        const fps = Math.round(frameRate());
        
        push();
        fill(0, 255, 255, 120);
        noStroke();
        textAlign(RIGHT);
        textSize(10);
        text(`FPS: ${fps}`, width - 20, 30);
        pop();
    }
}

// ========================================
// INTERACTION HANDLERS
// ========================================

function mousePressed() {
    // Check if clicking on a data point
    let clickedPoint = null;
    let minDistance = Infinity;
    
    for (const point of dataPoints) {
        const screenPos = point.getScreenPosition();
        if (screenPos && screenPos.z > 0) {
            const distance = dist(mouseX, mouseY, screenPos.x, screenPos.y);
            if (distance < 15 && distance < minDistance) {
                minDistance = distance;
                clickedPoint = point;
            }
        }
    }
    
    if (clickedPoint) {
        clickedPoint.onClick();
    } else {
        // Start camera dragging
        isDragging = true;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        document.body.classList.add('dragging');
    }
}

function mouseDragged() {
    if (isDragging) {
        const deltaX = mouseX - lastMouseX;
        const deltaY = mouseY - lastMouseY;
        
        cameraAngleY += deltaX * 0.008;
        cameraAngleX -= deltaY * 0.008;
        
        // Constrain vertical rotation
        cameraAngleX = constrain(cameraAngleX, -PI/2 + 0.1, PI/2 - 0.1);
        
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

function mouseReleased() {
    isDragging = false;
    document.body.classList.remove('dragging');
}

function handleZoom(event) {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 1.08 : 0.92;
    targetCameraDistance = constrain(targetCameraDistance * zoomFactor, 200, 2500);
}

function keyPressed() {
    switch(key) {
        case ' ':
            resetView();
            break;
        case 'r':
        case 'R':
            toggleRotation();
            break;
        case 'c':
        case 'C':
            toggleClusters();
            break;
        case 'v':
        case 'V':
            changeViewMode();
            break;
        case 'e':
        case 'E':
            exportView();
            break;
        case '1':
            focusOnSentiment('positive');
            break;
        case '2':
            focusOnSentiment('neutral');
            break;
        case '3':
            focusOnSentiment('negative');
            break;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// ========================================
// CONTROL FUNCTIONS
// ========================================

function resetView() {
    targetCameraDistance = 1000;
    cameraAngleX = 0;
    cameraAngleY = 0;
    autoRotate = true;
    
    // Reset all point selections
    for (const point of dataPoints) {
        point.isSelected = false;
    }
    selectedPoint = null;
    closeModal();
}

function toggleRotation() {
    autoRotate = !autoRotate;
}

function toggleClusters() {
    showClusters = !showClusters;
}

function changeViewMode() {
    viewMode = (viewMode + 1) % 4;
    
    // Update stats panel to show current mode
    const modes = ['Sentiment Analysis', 'Geographic Distribution', 'Temporal Analysis', 'Intensity Mapping'];
    console.log(`View Mode: ${modes[viewMode]}`);
}

function focusOnSentiment(sentimentType) {
    // Highlight and focus on specific sentiment type
    for (const point of dataPoints) {
        if (point.data.label_str === sentimentType) {
            point.targetSize = point.baseSize * 1.3;
            point.opacity = 255;
        } else {
            point.targetSize = point.baseSize * 0.5;
            point.opacity = 100;
        }
    }
    
    // Auto-zoom to fit the selected sentiment cluster
    setTimeout(() => {
        targetCameraDistance = 800;
    }, 500);
}

function exportView() {
    // Export current view as image
    saveCanvas('sentiment_3d_view', 'png');
    
    // Also save data summary
    const summary = {
        timestamp: new Date().toISOString(),
        viewMode: viewMode,
        totalPoints: dataPoints.length,
        cameraDistance: cameraDistance,
        cameraAngles: { x: cameraAngleX, y: cameraAngleY },
        sentimentBreakdown: stats.sentimentCounts
    };
    
    console.log('View exported:', summary);
}

// ========================================
// MODAL SYSTEM FOR DETAILED VIEW
// ========================================

function showDetailModal(data) {
    const modal = document.getElementById('detailModal');
    const backdrop = document.getElementById('modalBackdrop');
    const content = document.getElementById('modalContent');
    
    // Create detailed content
    const sentiment = data.label_str;
    const sentimentEmoji = {
        positive: '😊',
        neutral: '😐',
        negative: '😞'
    };
    
    const confidenceColor = data.pos > 0.7 ? 'color: #00ff88' :
                           data.neg > 0.7 ? 'color: #ff0080' : 'color: #888888';
    
    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #00ffff; margin: 0;">
                ${sentimentEmoji[sentiment]} Sentiment Analysis Detail
            </h2>
            <div style="color: #888; font-size: 12px; margin-top: 5px;">
                Reaction ID: #${data.id || 'N/A'}
            </div>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong style="color: #00ffff;">📝 Content:</strong><br>
            <div style="font-style: italic; margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px;">
                "${data.text}"
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div>
                <strong style="color: #00ffff;">📍 Location:</strong><br>
                Province: ${data.province}<br>
                District: ${data.district}<br>
                Coordinates: ${data.lat.toFixed(4)}, ${data.lon.toFixed(4)}
            </div>
            <div>
                <strong style="color: #00ffff;">📊 Metrics:</strong><br>
                Likes: ❤️ ${data.like_count}<br>
                Date: 📅 ${data.date.toLocaleDateString()}<br>
                Time: ⏰ ${data.date.toLocaleTimeString()}
            </div>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 15px 0;">
            <strong style="color: #00ffff;">🧠 AI Analysis:</strong><br>
            <div style="margin: 10px 0;">
                Primary Sentiment: <span style="${confidenceColor}; font-weight: bold;">
                    ${sentiment.toUpperCase()}
                </span>
            </div>
            
            <div style="margin: 10px 0; font-size: 12px;">
                <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>😊 Positive:</span>
                    <span style="color: #00ff88;">${(data.pos * 100).toFixed(1)}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>😐 Neutral:</span>
                    <span style="color: #888888;">${(data.neu * 100).toFixed(1)}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>😞 Negative:</span>
                    <span style="color: #ff0080;">${(data.neg * 100).toFixed(1)}%</span>
                </div>
            </div>
            
            <div style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 5px; margin-top: 10px; font-size: 11px; color: #aaa;">
                Confidence Level: ${((Math.max(data.pos, data.neu, data.neg)) * 100).toFixed(1)}% | 
                Model Certainty: ${data.pos > 0.8 || data.neg > 0.8 ? 'High' : data.pos > 0.6 || data.neg > 0.6 ? 'Medium' : 'Low'}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    backdrop.style.display = 'block';
}

function closeModal() {
    document.getElementById('detailModal').style.display = 'none';
    document.getElementById('modalBackdrop').style.display = 'none';
    
    // Deselect all points
    if (selectedPoint) {
        selectedPoint.isSelected = false;
        selectedPoint = null;
    }
}

// ========================================
// INITIALIZATION AND SETUP
// ========================================

// Initialize the visualization once data is loaded
function initializeVisualization() {
    // Generate background stars
    generateBackgroundStars(1000);
    
    // Build cluster connections for performance
    buildClusterConnections();
    
    console.log('3D Sentiment Visualization initialized successfully!');
    console.log(`Loaded ${dataPoints.length} data points`);
    console.log(`Generated ${backgroundStars.length} background stars`);
}

function buildClusterConnections() {
    // Pre-calculate cluster connections for better performance
    const clusters = {};
    
    // Group points by cluster
    for (const point of dataPoints) {
        if (!clusters[point.clusterId]) {
            clusters[point.clusterId] = [];
        }
        clusters[point.clusterId].push(point);
    }
    
    // Build connections within each cluster
    for (const clusterName in clusters) {
        const clusterPoints = clusters[clusterName];
        
        for (let i = 0; i < clusterPoints.length; i++) {
            const point = clusterPoints[i];
            
            // Connect to nearest neighbors in cluster
            const distances = clusterPoints
                .filter(p => p !== point)
                .map(p => ({
                    point: p,
                    distance: p5.Vector.dist(point.originalPos, p.originalPos)
                }))
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 3); // Keep only 3 nearest neighbors
            
            point.connections = distances;
        }
    }
}

// Call initialization after data is loaded
setTimeout(() => {
    if (!isLoading && dataPoints.length > 0) {
        initializeVisualization();
    }
}, 1000);

console.log('Part 3 loaded: Complete interaction system ready');
console.log('🎉 3D Sentiment Drilldown Visualization fully loaded!');
console.log('Controls: Mouse drag to rotate, scroll to zoom, click points for details');
