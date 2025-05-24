// IFC.js viewer module
let viewer;
let ifcModel;
let highlightedItems = [];

// Initialize the 3D viewer
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
        
        // Create a THREE.js scene directly
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f5);
        
        // Create camera
        const camera = new THREE.PerspectiveCamera(75, viewerContainer.clientWidth / viewerContainer.clientHeight, 0.1, 1000);
        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);
        
        // Create renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        viewerContainer.appendChild(renderer.domElement);
        
        // Add orbit controls if available
        let controls = null;
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.25;
        }
        
        // Store in global viewer object
        viewer = {
            scene: scene,
            camera: camera,
            renderer: renderer,
            controls: controls
        };
        
        // Load the IFC model data
        loadIFCModelData(ifcData);
        
        // Setup animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            if (controls) {
                controls.update();
            }
            
            renderer.render(scene, camera);
        }
        animate();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = viewerContainer.clientWidth / viewerContainer.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(viewerContainer.clientWidth, viewerContainer.clientHeight);
        });
        
        // Setup viewer controls
        setupViewerControls();
        
    } catch (error) {
        console.error('Error initializing viewer:', error);
        fallbackToSimpleViewer(ifcData);
    }
    
    // Skip complex 3D and use simple building view
    createSimpleBuildingView(ifcData);
}

// Load IFC model data
function loadIFCModelData(ifcData) {
    try {
        // Create a realistic 3D building model based on IFC data
        createRealistic3DModel(ifcData);
        
        // Add lighting
        addLighting();
        
        // Mark viewer as loaded
        document.getElementById('viewer').classList.add('loaded');
        
    } catch (error) {
        console.error('Error loading IFC model:', error);
        showToast('Error loading 3D model', 'error');
    }
}

// Create a realistic 3D model from the IFC data
function createRealistic3DModel(ifcData) {
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
        viewer.scene.add(floor);
        
        // Add ceiling if not the top floor
        if (i < numFloors - 1) {
            const ceiling = new THREE.Mesh(
                new THREE.BoxGeometry(buildingWidth, 0.1, buildingLength),
                floorMaterial
            );
            ceiling.position.set(0, (i + 1) * floorHeight - 0.1, 0);
            viewer.scene.add(ceiling);
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
            viewer.scene.add(wall);
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
        
        viewer.scene.add(doorFrame);
        viewer.scene.add(doorMesh);
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
    viewer.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    viewer.scene.add(directionalLight);
    
    // Add hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x303030, 0.5);
    viewer.scene.add(hemisphereLight);
}

// Setup viewer controls
function setupViewerControls() {
    const resetViewBtn = document.querySelector('#viewerControls button:first-child');
    const zoomOutBtn = document.querySelector('#viewerControls button:nth-child(2)');
    const zoomInBtn = document.querySelector('#viewerControls button:nth-child(4)');
    const elementFilter = document.querySelector('#viewerControls select');
    
    // Reset view
    resetViewBtn.addEventListener('click', () => {
        viewer.camera.position.set(10, 10, 10);
        viewer.camera.lookAt(0, 0, 0);
        if (viewer.controls) {
            viewer.controls.reset();
        }
    });
    
    // Zoom out
    zoomOutBtn.addEventListener('click', () => {
        const currentDistance = viewer.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
        const newDistance = currentDistance * 1.2;
        viewer.camera.position.multiplyScalar(newDistance / currentDistance);
    });
    
    // Zoom in
    zoomInBtn.addEventListener('click', () => {
        const currentDistance = viewer.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
        const newDistance = currentDistance * 0.8;
        viewer.camera.position.multiplyScalar(newDistance / currentDistance);
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
    console.log("Using fallback viewer", ifcData);
    
    try {
        // Hide the placeholder message
        const viewerPlaceholder = document.getElementById('viewerPlaceholder');
        if (viewerPlaceholder) viewerPlaceholder.classList.add('hidden');
        
        // Get container and clear it
        const viewerContainer = document.getElementById('viewer');
        viewerContainer.innerHTML = '';
        viewerContainer.classList.remove('hidden');
        
        // Create a canvas for drawing the building
        const canvas = document.createElement('canvas');
        canvas.width = viewerContainer.clientWidth;
        canvas.height = viewerContainer.clientHeight;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.background = '#f8f9fa';
        viewerContainer.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        // Draw building outline
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const buildingWidth = Math.min(canvas.width, canvas.height) * 0.6;
        const buildingHeight = buildingWidth * 0.8;
        
        // Draw building rectangle
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 3;
        ctx.strokeRect(
            centerX - buildingWidth/2, 
            centerY - buildingHeight/2, 
            buildingWidth, 
            buildingHeight
        );
        
        // Fill building
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(
            centerX - buildingWidth/2, 
            centerY - buildingHeight/2, 
            buildingWidth, 
            buildingHeight
        );
        
        // Draw doors
        if (ifcData && ifcData.doors && ifcData.doors.length > 0) {
            const doorWidth = buildingWidth * 0.08;
            const doorHeight = buildingHeight * 0.15;
            
            ifcData.doors.forEach((door, index) => {
                // Position doors around the perimeter
                let doorX, doorY;
                const side = index % 4;
                const offset = (index / 4) * (buildingWidth / Math.ceil(ifcData.doors.length / 4));
                
                switch(side) {
                    case 0: // Top wall
                        doorX = centerX - buildingWidth/2 + offset;
                        doorY = centerY - buildingHeight/2;
                        break;
                    case 1: // Right wall
                        doorX = centerX + buildingWidth/2 - doorWidth;
                        doorY = centerY - buildingHeight/2 + offset;
                        break;
                    case 2: // Bottom wall
                        doorX = centerX - buildingWidth/2 + offset;
                        doorY = centerY + buildingHeight/2 - doorHeight;
                        break;
                    case 3: // Left wall
                        doorX = centerX - buildingWidth/2;
                        doorY = centerY - buildingHeight/2 + offset;
                        break;
                }
                
                // Color based on compliance
                ctx.fillStyle = door.is_compliant ? '#10b981' : '#ef4444';
                ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
                
                // Door outline
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1;
                ctx.strokeRect(doorX, doorY, doorWidth, doorHeight);
                
                // Door label
                ctx.fillStyle = '#1f2937';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(
                    `${door.width || 'N/A'}"`, 
                    doorX + doorWidth/2, 
                    doorY + doorHeight + 15
                );
            });
        }
        
        // Add title
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
            ifcData.project_name || 'Building Model', 
            centerX, 
            30
        );
        
        // Add legend
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#10b981';
        ctx.fillRect(20, canvas.height - 60, 15, 15);
        ctx.fillStyle = '#1f2937';
        ctx.fillText('Compliant doors', 45, canvas.height - 48);
        
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(20, canvas.height - 35, 15, 15);
        ctx.fillStyle = '#1f2937';
        ctx.fillText('Non-compliant doors', 45, canvas.height - 23);
        
        // Handle resize
        window.addEventListener('resize', () => {
            canvas.width = viewerContainer.clientWidth;
            canvas.height = viewerContainer.clientHeight;
            // Redraw would happen here
        });
        
        // Show viewer controls
        const controls = document.getElementById('viewerControls');
        if (controls) controls.classList.remove('hidden');
        
    } catch (error) {
        console.error('Fallback viewer failed:', error);
        
        // Create a visual building representation
        const viewerContainer = document.getElementById('viewer');
        
        // Calculate door statistics
        const totalDoors = ifcData?.doors?.length || 0;
        const compliantDoors = ifcData?.doors?.filter(d => d.is_compliant).length || 0;
        const nonCompliantDoors = totalDoors - compliantDoors;
        
        viewerContainer.innerHTML = `
            <div class="h-full bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-6 flex flex-col">
                <!-- Building Header -->
                <div class="text-center mb-6">
                    <h3 class="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                        ${ifcData?.project_name || 'Building Model'}
                    </h3>
                    <div class="flex justify-center items-center gap-6 text-sm">
                        <div class="bg-white dark:bg-slate-700 px-3 py-1 rounded-full">
                            <span class="font-medium">Total Doors:</span> ${totalDoors}
                        </div>
                        <div class="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
                            <span class="font-medium text-green-800 dark:text-green-200">Compliant:</span> ${compliantDoors}
                        </div>
                        <div class="bg-red-100 dark:bg-red-900 px-3 py-1 rounded-full">
                            <span class="font-medium text-red-800 dark:text-red-200">Non-compliant:</span> ${nonCompliantDoors}
                        </div>
                    </div>
                </div>
                
                <!-- Visual Building -->
                <div class="flex-1 flex items-center justify-center">
                    <div class="relative">
                        <!-- Building outline -->
                        <div class="w-80 h-60 bg-gray-200 dark:bg-gray-600 border-4 border-gray-400 dark:border-gray-500 relative">
                            <!-- Building label -->
                            <div class="absolute top-2 left-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                                Building Floor Plan
                            </div>
                            
                            <!-- Doors around perimeter -->
                            ${ifcData?.doors ? ifcData.doors.map((door, index) => {
                                const side = index % 4;
                                let position = '';
                                let size = 'w-3 h-8';
                                
                                switch(side) {
                                    case 0: // Top
                                        position = `top-0 left-${20 + (index * 15) % 60}`;
                                        size = 'w-8 h-3';
                                        break;
                                    case 1: // Right  
                                        position = `right-0 top-${10 + (index * 12) % 40}`;
                                        break;
                                    case 2: // Bottom
                                        position = `bottom-0 left-${20 + (index * 15) % 60}`;
                                        size = 'w-8 h-3';
                                        break;
                                    case 3: // Left
                                        position = `left-0 top-${10 + (index * 12) % 40}`;
                                        break;
                                }
                                
                                return `
                                    <div class="absolute ${position} ${size} ${door.is_compliant ? 'bg-green-500' : 'bg-red-500'} 
                                               border border-gray-700 flex items-center justify-center group cursor-pointer"
                                         title="Door ${door.id}: ${door.width || 'N/A'} inches">
                                        <span class="text-white text-xs font-bold">${door.width || '?'}"</span>
                                    </div>
                                `;
                            }).join('') : ''}
                        </div>
                        
                        <!-- Legend -->
                        <div class="mt-4 flex justify-center gap-4 text-sm">
                            <div class="flex items-center gap-2">
                                <div class="w-4 h-4 bg-green-500 rounded"></div>
                                <span>Compliant (≥32")</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-4 h-4 bg-red-500 rounded"></div>
                                <span>Non-compliant (<32")</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Door List -->
                <div class="mt-4 bg-white dark:bg-slate-700 rounded-lg p-4 max-h-32 overflow-y-auto">
                    <h4 class="font-bold mb-2 text-slate-800 dark:text-white">Door Details:</h4>
                    <div class="grid grid-cols-2 gap-1 text-xs">
                        ${ifcData?.doors ? ifcData.doors.map(door => `
                            <div class="flex justify-between items-center py-1 px-2 rounded ${door.is_compliant ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'}">
                                <span class="font-medium">${door.name || `Door ${door.id}`}</span>
                                <span class="${door.is_compliant ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}">
                                    ${door.width || 'N/A'}"
                                </span>
                            </div>
                        `).join('') : '<p class="text-gray-500">No door data available</p>'}
                    </div>
                </div>
            </div>
        `;
    }
}

// Simple building view that always works
function createSimpleBuildingView(ifcData) {
    const viewerContainer = document.getElementById('viewer');
    const viewerPlaceholder = document.getElementById('viewerPlaceholder');
    
    // Hide placeholder
    if (viewerPlaceholder) {
        viewerPlaceholder.classList.add('hidden');
    }
    
    // Show viewer container
    viewerContainer.classList.remove('hidden');
    
    // Extract door data
    const doors = ifcData?.doors || [];
    const totalDoors = doors.length;
    const compliantDoors = doors.filter(d => d.is_compliant).length;
    const nonCompliantDoors = totalDoors - compliantDoors;
    
    // Create simple building visualization
    viewerContainer.innerHTML = `
        <div class="h-full bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-6">
            <div class="h-full flex flex-col">
                <!-- Header -->
                <div class="text-center mb-6">
                    <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">
                        ${ifcData?.project_name || 'Building Analysis'}
                    </h3>
                    <div class="grid grid-cols-3 gap-4 max-w-md mx-auto">
                        <div class="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg text-center">
                            <div class="text-2xl font-bold text-blue-800 dark:text-blue-200">${totalDoors}</div>
                            <div class="text-sm text-blue-600 dark:text-blue-300">Total Doors</div>
                        </div>
                        <div class="bg-green-100 dark:bg-green-900 p-3 rounded-lg text-center">
                            <div class="text-2xl font-bold text-green-800 dark:text-green-200">${compliantDoors}</div>
                            <div class="text-sm text-green-600 dark:text-green-300">Compliant</div>
                        </div>
                        <div class="bg-red-100 dark:bg-red-900 p-3 rounded-lg text-center">
                            <div class="text-2xl font-bold text-red-800 dark:text-red-200">${nonCompliantDoors}</div>
                            <div class="text-sm text-red-600 dark:text-red-300">Non-compliant</div>
                        </div>
                    </div>
                </div>
                
                <!-- Building Representation -->
                <div class="flex-1 flex items-center justify-center mb-6">
                    <div class="relative">
                        <!-- Building outline -->
                        <div class="w-72 h-48 bg-gray-100 dark:bg-gray-700 border-4 border-gray-400 dark:border-gray-500 relative rounded-lg shadow-lg">
                            <div class="absolute top-2 left-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                                Floor Plan View
                            </div>
                            
                            <!-- Doors visualization -->
                            <div class="absolute inset-4 grid grid-cols-4 gap-2">
                                ${doors.slice(0, 16).map((door, index) => `
                                    <div class="relative group">
                                        <div class="w-full h-8 ${door.is_compliant ? 'bg-green-500' : 'bg-red-500'} rounded border-2 border-gray-700 flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                                             title="Door ${door.id}: ${door.width || 'Unknown'} inches">
                                            <span class="text-white text-xs font-bold">${door.width || '?'}"</span>
                                        </div>
                                        <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            ${door.name || `Door ${door.id}`}<br>
                                            Width: ${door.width || 'Unknown'}"<br>
                                            ${door.is_compliant ? 'Compliant' : 'Non-compliant'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Legend -->
                        <div class="mt-4 flex justify-center gap-6 text-sm">
                            <div class="flex items-center gap-2">
                                <div class="w-4 h-4 bg-green-500 rounded border border-gray-300"></div>
                                <span class="text-gray-700 dark:text-gray-300">Compliant (≥32")</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-4 h-4 bg-red-500 rounded border border-gray-300"></div>
                                <span class="text-gray-700 dark:text-gray-300">Non-compliant (<32")</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Door Details -->
                ${doors.length > 0 ? `
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-32 overflow-y-auto">
                        <h4 class="font-bold mb-3 text-gray-800 dark:text-white">Door Compliance Details:</h4>
                        <div class="space-y-1">
                            ${doors.map(door => `
                                <div class="flex justify-between items-center py-2 px-3 rounded ${door.is_compliant ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'}">
                                    <span class="font-medium text-gray-800 dark:text-gray-200">${door.name || `Door ${door.id}`}</span>
                                    <div class="text-right">
                                        <span class="font-bold ${door.is_compliant ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}">
                                            ${door.width || 'N/A'}"
                                        </span>
                                        <div class="text-xs ${door.is_compliant ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                                            ${door.is_compliant ? 'Compliant' : 'Non-compliant'}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="text-center text-gray-500 dark:text-gray-400">
                        <p>No door data available for visualization</p>
                    </div>
                `}
            </div>
        </div>
    `;
    
    // Show viewer controls
    const controls = document.getElementById('viewerControls');
    if (controls) {
        controls.classList.remove('hidden');
    }
}
