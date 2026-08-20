// PlanPass 2D Building Viewer
// Renders a clean SVG floor plan with doors colored by compliance status.

let planpassViewerData = null;

// Initialize the viewer with IFC data and compliance results
function initViewer(ifcData, complianceResults, zipCode) {
    console.log('Initializing PlanPass viewer:', ifcData);

    const viewerElement = document.getElementById('viewer');
    if (!viewerElement) return;

    const doors = ifcData.doors || [];
    const projectName = ifcData.project_name || 'Unnamed Project';

    // Merge compliance status into door data
    const complianceMap = new Map();
    if (complianceResults && complianceResults.doors) {
        ['compliant', 'non_compliant'].forEach(status => {
            (complianceResults.doors[status] || []).forEach(door => {
                complianceMap.set(String(door.id), {
                    is_compliant: status === 'compliant',
                    compliance_message: door.compliance_message || ''
                });
            });
        });
    }

    planpassViewerData = { doors, projectName, zipCode };

    // Clear any existing content
    viewerElement.innerHTML = '';

    // Create SVG container
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 800 600');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.background = '#f8fafc';
    svg.style.border = '2px dashed #cbd5e1';
    svg.style.borderRadius = '8px';

    // Title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '400');
    title.setAttribute('y', '30');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill', '#374151');
    title.setAttribute('font-size', '18');
    title.setAttribute('font-weight', 'bold');
    title.textContent = `${projectName} - Floor Plan`;
    svg.appendChild(title);

    // Building outline
    const building = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    building.setAttribute('x', '100');
    building.setAttribute('y', '80');
    building.setAttribute('width', '600');
    building.setAttribute('height', '400');
    building.setAttribute('fill', '#e5e7eb');
    building.setAttribute('stroke', '#374151');
    building.setAttribute('stroke-width', '3');
    svg.appendChild(building);

    // Draw doors (grid layout inside the building)
    const nonCompliantCount = doors.filter(door => {
        const info = complianceMap.get(String(door.id));
        return info ? !info.is_compliant : false;
    }).length;

    doors.forEach((door, index) => {
        const info = complianceMap.get(String(door.id));
        const isCompliant = info ? info.is_compliant : (door.is_compliant === true);
        const widthInches = door.width_in || (door.width ? Math.round(door.width * 39.3701 * 100) / 100 : null);

        const col = index % 6;
        const row = Math.floor(index / 6);
        const doorX = 120 + col * 90;
        const doorY = 100 + row * 80;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'door-element');
        g.setAttribute('data-door-id', door.id);
        g.setAttribute('data-compliant', isCompliant ? 'true' : 'false');
        g.style.cursor = 'pointer';

        // Door bar
        const doorFrame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        doorFrame.setAttribute('x', doorX);
        doorFrame.setAttribute('y', doorY);
        doorFrame.setAttribute('width', '60');
        doorFrame.setAttribute('height', '10');
        doorFrame.setAttribute('rx', '2');
        doorFrame.setAttribute('fill', isCompliant ? '#10b981' : '#ef4444');
        doorFrame.setAttribute('stroke', isCompliant ? '#059669' : '#dc2626');
        doorFrame.setAttribute('stroke-width', '2');
        g.appendChild(doorFrame);

        // Door label
        const doorLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        doorLabel.setAttribute('x', doorX + 30);
        doorLabel.setAttribute('y', doorY + 26);
        doorLabel.setAttribute('text-anchor', 'middle');
        doorLabel.setAttribute('fill', '#374151');
        doorLabel.setAttribute('font-size', '10');
        doorLabel.setAttribute('font-weight', '500');
        doorLabel.textContent = door.name || `Door ${door.id}`;
        g.appendChild(doorLabel);

        // Width label
        const widthLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        widthLabel.setAttribute('x', doorX + 30);
        widthLabel.setAttribute('y', doorY + 39);
        widthLabel.setAttribute('text-anchor', 'middle');
        widthLabel.setAttribute('fill', isCompliant ? '#059669' : '#dc2626');
        widthLabel.setAttribute('font-size', '9');
        widthLabel.setAttribute('font-weight', 'bold');
        widthLabel.textContent = widthInches ? `${widthInches}"` : 'N/A';
        g.appendChild(widthLabel);

        // Click handler
        g.addEventListener('click', () => {
            const msg = info && info.compliance_message
                ? `${door.name || `Door ${door.id}`}: ${info.compliance_message}`
                : `${door.name || `Door ${door.id}`}: ${widthInches ? widthInches + '"' : 'no width data'}`;
            showToast(msg, isCompliant ? 'success' : 'error');
        });

        svg.appendChild(g);
    });

    // Legend
    const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
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

    const legendTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    legendTitle.setAttribute('x', '530');
    legendTitle.setAttribute('y', '520');
    legendTitle.setAttribute('fill', '#374151');
    legendTitle.setAttribute('font-size', '12');
    legendTitle.setAttribute('font-weight', 'bold');
    legendTitle.textContent = 'Legend';
    legendGroup.appendChild(legendTitle);

    const legendItems = [
        { color: '#10b981', border: '#059669', label: 'Compliant door' },
        { color: '#ef4444', border: '#dc2626', label: 'Non-compliant door' }
    ];
    legendItems.forEach((item, index) => {
        const y = 535 + index * 22;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '530');
        rect.setAttribute('y', y - 4);
        rect.setAttribute('width', '30');
        rect.setAttribute('height', '8');
        rect.setAttribute('rx', '2');
        rect.setAttribute('fill', item.color);
        rect.setAttribute('stroke', item.border);
        legendGroup.appendChild(rect);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '570');
        text.setAttribute('y', y + 1);
        text.setAttribute('fill', '#374151');
        text.setAttribute('font-size', '10');
        text.textContent = item.label;
        legendGroup.appendChild(text);
    });
    svg.appendChild(legendGroup);

    // Statistics
    const statsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const statsTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    statsTitle.setAttribute('x', '120');
    statsTitle.setAttribute('y', '520');
    statsTitle.setAttribute('fill', '#374151');
    statsTitle.setAttribute('font-size', '14');
    statsTitle.setAttribute('font-weight', 'bold');
    statsTitle.textContent = 'Building Summary';
    statsGroup.appendChild(statsTitle);

    const compliantCount = doors.length - nonCompliantCount;
    const stats = [
        `Total Doors: ${doors.length}`,
        `Compliant: ${compliantCount}`,
        `Non-compliant: ${nonCompliantCount}`,
        `Zip Code: ${zipCode || 'N/A'}`
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

    viewerElement.appendChild(svg);
    viewerElement.classList.remove('hidden');
    viewerElement.classList.add('loaded');

    // Show controls
    const controls = document.getElementById('viewerControls');
    if (controls) controls.classList.remove('hidden');

    console.log('PlanPass viewer initialized');
}

// Highlight non-compliant doors (pulsing red outline)
function highlightNonCompliantDoors() {
    clearHighlights();
    const doors = document.querySelectorAll('.door-element[data-compliant="false"]');
    doors.forEach(door => {
        door.classList.add('non-compliant-flash');
    });
    if (doors.length > 0) {
        document.getElementById('viewerContainer').scrollIntoView({ behavior: 'smooth' });
    } else {
        showToast('All doors are compliant', 'success');
    }
}

// Highlight a specific door by its IFC id
function viewerFocusOnDoor(doorId) {
    clearHighlights();
    const door = document.querySelector(`.door-element[data-door-id="${doorId}"]`);
    if (!door) {
        showToast('Door not found in the model', 'error');
        return false;
    }
    door.classList.add('door-focus');
    document.getElementById('viewerContainer').scrollIntoView({ behavior: 'smooth' });
    return true;
}

// Clear all highlight effects
function clearHighlights() {
    document.querySelectorAll('.door-element').forEach(door => {
        door.classList.remove('non-compliant-flash', 'door-focus');
    });
}

// Filter doors by compliance state (used by the controls dropdown)
function filterDoors(filterValue) {
    clearHighlights();
    document.querySelectorAll('.door-element').forEach(door => {
        if (filterValue === 'non-compliant') {
            door.style.display = door.getAttribute('data-compliant') === 'false' ? '' : 'none';
        } else if (filterValue === 'compliant') {
            door.style.display = door.getAttribute('data-compliant') === 'true' ? '' : 'none';
        } else {
            door.style.display = '';
        }
    });
}

// Reset the view to show everything
function resetView() {
    clearHighlights();
    filterDoors('all');
}