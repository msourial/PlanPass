// Report generation module
let reportData = null;

// Populate the report with compliance results
function populateReport(complianceResults, reportHash) {
    reportData = complianceResults;
    
    // Project information
    document.getElementById('projectName').textContent = complianceResults.project_name || 'Unknown Project';
    document.getElementById('analysisDate').textContent = new Date().toLocaleString();
    
    // Compliance score
    const score = complianceResults.compliance_score || 0;
    updateComplianceScore(score);
    
    // Door summary
    document.getElementById('totalDoors').textContent = complianceResults.total_doors || 0;
    document.getElementById('compliantDoors').textContent = complianceResults.compliant_doors || 0;
    document.getElementById('nonCompliantDoors').textContent = complianceResults.non_compliant_doors || 0;
    
    // Non-compliant doors table
    updateNonCompliantDoorsTable(complianceResults.doors?.non_compliant || []);
    
    // Add building visualization to report
    addBuildingVisualization(complianceResults);
    
    // Verification hash
    document.getElementById('verificationHash').textContent = reportHash || 'Not generated';
}

// Update the compliance score display
function updateComplianceScore(score) {
    // Update score text
    document.getElementById('scoreText').textContent = `${score}%`;
    
    // Update score circle
    const circumference = 2 * Math.PI * 45;
    const dashArray = (score / 100) * circumference;
    const scoreIndicator = document.getElementById('scoreIndicator');
    scoreIndicator.style.strokeDasharray = `${dashArray} ${circumference}`;
    
    // Set color based on score
    let color, status, summary;
    
    if (score >= 90) {
        color = '#10B981'; // green
        status = 'Excellent';
        summary = 'Your building design meets most compliance requirements.';
    } else if (score >= 75) {
        color = '#3B82F6'; // blue
        status = 'Good';
        summary = 'Your design is mostly compliant with some issues to address.';
    } else if (score >= 50) {
        color = '#F59E0B'; // amber
        status = 'Needs Improvement';
        summary = 'Your design has several compliance issues that need attention.';
    } else {
        color = '#EF4444'; // red
        status = 'Critical Issues';
        summary = 'Your design has significant compliance problems that must be resolved.';
    }
    
    // Apply color
    scoreIndicator.style.stroke = color;
    
    // Update status text
    document.getElementById('scoreStatus').textContent = status;
    document.getElementById('scoreStatus').style.color = color;
    document.getElementById('scoreSummary').textContent = summary;
}

// Update the non-compliant doors table
function updateNonCompliantDoorsTable(nonCompliantDoors) {
    const tableBody = document.getElementById('nonCompliantDoorsTable');
    const section = document.getElementById('nonCompliantDoorsSection');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (nonCompliantDoors.length === 0) {
        section.classList.add('hidden');
        return;
    }
    
    // Show section
    section.classList.remove('hidden');
    
    // Add rows for each non-compliant door
    nonCompliantDoors.forEach(door => {
        const row = document.createElement('tr');
        
        const doorName = door.name || `Door-${door.id}`;
        const location = door.level || 'Unknown';
        const width = door.width ? `${door.width} in` : 'Unknown';
        const requiredWidth = reportData.building_code?.min_door_width || 32;
        const issue = door.compliance_message || 'Door width below minimum requirement';
        
        row.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap">
                <div class="font-medium text-slate-900 dark:text-slate-100">${doorName}</div>
                <div class="text-sm text-slate-500 dark:text-slate-400">ID: ${door.id}</div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap">${location}</td>
            <td class="px-4 py-3 whitespace-nowrap font-medium text-red-500">${width}</td>
            <td class="px-4 py-3 whitespace-nowrap">≥ ${requiredWidth} in</td>
            <td class="px-4 py-3">${issue}</td>
            <td class="px-4 py-3 whitespace-nowrap">
                <button class="text-blue-500 hover:text-blue-700 transition-colors focus-door-btn" data-door-id="${door.id}">
                    <i class="fas fa-search mr-1"></i> View
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to focus buttons
    document.querySelectorAll('.focus-door-btn').forEach(button => {
        button.addEventListener('click', function() {
            const doorId = this.getAttribute('data-door-id');
            focusOnDoorById(doorId);
        });
    });
}

// Focus on a specific door in the 3D viewer
function focusOnDoorById(doorId) {
    // Scroll to viewer section
    document.getElementById('viewerContainer').scrollIntoView({ behavior: 'smooth' });
    
    // Find and highlight the door
    let found = false;
    
    // Clear existing highlights
    clearHighlights();
    
    // Find and highlight the specific door
    viewer.context.scene.traverse((object) => {
        if (object.userData && object.userData.type === 'door' && object.userData.id == doorId) {
            highlightObject(object, 0xEF4444); // Red color
            focusOnObject(object);
            found = true;
        }
    });
    
    if (!found) {
        showToast('Door not found in the model', 'error');
    }
}

// Generate PDF report
function generatePdfReport() {
    if (!reportData) {
        showToast('No report data available', 'error');
        return;
    }
    
    // Show loading overlay
    showLoading('Generating PDF report...');
    
    // Create a new jsPDF instance
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    // Set font
    doc.setFont('helvetica');
    
    // Add report header
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246); // Blue
    doc.text('BuildSat Compliance Report', 105, 20, {align: 'center'});
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 28, {align: 'center'});
    
    // Add divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 32, 190, 32);
    
    // Project information
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Project Information', 20, 42);
    
    doc.setFontSize(11);
    doc.text(`Project Name: ${reportData.project_name || 'Unknown Project'}`, 20, 50);
    doc.text(`Total Doors: ${reportData.total_doors || 0}`, 20, 56);
    
    // Compliance summary
    doc.setFontSize(14);
    doc.text('Compliance Summary', 20, 66);
    
    doc.setFontSize(11);
    doc.text(`Compliance Score: ${reportData.compliance_score || 0}%`, 20, 74);
    doc.text(`Compliant Doors: ${reportData.compliant_doors || 0}`, 20, 80);
    doc.text(`Non-Compliant Doors: ${reportData.non_compliant_doors || 0}`, 20, 86);
    
    // Set color for compliance score
    const score = reportData.compliance_score || 0;
    if (score >= 90) {
        doc.setTextColor(16, 185, 129); // Green
    } else if (score >= 75) {
        doc.setTextColor(59, 130, 246); // Blue
    } else if (score >= 50) {
        doc.setTextColor(245, 158, 11); // Amber
    } else {
        doc.setTextColor(239, 68, 68); // Red
    }
    
    // Draw score circle
    doc.circle(160, 76, 12, 'S');
    doc.setFontSize(14);
    doc.text(`${score}%`, 160, 76, {align: 'center'});
    
    // Reset color
    doc.setTextColor(0, 0, 0);
    
    // Building code information
    doc.setFontSize(14);
    doc.text('Building Code Information', 20, 100);
    
    doc.setFontSize(11);
    doc.text(`Source: ${reportData.building_code?.source || 'Texas Building Code'}`, 20, 108);
    doc.text(`Min. Door Width: ${reportData.building_code?.min_door_width || 32} inches`, 20, 114);
    
    // Requirements
    if (reportData.building_code?.requirements && reportData.building_code.requirements.length > 0) {
        doc.setFontSize(12);
        doc.text('Key Requirements:', 20, 124);
        
        let yPosition = 130;
        doc.setFontSize(10);
        
        reportData.building_code.requirements.forEach((req, index) => {
            if (yPosition > 270) {
                // Add new page if needed
                doc.addPage();
                yPosition = 20;
            }
            
            doc.text(`• ${req}`, 25, yPosition);
            yPosition += 8;
        });
        
        // Update yPosition for next section
        yPosition += 4;
    } else {
        yPosition = 124;
    }
    
    // Non-compliant doors
    const nonCompliantDoors = reportData.doors?.non_compliant || [];
    
    if (nonCompliantDoors.length > 0) {
        // Add new page if needed
        if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Non-Compliant Doors', 20, yPosition);
        yPosition += 8;
        
        doc.setFontSize(10);
        
        nonCompliantDoors.forEach((door, index) => {
            // Add new page if needed
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }
            
            const doorName = door.name || `Door-${door.id}`;
            const location = door.level || 'Unknown';
            const width = door.width ? `${door.width} in` : 'Unknown';
            const issue = door.compliance_message || 'Width below minimum requirement';
            
            doc.setFontSize(11);
            doc.setTextColor(239, 68, 68); // Red
            doc.text(`${index + 1}. ${doorName}`, 20, yPosition);
            yPosition += 6;
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Location: ${location}`, 25, yPosition);
            yPosition += 5;
            doc.text(`Width: ${width}`, 25, yPosition);
            yPosition += 5;
            doc.text(`Issue: ${issue}`, 25, yPosition);
            yPosition += 10;
        });
    }
    
    // Add verification hash
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Verification', 20, 20);
    
    doc.setFontSize(11);
    doc.text('This report is digitally verified with the following hash:', 20, 28);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const hash = document.getElementById('verificationHash').textContent;
    doc.text(hash, 20, 36, { maxWidth: 170 });
    
    // Add QR code placeholder
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(70, 45, 70, 70, 3, 3, 'FD');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Verification QR Code', 105, 80, {align: 'center'});
    
    // Add BuildSat footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('© BuildSat - Building Compliance Analysis Tool', 105, 280, {align: 'center'});
    
    // Save the PDF
    doc.save(`BuildSat_Compliance_Report_${reportData.project_name || 'Project'}.pdf`);
    
    // Hide loading overlay
    hideLoading();
    
    // Show success message
    showToast('PDF report generated successfully', 'success');
}
