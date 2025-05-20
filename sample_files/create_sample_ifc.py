import ifcopenshell
import tempfile
import os

def create_sample_building():
    # Create a new IFC file
    ifc_file = ifcopenshell.file()
    
    # Create the project
    project = ifc_file.createIfcProject("3jKtLZzHf9tQi6Mv$r5xAR", 
                                         None, 
                                         "Sample Building", 
                                         None, 
                                         None, None, None, None, 
                                         None)
    
    # Create units
    unit_assignment = ifcopenshell.api.run("unit.assign_unit", ifc_file)
    
    # Create a site
    site = ifcopenshell.api.run("root.create_entity", ifc_file,
                                entity="IfcSite", name="Site")
    
    # Create a building
    building = ifcopenshell.api.run("root.create_entity", ifc_file,
                               entity="IfcBuilding", name="Sample Building")
    
    # Create levels/storeys
    storey1 = ifcopenshell.api.run("root.create_entity", ifc_file,
                               entity="IfcBuildingStorey", name="Level 1")
    storey2 = ifcopenshell.api.run("root.create_entity", ifc_file,
                               entity="IfcBuildingStorey", name="Level 2")
    
    # Assign storeys to building
    ifcopenshell.api.run("aggregate.assign_object", ifc_file,
                        relating_object=building, product=storey1)
    ifcopenshell.api.run("aggregate.assign_object", ifc_file,
                        relating_object=building, product=storey2)
    
    # Assign building to site
    ifcopenshell.api.run("aggregate.assign_object", ifc_file,
                        relating_object=site, product=building)
    
    # Assign site to project
    ifcopenshell.api.run("aggregate.assign_object", ifc_file,
                        relating_object=project, product=site)
    
    # Create walls, doors, etc. for Level 1
    # First wall
    wall1 = ifcopenshell.api.run("root.create_entity", ifc_file,
                             entity="IfcWall", name="Wall 1")
    
    # Second wall
    wall2 = ifcopenshell.api.run("root.create_entity", ifc_file,
                             entity="IfcWall", name="Wall 2")
    
    # Add walls to storey
    ifcopenshell.api.run("spatial.assign_container", ifc_file,
                        relating_structure=storey1, product=wall1)
    ifcopenshell.api.run("spatial.assign_container", ifc_file,
                        relating_structure=storey1, product=wall2)
    
    # Create doors - some compliant, some not
    # Compliant door (width > 32 inches)
    door1 = ifcopenshell.api.run("root.create_entity", ifc_file,
                             entity="IfcDoor", name="Door 1")
    door1.OverallWidth = 36.0  # 36 inches - compliant
    door1.OverallHeight = 80.0
    
    # Non-compliant door (width < 32 inches)
    door2 = ifcopenshell.api.run("root.create_entity", ifc_file,
                             entity="IfcDoor", name="Door 2")
    door2.OverallWidth = 28.0  # 28 inches - non-compliant
    door2.OverallHeight = 80.0
    
    # Another non-compliant door
    door3 = ifcopenshell.api.run("root.create_entity", ifc_file,
                             entity="IfcDoor", name="Door 3")
    door3.OverallWidth = 30.0  # 30 inches - non-compliant
    door3.OverallHeight = 80.0
    
    # Create doors for Level 2
    door4 = ifcopenshell.api.run("root.create_entity", ifc_file,
                             entity="IfcDoor", name="Door 4")
    door4.OverallWidth = 34.0  # 34 inches - compliant
    door4.OverallHeight = 80.0
    
    door5 = ifcopenshell.api.run("root.create_entity", ifc_file,
                             entity="IfcDoor", name="Door 5")
    door5.OverallWidth = 31.0  # 31 inches - non-compliant
    door5.OverallHeight = 80.0
    
    # Assign doors to storeys
    ifcopenshell.api.run("spatial.assign_container", ifc_file,
                        relating_structure=storey1, product=door1)
    ifcopenshell.api.run("spatial.assign_container", ifc_file,
                        relating_structure=storey1, product=door2)
    ifcopenshell.api.run("spatial.assign_container", ifc_file,
                        relating_structure=storey1, product=door3)
    ifcopenshell.api.run("spatial.assign_container", ifc_file,
                        relating_structure=storey2, product=door4)
    ifcopenshell.api.run("spatial.assign_container", ifc_file,
                        relating_structure=storey2, product=door5)
    
    # Save the IFC file
    output_path = os.path.join("sample_files", "sample-building.ifc")
    ifc_file.write(output_path)
    print(f"Sample IFC file created at: {output_path}")
    
    return output_path

if __name__ == "__main__":
    create_sample_building()