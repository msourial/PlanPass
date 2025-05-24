// Simple 2D Building Viewer for BuildSat
// This provides a clear, functional visualization of building elements

function initSimpleViewer(ifcData) {
    console.log('Initializing simple 2D viewer with data:', ifcData);
    
    const viewerElement = document.getElementById('viewer');
    if (!viewerElement) return;
    
    // Clear any existing content
    viewerElement.innerHTML = '';
    
    // Create SVG container
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 800 600');
    svg.style.background = '#f8fafc';
    svg.style.border = '2px dashed #cbd5e1';
    svg.style.borderRadius = '8px';
    
    // Add title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '400');
    title.setAttribute('y', '30');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill', '#374151');
    title.setAttribute('font-size', '20');
    title.setAttribute('font-weight', 'bold');
    title.textContent = 'Building Floor Plan View';
    svg.appendChild(title);
    
    // Draw building outline
    const building = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    building.setAttribute('x', '100');
    building.setAttribute('y', '80');
    building.setAttribute('width', '600');
    building.setAttribute('height', '400');
    building.setAttribute('fill', '#e5e7eb');
    building.setAttribute('stroke', '#374151');
    building.setAttribute('stroke-width', '3');
    svg.appendChild(building);
    
    // Extract doors from IFC data
    const doors = ifcData.building_elements.filter(element => element.type === 'IfcDoor');
    console.log(`Found ${doors.length} doors to visualize`);
    
    // Draw doors
    doors.forEach((door, index) => {
        const doorX = 120 + (index % 6) * 90; // Distribute doors across building
        const doorY = 100 + Math.floor(index / 6) * 120;
        
        // Door frame
        const doorFrame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        doorFrame.setAttribute('x', doorX);
        doorFrame.setAttribute('y', doorY);
        doorFrame.setAttribute('width', '60');
        doorFrame.setAttribute('height', '8');
        doorFrame.setAttribute('fill', '#8b5cf6');
        doorFrame.setAttribute('stroke', '#6d28d9');
        doorFrame.setAttribute('stroke-width', '2');
        doorFrame.setAttribute('class', 'door-element');
        doorFrame.setAttribute('data-door-id', door.guid);
        svg.appendChild(doorFrame);
        
        // Door label
        const doorLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        doorLabel.setAttribute('x', doorX + 30);
        doorLabel.setAttribute('y', doorY + 25);
        doorLabel.setAttribute('text-anchor', 'middle');
        doorLabel.setAttribute('fill', '#374151');
        doorLabel.setAttribute('font-size', '10');
        doorLabel.textContent = `Door ${index + 1}`;
        svg.appendChild(doorLabel);
        
        // Door width indicator
        const widthLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        widthLabel.setAttribute('x', doorX + 30);
        widthLabel.setAttribute('y', doorY + 38);
        widthLabel.setAttribute('text-anchor', 'middle');
        widthLabel.setAttribute('fill', '#6b7280');
        widthLabel.setAttribute('font-size', '8');
        widthLabel.textContent = door.width ? `${door.width}"` : '32"';
        svg.appendChild(widthLabel);
    });
    
    // Add legend
    const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Legend background
    const legendBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    legendBg.setAttribute('x', '520');
    legendBg.setAttribute('y', '500');
    legendBg.setAttribute('width', '260');
    legendBg.setAttribute('height', '80');
    legendBg.setAttribute('fill', 'white');
    legendBg.setAttribute('stroke', '#d1d5db');
    legendBg.setAttribute('stroke-width', '1');
    legendBg.setAttribute('rx', '4');
    legendGroup.appendChild(legendBg);
    
    // Legend title
    const legendTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    legendTitle.setAttribute('x', '530');
    legendTitle.setAttribute('y', '520');
    legendTitle.setAttribute('fill', '#374151');
    legendTitle.setAttribute('font-size', '12');
    legendTitle.setAttribute('font-weight', 'bold');
    legendTitle.textContent = 'Legend';
    legendGroup.appendChild(legendTitle);
    
    // Door legend item
    const doorLegendRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    doorLegendRect.setAttribute('x', '530');
    doorLegendRect.setAttribute('y', '535');
    doorLegendRect.setAttribute('width', '30');
    doorLegendRect.setAttribute('height', '4');
    doorLegendRect.setAttribute('fill', '#8b5cf6');
    legendGroup.appendChild(doorLegendRect);
    
    const doorLegendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    doorLegendText.setAttribute('x', '570');
    doorLegendText.setAttribute('y', '540');
    doorLegendText.setAttribute('fill', '#374151');
    doorLegendText.setAttribute('font-size', '10');
    doorLegendText.textContent = `Doors (${doors.length} total)`;
    legendGroup.appendChild(doorLegendText);
    
    // Building legend item
    const buildingLegendRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    buildingLegendRect.setAttribute('x', '530');
    buildingLegendRect.setAttribute('y', '550');
    buildingLegendRect.setAttribute('width', '30');
    buildingLegendRect.setAttribute('height', '15');
    buildingLegendRect.setAttribute('fill', '#e5e7eb');
    buildingLegendRect.setAttribute('stroke', '#374151');
    buildingLegendRect.setAttribute('stroke-width', '1');
    legendGroup.appendChild(buildingLegendRect);
    
    const buildingLegendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    buildingLegendText.setAttribute('x', '570');
    buildingLegendText.setAttribute('y', '560');
    buildingLegendText.setAttribute('fill', '#374151');
    buildingLegendText.setAttribute('font-size', '10');
    buildingLegendText.textContent = 'Building Structure';
    legendGroup.appendChild(buildingLegendText);
    
    svg.appendChild(legendGroup);
    
    // Add statistics
    const statsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    const statsTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    statsTitle.setAttribute('x', '120');
    statsTitle.setAttribute('y', '520');
    statsTitle.setAttribute('fill', '#374151');
    statsTitle.setAttribute('font-size', '14');
    statsTitle.setAttribute('font-weight', 'bold');
    statsTitle.textContent = 'Building Summary';
    statsGroup.appendChild(statsTitle);
    
    const totalElements = ifcData.building_elements.length;
    const beams = ifcData.building_elements.filter(e => e.type === 'IfcBeam').length;
    const walls = ifcData.building_elements.filter(e => e.type === 'IfcWall').length;
    
    const stats = [
        `Total Elements: ${totalElements}`,
        `Doors: ${doors.length}`,
        `Beams: ${beams}`,
        `Walls: ${walls}`
    ];
    
    stats.forEach((stat, index) => {
        const statText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        statText.setAttribute('x', '120');
        statText.setAttribute('y', 540 + index * 15);
        statText.setAttribute('fill', '#6b7280');
        statText.setAttribute('font-size', '11');
        statText.textContent = stat;
        statsGroup.appendChild(statText);
    });
    
    svg.appendChild(statsGroup);
    
    // Append SVG to viewer
    viewerElement.appendChild(svg);
    
    // Show viewer and controls
    viewerElement.classList.remove('hidden');
    document.getElementById('viewerControls').classList.remove('hidden');
    
    // Add click handlers for doors
    const doorElements = svg.querySelectorAll('.door-element');
    doorElements.forEach(doorElement => {
        doorElement.style.cursor = 'pointer';
        doorElement.addEventListener('click', function() {
            const doorId = this.getAttribute('data-door-id');
            highlightDoor(doorId);
        });
    });
    
    console.log('Simple 2D viewer initialized successfully');
}

function highlightDoor(doorId) {
    // Clear existing highlights
    const doorElements = document.querySelectorAll('.door-element');
    doorElements.forEach(door => {
        door.setAttribute('fill', '#8b5cf6');
        door.setAttribute('stroke', '#6d28d9');
    });
    
    // Highlight selected door
    const selectedDoor = document.querySelector(`[data-door-id="${doorId}"]`);
    if (selectedDoor) {
        selectedDoor.setAttribute('fill', '#ef4444');
        selectedDoor.setAttribute('stroke', '#dc2626');
        
        // Focus on door in report if function exists
        if (typeof focusOnDoorById === 'function') {
            focusOnDoorById(doorId);
        }
    }
}

function highlightNonCompliantDoorsSimple(nonCompliantDoors) {
    const doorElements = document.querySelectorAll('.door-element');
    doorElements.forEach(door => {
        const doorId = door.getAttribute('data-door-id');
        const isNonCompliant = nonCompliantDoors.some(d => d.guid === doorId);
        
        if (isNonCompliant) {
            door.setAttribute('fill', '#ef4444');
            door.setAttribute('stroke', '#dc2626');
        } else {
            door.setAttribute('fill', '#10b981');
            door.setAttribute('stroke', '#059669');
        }
    });
}