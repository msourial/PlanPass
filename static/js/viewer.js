// IFC.js viewer module
let viewer;
let ifcModel;
let highlightedItems = [];

// Initialize the IFC.js viewer
function initViewer(ifcData) {
    try {
        // Check if THREE.js is available
        if (typeof THREE === 'undefined') {
            console.error("THREE.js is not available");
            fallbackToSimpleViewer(ifcData);
            return;
        }
        
        // Clear any existing viewer
        const viewerContainer = document.getElementById('viewer');
        viewerContainer.innerHTML = '';
        
        // Check if IfcViewerAPI is available
        if (typeof IfcViewerAPI === 'undefined') {
            console.error("IfcViewerAPI is not available");
            fallbackToSimpleViewer(ifcData);
            return;
        }
        
        // Create the viewer
        const container = document.getElementById('viewer');
        viewer = new IfcViewerAPI({ container, backgroundColor: new THREE.Color(0xf5f5f5) });
        viewer.grid.setGrid();
        viewer.axes.setAxes();
        
        // Setup camera and controls
        viewer.context.ifcCamera.cameraControls.setPosition(10, 10, 10);
        viewer.context.ifcCamera.cameraControls.setLookAt(0, 0, 0);
        
        // Load the IFC model (using the serialized data from backend)
        loadIFCModelData(ifcData);
        
        // Setup viewer controls
        setupViewerControls();
        
    } catch (error) {
        console.error('Error initializing viewer:', error);
        showToast('Error initializing 3D viewer', 'error');
    }
}

// Load IFC model data
function loadIFCModelData(ifcData) {
    try {
        // Since we're not directly loading an IFC file in the browser,
        // we'll simulate the viewer with basic Three.js objects based on the data
        // from the backend processing
        
        // Create a scene
        createBasicBuildingModel(ifcData);
        
        // Add lighting
        addLighting();
        
        // Render the scene
        viewer.context.renderer.setAnimationLoop(() => {
            viewer.context.renderer.render(
                viewer.context.scene,
                viewer.context.ifcCamera.perspectiveCamera
            );
        });
        
    } catch (error) {
        console.error('Error loading IFC model:', error);
        showToast('Error loading 3D model', 'error');
    }
}

// Create a basic building model from the IFC data
function createBasicBuildingModel(ifcData) {
    // Create materials
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xe0e0e0 });
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const doorFrameMaterial = new THREE.MeshLambertMaterial({ color: 0xa0522d });
    
    // Store doors for later reference
    const doors = ifcData.doors || [];
    
    // Create a simple building envelope (if no specific building data)
    const buildingWidth = 20;
    const buildingLength = 20;
    const floorHeight = 3;
    const numFloors = ifcData.levels ? ifcData.levels.length : 1;
    
    // Create floors
    for (let i = 0; i < numFloors; i++) {
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(buildingWidth, 0.2, buildingLength),
            floorMaterial
        );
        floor.position.set(0, i * floorHeight, 0);
        viewer.context.scene.add(floor);
        
        // Add ceiling if not the top floor
        if (i < numFloors - 1) {
            const ceiling = new THREE.Mesh(
                new THREE.BoxGeometry(buildingWidth, 0.1, buildingLength),
                floorMaterial
            );
            ceiling.position.set(0, (i + 1) * floorHeight - 0.1, 0);
            viewer.context.scene.add(ceiling);
        }
        
        // Add walls
        const walls = [
            // Front wall
            new THREE.Mesh(
                new THREE.BoxGeometry(buildingWidth, floorHeight, 0.2),
                wallMaterial
            ),
            // Back wall
            new THREE.Mesh(
                new THREE.BoxGeometry(buildingWidth, floorHeight, 0.2),
                wallMaterial
            ),
            // Left wall
            new THREE.Mesh(
                new THREE.BoxGeometry(0.2, floorHeight, buildingLength),
                wallMaterial
            ),
            // Right wall
            new THREE.Mesh(
                new THREE.BoxGeometry(0.2, floorHeight, buildingLength),
                wallMaterial
            )
        ];
        
        walls[0].position.set(0, i * floorHeight + floorHeight / 2, buildingLength / 2);
        walls[1].position.set(0, i * floorHeight + floorHeight / 2, -buildingLength / 2);
        walls[2].position.set(-buildingWidth / 2, i * floorHeight + floorHeight / 2, 0);
        walls[3].position.set(buildingWidth / 2, i * floorHeight + floorHeight / 2, 0);
        
        walls.forEach(wall => {
            wall.userData = { type: 'wall', level: i };
            viewer.context.scene.add(wall);
        });
    }
    
    // Create doors based on IFC data
    doors.forEach((door, index) => {
        const doorWidth = door.width || 0.9; // Default if no width specified
        const doorHeight = door.height || 2.1; // Default if no height specified
        const doorLevel = parseInt(door.level?.match(/\d+/)?.[0] || 0);
        
        const doorMesh = new THREE.Mesh(
            new THREE.BoxGeometry(doorWidth, doorHeight, 0.05),
            doorMaterial
        );
        
        // Randomly position doors along walls
        const wallIndex = index % 4;
        const position = calculateDoorPosition(wallIndex, doorWidth, doorLevel * floorHeight, buildingWidth, buildingLength);
        doorMesh.position.set(position.x, position.y, position.z);
        doorMesh.rotation.set(0, position.rotation, 0);
        
        // Door frame
        const doorFrame = new THREE.Mesh(
            new THREE.BoxGeometry(doorWidth + 0.1, doorHeight + 0.1, 0.12),
            doorFrameMaterial
        );
        doorFrame.position.copy(doorMesh.position);
        doorFrame.rotation.copy(doorMesh.rotation);
        
        // Add door metadata
        doorMesh.userData = { 
            type: 'door',
            id: door.id,
            name: door.name,
            width: doorWidth,
            is_compliant: door.is_compliant,
            level: doorLevel
        };
        
        viewer.context.scene.add(doorFrame);
        viewer.context.scene.add(doorMesh);
    });
}

// Calculate door position on walls
function calculateDoorPosition(wallIndex, doorWidth, floorLevel, buildingWidth, buildingLength) {
    const halfWidth = buildingWidth / 2;
    const halfLength = buildingLength / 2;
    const doorHeight = 2.1 / 2; // Half the standard door height
    
    // Randomize position along the wall
    const positionFactor = Math.random() * 0.6 - 0.3; // -0.3 to 0.3
    
    switch(wallIndex) {
        case 0: // Front wall
            return {
                x: halfWidth * positionFactor,
                y: floorLevel + doorHeight,
                z: halfLength,
                rotation: 0
            };
        case 1: // Back wall
            return {
                x: halfWidth * positionFactor,
                y: floorLevel + doorHeight,
                z: -halfLength,
                rotation: Math.PI
            };
        case 2: // Left wall
            return {
                x: -halfWidth,
                y: floorLevel + doorHeight,
                z: halfLength * positionFactor,
                rotation: Math.PI / 2
            };
        case 3: // Right wall
            return {
                x: halfWidth,
                y: floorLevel + doorHeight,
                z: halfLength * positionFactor,
                rotation: -Math.PI / 2
            };
    }
}

// Add lighting to the scene
function addLighting() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    viewer.context.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    viewer.context.scene.add(directionalLight);
    
    // Add hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x303030, 0.5);
    viewer.context.scene.add(hemisphereLight);
}

// Setup viewer controls
function setupViewerControls() {
    const resetViewBtn = document.querySelector('#viewerControls button:first-child');
    const zoomOutBtn = document.querySelector('#viewerControls button:nth-child(2)');
    const zoomInBtn = document.querySelector('#viewerControls button:nth-child(4)');
    const elementFilter = document.querySelector('#viewerControls select');
    
    // Reset view
    resetViewBtn.addEventListener('click', () => {
        viewer.context.ifcCamera.cameraControls.setPosition(10, 10, 10);
        viewer.context.ifcCamera.cameraControls.setLookAt(0, 0, 0);
    });
    
    // Zoom out
    zoomOutBtn.addEventListener('click', () => {
        viewer.context.ifcCamera.cameraControls.dollyOut(1.2);
    });
    
    // Zoom in
    zoomInBtn.addEventListener('click', () => {
        viewer.context.ifcCamera.cameraControls.dollyIn(1.2);
    });
    
    // Element filtering
    elementFilter.addEventListener('change', (event) => {
        const filterValue = event.target.value;
        
        // Clear any previous highlights
        clearHighlights();
        
        switch(filterValue) {
            case 'doors':
                highlightAllDoors();
                break;
            case 'non-compliant':
                highlightNonCompliantDoors();
                break;
            case 'all':
            default:
                // Show all elements (default state)
                break;
        }
    });
}

// Highlight all doors
function highlightAllDoors() {
    viewer.context.scene.traverse((object) => {
        if (object.userData && object.userData.type === 'door') {
            highlightObject(object, 0x3B82F6); // Blue color
        }
    });
}

// Highlight non-compliant doors
function highlightNonCompliantDoors() {
    viewer.context.scene.traverse((object) => {
        if (object.userData && object.userData.type === 'door' && object.userData.is_compliant === false) {
            highlightObject(object, 0xEF4444); // Red color
            
            // Focus camera on the first non-compliant door
            if (highlightedItems.length === 1) {
                focusOnObject(object);
            }
        }
    });
}

// Highlight a specific object
function highlightObject(object, color) {
    // Save original material for later restoration
    object.userData.originalMaterial = object.material;
    
    // Create highlight material
    const highlightMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
    });
    
    // Apply highlight material
    object.material = highlightMaterial;
    
    // Add to highlighted items
    highlightedItems.push(object);
    
    // Add glow effect (optional)
    const glowEffect = new THREE.Mesh(
        object.geometry.clone(),
        new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        })
    );
    glowEffect.scale.multiplyScalar(1.05);
    glowEffect.position.copy(object.position);
    glowEffect.rotation.copy(object.rotation);
    glowEffect.userData = { isGlow: true };
    viewer.context.scene.add(glowEffect);
    highlightedItems.push(glowEffect);
}

// Clear all highlights
function clearHighlights() {
    // Restore original materials
    highlightedItems.forEach((object) => {
        if (object.userData && object.userData.isGlow) {
            viewer.context.scene.remove(object);
        } else if (object.userData && object.userData.originalMaterial) {
            object.material = object.userData.originalMaterial;
        }
    });
    
    // Clear the array
    highlightedItems = [];
}

// Focus the camera on a specific object
function focusOnObject(object) {
    const position = object.position.clone();
    
    // Calculate a good camera position
    const offset = new THREE.Vector3(3, 2, 3);
    const cameraPosition = position.clone().add(offset);
    
    // Animate camera movement
    viewer.context.ifcCamera.cameraControls.setLookAt(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z,
        position.x,
        position.y,
        position.z,
        true // Enable animation
    );
}

// Fallback to a simple viewer when 3D viewer fails
function fallbackToSimpleViewer(ifcData) {
    console.log("Using fallback viewer");
    
    // Hide the placeholder message
    const viewerPlaceholder = document.getElementById('viewerPlaceholder');
    viewerPlaceholder.classList.add('hidden');
    
    // Get container and clear it
    const viewerContainer = document.getElementById('viewer');
    viewerContainer.innerHTML = '';
    viewerContainer.classList.remove('hidden');
    
    // Show a simple visualization of the building
    const fallbackDiv = document.createElement('div');
    fallbackDiv.className = 'w-full h-full bg-slate-100 dark:bg-slate-700 rounded-lg p-4 flex flex-col items-center justify-center';
    
    // Add project name
    const projectName = document.createElement('h3');
    projectName.className = 'text-xl font-bold mb-4';
    projectName.textContent = ifcData.project_name || 'Building Model';
    fallbackDiv.appendChild(projectName);
    
    // Add door information
    const doorInfo = document.createElement('div');
    doorInfo.className = 'w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-4';
    
    const doorTitle = document.createElement('h4');
    doorTitle.className = 'font-bold mb-2';
    doorTitle.textContent = `Doors Found: ${ifcData.door_count || 0}`;
    doorInfo.appendChild(doorTitle);
    
    // Create a simple list of doors
    if (ifcData.doors && ifcData.doors.length > 0) {
        const doorList = document.createElement('ul');
        doorList.className = 'space-y-2';
        
        ifcData.doors.forEach(door => {
            const doorItem = document.createElement('li');
            doorItem.className = 'flex items-center justify-between';
            
            const doorName = document.createElement('span');
            doorName.textContent = door.name || `Door ${door.id}`;
            
            const doorWidth = document.createElement('span');
            doorWidth.className = door.width >= 32 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
            doorWidth.textContent = door.width ? `${door.width} inches` : 'Unknown width';
            
            doorItem.appendChild(doorName);
            doorItem.appendChild(doorWidth);
            doorList.appendChild(doorItem);
        });
        
        doorInfo.appendChild(doorList);
    } else {
        const noDoors = document.createElement('p');
        noDoors.className = 'text-slate-500 dark:text-slate-400';
        noDoors.textContent = 'No door information available';
        doorInfo.appendChild(noDoors);
    }
    
    fallbackDiv.appendChild(doorInfo);
    
    // Add help message
    const helpMessage = document.createElement('p');
    helpMessage.className = 'text-sm text-slate-500 dark:text-slate-400 text-center';
    helpMessage.textContent = 'Using simplified viewer mode. The full 3D viewer requires additional browser support.';
    fallbackDiv.appendChild(helpMessage);
    
    // Add to container
    viewerContainer.appendChild(fallbackDiv);
    
    // Show viewer controls
    document.getElementById('viewerControls').classList.remove('hidden');
}
