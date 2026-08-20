import ifcopenshell
import os
import tempfile

def create_simple_ifc():
    # Create a new IFC file
    ifc_file = ifcopenshell.file()
    
    # Create header
    ifc_file.wrapped_data.header.file_name.name = "SampleBuilding"
    ifc_file.wrapped_data.header.file_name.time_stamp = "2025-05-20T12:00:00"
    ifc_file.wrapped_data.header.file_name.author = ("PlanPass", "Sample Generator")
    ifc_file.wrapped_data.header.file_name.organization = ("PlanPass", "Compliance Checking")
    ifc_file.wrapped_data.header.file_name.preprocessor_version = "IfcOpenShell"
    ifc_file.wrapped_data.header.file_name.originating_system = "PlanPass"
    ifc_file.wrapped_data.header.file_name.authorization = "None"
    
    # Create basic units
    length_unit = ifc_file.create_entity("IfcSIUnit", Name="METRE")
    
    # Create project
    project = ifc_file.create_entity("IfcProject", 
                                     GlobalId=ifcopenshell.guid.new(), 
                                     Name="Sample Building Project")
    
    # Create site
    site = ifc_file.create_entity("IfcSite", 
                                 GlobalId=ifcopenshell.guid.new(), 
                                 Name="Site")
    
    # Create building
    building = ifc_file.create_entity("IfcBuilding", 
                                     GlobalId=ifcopenshell.guid.new(), 
                                     Name="Sample Building")
    
    # Create stories
    storey1 = ifc_file.create_entity("IfcBuildingStorey", 
                                    GlobalId=ifcopenshell.guid.new(), 
                                    Name="Level 1")
    
    storey2 = ifc_file.create_entity("IfcBuildingStorey", 
                                    GlobalId=ifcopenshell.guid.new(), 
                                    Name="Level 2")
    
    # Create several doors with different widths
    doors = []
    
    # Door 1 - Compliant (36 inches)
    door1 = ifc_file.create_entity("IfcDoor", 
                                  GlobalId=ifcopenshell.guid.new(), 
                                  Name="Door 1",
                                  OverallWidth=0.9144,  # 36 inches in meters
                                  OverallHeight=2.032)  # 80 inches in meters
    doors.append(door1)
    
    # Door 2 - Not compliant (28 inches)
    door2 = ifc_file.create_entity("IfcDoor", 
                                  GlobalId=ifcopenshell.guid.new(), 
                                  Name="Door 2",
                                  OverallWidth=0.7112,  # 28 inches in meters
                                  OverallHeight=2.032)  # 80 inches in meters
    doors.append(door2)
    
    # Door 3 - Not compliant (30 inches)
    door3 = ifc_file.create_entity("IfcDoor", 
                                  GlobalId=ifcopenshell.guid.new(), 
                                  Name="Door 3",
                                  OverallWidth=0.762,   # 30 inches in meters
                                  OverallHeight=2.032)  # 80 inches in meters
    doors.append(door3)
    
    # Door 4 - Compliant (34 inches)
    door4 = ifc_file.create_entity("IfcDoor", 
                                  GlobalId=ifcopenshell.guid.new(), 
                                  Name="Door 4",
                                  OverallWidth=0.8636,  # 34 inches in meters
                                  OverallHeight=2.032)  # 80 inches in meters
    doors.append(door4)
    
    # Door 5 - Not compliant (31 inches)
    door5 = ifc_file.create_entity("IfcDoor", 
                                  GlobalId=ifcopenshell.guid.new(), 
                                  Name="Door 5",
                                  OverallWidth=0.7874,  # 31 inches in meters
                                  OverallHeight=2.032)  # 80 inches in meters
    doors.append(door5)
    
    # Create relationships to assign doors to storeys
    # For Level 1
    for i in range(3):
        rel = ifc_file.create_entity("IfcRelContainedInSpatialStructure",
                                    GlobalId=ifcopenshell.guid.new(),
                                    Name=f"Assignment to Storey 1",
                                    RelatingStructure=storey1,
                                    RelatedElements=[doors[i]])
    
    # For Level 2
    for i in range(3, 5):
        rel = ifc_file.create_entity("IfcRelContainedInSpatialStructure",
                                    GlobalId=ifcopenshell.guid.new(),
                                    Name=f"Assignment to Storey 2",
                                    RelatingStructure=storey2,
                                    RelatedElements=[doors[i]])
    
    # Save the file
    file_path = os.path.join("sample_files", "sample_building.ifc")
    ifc_file.write(file_path)
    print(f"Sample IFC file created: {file_path}")
    return file_path

if __name__ == "__main__":
    create_simple_ifc()