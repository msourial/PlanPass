import os
import logging
import ifcopenshell
import tempfile
import json

logger = logging.getLogger(__name__)

def process_ifc_file(file_path):
    """
    Process an IFC file and extract relevant data for compliance checking.
    
    Args:
        file_path (str): Path to the IFC file
        
    Returns:
        dict: Extracted IFC data with focus on doors
    """
    try:
        logger.info(f"Processing IFC file: {file_path}")
        
        # Load IFC file
        ifc_file = ifcopenshell.open(file_path)
        
        # Extract project info
        project = ifc_file.by_type("IfcProject")[0]
        project_name = project.Name or "Unnamed Project"
        
        # Extract doors information
        doors = ifc_file.by_type("IfcDoor")
        logger.info(f"Found {len(doors)} doors in the IFC file")
        
        doors_data = []
        for door in doors:
            door_data = {
                "id": door.id(),
                "name": door.Name if hasattr(door, "Name") and door.Name else f"Door-{door.id()}",
                "guid": door.GlobalId,
                "width": None,
                "height": None,
                "level": None,
                "type": None,
                "properties": {}
            }
            
            # Get door dimensions
            if hasattr(door, "OverallWidth") and door.OverallWidth:
                door_data["width"] = float(door.OverallWidth)
            if hasattr(door, "OverallHeight") and door.OverallHeight:
                door_data["height"] = float(door.OverallHeight)
                
            # Try to get dimensions from property sets
            if door_data["width"] is None or door_data["height"] is None:
                for rel in ifc_file.get_inverse(door):
                    if rel.is_a("IfcRelDefinesByProperties"):
                        property_set = rel.RelatingPropertyDefinition
                        if property_set.is_a("IfcPropertySet"):
                            for prop in property_set.HasProperties:
                                if prop.is_a("IfcPropertySingleValue"):
                                    prop_name = prop.Name
                                    if prop.NominalValue:
                                        prop_value = prop.NominalValue.wrappedValue
                                        door_data["properties"][prop_name] = prop_value
                                        
                                        # Check for width/height properties
                                        if "width" in prop_name.lower() and door_data["width"] is None:
                                            door_data["width"] = float(prop_value)
                                        elif "height" in prop_name.lower() and door_data["height"] is None:
                                            door_data["height"] = float(prop_value)
            
            # Get door level
            for rel in ifc_file.get_inverse(door):
                if rel.is_a("IfcRelContainedInSpatialStructure"):
                    container = rel.RelatingStructure
                    if container.is_a("IfcBuildingStorey"):
                        door_data["level"] = container.Name or f"Level {container.id()}"
            
            # Get door type
            for rel in ifc_file.get_inverse(door):
                if rel.is_a("IfcRelDefinesByType"):
                    door_type = rel.RelatingType
                    if door_type.is_a("IfcDoorType"):
                        door_data["type"] = door_type.Name or "Unknown Type"
            
            doors_data.append(door_data)
        
        # Create IFC data structure
        ifc_data = {
            "project_name": project_name,
            "doors": doors_data,
            "door_count": len(doors_data),
            "levels": list(set(door["level"] for door in doors_data if door["level"])),
        }
        
        # Extract building elements for 3D viewer
        building_elements = []
        for element in ifc_file.by_type("IfcBuildingElement"):
            if element.is_a() in ["IfcWall", "IfcSlab", "IfcBeam", "IfcColumn", "IfcDoor", "IfcWindow", "IfcRoof"]:
                element_data = {
                    "id": element.id(),
                    "type": element.is_a(),
                    "guid": element.GlobalId,
                }
                building_elements.append(element_data)
        
        ifc_data["building_elements"] = building_elements
        
        # Generate simplified geometry for viewer
        temp_json_path = os.path.join(tempfile.gettempdir(), f"ifc_geometry_{os.path.basename(file_path)}.json")
        ifc_data["geometry_path"] = temp_json_path
        
        logger.info(f"IFC processing complete for {project_name}")
        return ifc_data
        
    except Exception as e:
        logger.error(f"Error processing IFC file: {str(e)}")
        raise

def check_door_compliance(ifc_data, building_codes):
    """
    Check if doors in the IFC file comply with building codes.
    
    Args:
        ifc_data (dict): Processed IFC data
        building_codes (dict): Extracted building codes
        
    Returns:
        dict: Compliance results
    """
    try:
        logger.info("Checking door compliance")
        
        # Get door width requirements from building codes
        min_door_width = building_codes.get("min_door_width", 32.0)  # Default: 32 inches (Texas standard)
        
        # Check compliance for each door
        doors = ifc_data.get("doors", [])
        compliant_doors = []
        non_compliant_doors = []
        
        for door in doors:
            door_id = door.get("id")
            door_name = door.get("name")
            door_width = door.get("width")
            
            # Set compliance status
            is_compliant = False
            compliance_message = ""
            
            if door_width is None:
                is_compliant = False
                compliance_message = "Door width information missing"
            elif door_width >= min_door_width:
                is_compliant = True
                compliance_message = f"Door width ({door_width}) meets minimum requirement ({min_door_width})"
            else:
                is_compliant = False
                compliance_message = f"Door width ({door_width}) is less than minimum requirement ({min_door_width})"
            
            # Add compliance status to door data
            door_with_compliance = door.copy()
            door_with_compliance["is_compliant"] = is_compliant
            door_with_compliance["compliance_message"] = compliance_message
            
            if is_compliant:
                compliant_doors.append(door_with_compliance)
            else:
                non_compliant_doors.append(door_with_compliance)
        
        # Calculate compliance score
        total_doors = len(doors)
        compliant_count = len(compliant_doors)
        compliance_score = (compliant_count / total_doors * 100) if total_doors > 0 else 0
        
        # Generate compliance results
        compliance_results = {
            "project_name": ifc_data.get("project_name", "Unnamed Project"),
            "total_doors": total_doors,
            "compliant_doors": compliant_count,
            "non_compliant_doors": len(non_compliant_doors),
            "compliance_score": round(compliance_score, 2),
            "doors": {
                "compliant": compliant_doors,
                "non_compliant": non_compliant_doors
            },
            "building_code": {
                "source": "Texas Building Code",
                "min_door_width": min_door_width,
                "requirements": building_codes.get("requirements", [])
            }
        }
        
        logger.info(f"Compliance check complete. Score: {compliance_score}%")
        return compliance_results
        
    except Exception as e:
        logger.error(f"Error checking door compliance: {str(e)}")
        raise
