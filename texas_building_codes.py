"""
Texas Building Code Database by Zip Code
Maps Texas zip codes to their applicable building codes and jurisdictions
"""

import json
import logging

logger = logging.getLogger(__name__)

# Texas Major Cities and their building code requirements
TEXAS_BUILDING_CODES = {
    # Houston Metro Area
    "77001": {"city": "Houston", "county": "Harris", "jurisdiction": "City of Houston", "door_width": 32.0, "special_requirements": ["Houston Green Building Ordinance"]},
    "77002": {"city": "Houston", "county": "Harris", "jurisdiction": "City of Houston", "door_width": 32.0, "special_requirements": ["Houston Green Building Ordinance"]},
    "77003": {"city": "Houston", "county": "Harris", "jurisdiction": "City of Houston", "door_width": 32.0, "special_requirements": ["Houston Green Building Ordinance"]},
    "77004": {"city": "Houston", "county": "Harris", "jurisdiction": "City of Houston", "door_width": 32.0, "special_requirements": ["Houston Green Building Ordinance"]},
    "77005": {"city": "Houston", "county": "Harris", "jurisdiction": "City of Houston", "door_width": 32.0, "special_requirements": ["Houston Green Building Ordinance"]},
    
    # Dallas Metro Area
    "75201": {"city": "Dallas", "county": "Dallas", "jurisdiction": "City of Dallas", "door_width": 32.0, "special_requirements": ["Dallas Green Building Program"]},
    "75202": {"city": "Dallas", "county": "Dallas", "jurisdiction": "City of Dallas", "door_width": 32.0, "special_requirements": ["Dallas Green Building Program"]},
    "75203": {"city": "Dallas", "county": "Dallas", "jurisdiction": "City of Dallas", "door_width": 32.0, "special_requirements": ["Dallas Green Building Program"]},
    "75204": {"city": "Dallas", "county": "Dallas", "jurisdiction": "City of Dallas", "door_width": 32.0, "special_requirements": ["Dallas Green Building Program"]},
    "75205": {"city": "Dallas", "county": "Dallas", "jurisdiction": "City of Dallas", "door_width": 32.0, "special_requirements": ["Dallas Green Building Program"]},
    
    # Austin Metro Area
    "78701": {"city": "Austin", "county": "Travis", "jurisdiction": "City of Austin", "door_width": 32.0, "special_requirements": ["Austin Energy Green Building Program", "Land Development Code"]},
    "78702": {"city": "Austin", "county": "Travis", "jurisdiction": "City of Austin", "door_width": 32.0, "special_requirements": ["Austin Energy Green Building Program", "Land Development Code"]},
    "78703": {"city": "Austin", "county": "Travis", "jurisdiction": "City of Austin", "door_width": 32.0, "special_requirements": ["Austin Energy Green Building Program", "Land Development Code"]},
    "78704": {"city": "Austin", "county": "Travis", "jurisdiction": "City of Austin", "door_width": 32.0, "special_requirements": ["Austin Energy Green Building Program", "Land Development Code"]},
    "78705": {"city": "Austin", "county": "Travis", "jurisdiction": "City of Austin", "door_width": 32.0, "special_requirements": ["Austin Energy Green Building Program", "Land Development Code"]},
    
    # San Antonio Metro Area
    "78201": {"city": "San Antonio", "county": "Bexar", "jurisdiction": "City of San Antonio", "door_width": 32.0, "special_requirements": ["Unified Development Code"]},
    "78202": {"city": "San Antonio", "county": "Bexar", "jurisdiction": "City of San Antonio", "door_width": 32.0, "special_requirements": ["Unified Development Code"]},
    "78203": {"city": "San Antonio", "county": "Bexar", "jurisdiction": "City of San Antonio", "door_width": 32.0, "special_requirements": ["Unified Development Code"]},
    "78204": {"city": "San Antonio", "county": "Bexar", "jurisdiction": "City of San Antonio", "door_width": 32.0, "special_requirements": ["Unified Development Code"]},
    "78205": {"city": "San Antonio", "county": "Bexar", "jurisdiction": "City of San Antonio", "door_width": 32.0, "special_requirements": ["Unified Development Code"]},
    
    # Fort Worth Metro Area
    "76101": {"city": "Fort Worth", "county": "Tarrant", "jurisdiction": "City of Fort Worth", "door_width": 32.0, "special_requirements": ["Fort Worth Development Code"]},
    "76102": {"city": "Fort Worth", "county": "Tarrant", "jurisdiction": "City of Fort Worth", "door_width": 32.0, "special_requirements": ["Fort Worth Development Code"]},
    "76103": {"city": "Fort Worth", "county": "Tarrant", "jurisdiction": "City of Fort Worth", "door_width": 32.0, "special_requirements": ["Fort Worth Development Code"]},
    "76104": {"city": "Fort Worth", "county": "Tarrant", "jurisdiction": "City of Fort Worth", "door_width": 32.0, "special_requirements": ["Fort Worth Development Code"]},
    "76105": {"city": "Fort Worth", "county": "Tarrant", "jurisdiction": "City of Fort Worth", "door_width": 32.0, "special_requirements": ["Fort Worth Development Code"]},
    
    # El Paso Metro Area
    "79901": {"city": "El Paso", "county": "El Paso", "jurisdiction": "City of El Paso", "door_width": 32.0, "special_requirements": ["El Paso Building Code"]},
    "79902": {"city": "El Paso", "county": "El Paso", "jurisdiction": "City of El Paso", "door_width": 32.0, "special_requirements": ["El Paso Building Code"]},
    "79903": {"city": "El Paso", "county": "El Paso", "jurisdiction": "City of El Paso", "door_width": 32.0, "special_requirements": ["El Paso Building Code"]},
    "79904": {"city": "El Paso", "county": "El Paso", "jurisdiction": "City of El Paso", "door_width": 32.0, "special_requirements": ["El Paso Building Code"]},
    "79905": {"city": "El Paso", "county": "El Paso", "jurisdiction": "City of El Paso", "door_width": 32.0, "special_requirements": ["El Paso Building Code"]},
}

def get_building_codes_for_zip(zip_code):
    """
    Get building code requirements for a specific Texas zip code.
    
    Args:
        zip_code (str): 5-digit Texas zip code
        
    Returns:
        dict: Building code requirements including jurisdiction and special requirements
    """
    try:
        zip_code = str(zip_code).strip()
        
        if zip_code in TEXAS_BUILDING_CODES:
            location_info = TEXAS_BUILDING_CODES[zip_code]
            
            # Base Texas building code requirements
            building_codes = {
                "min_door_width": location_info["door_width"],
                "source": f"Texas Building Code - {location_info['jurisdiction']}",
                "location": {
                    "zip_code": zip_code,
                    "city": location_info["city"],
                    "county": location_info["county"],
                    "jurisdiction": location_info["jurisdiction"]
                },
                "requirements": [
                    f"Minimum door width: {location_info['door_width']} inches (IBC Section 1010.1.1)",
                    "Clear opening width measured between face of door and stop, with door open 90 degrees",
                    "Door opening height shall not be less than 80 inches (Texas Building Code)",
                    "Doors shall be of the pivoted or side-hinged swinging type for egress",
                    "Maximum opening force: 5 pounds for interior doors (not fire doors)"
                ],
                "exceptions": [
                    "Storage closets less than 10 square feet are exempt from minimum width",
                    "Doors not part of required means of egress in Group R-2 and R-3 occupancies",
                    "Resident sleeping units in Group I-3 occupancies: minimum 28 inches"
                ],
                "special_requirements": location_info.get("special_requirements", []),
                "reference_sections": [
                    "International Building Code (IBC) Section 1010.1.1",
                    "Texas Building Code Chapter 10",
                    "Texas Accessibility Standards (TAS) Section 404.2.3",
                    f"{location_info['jurisdiction']} Local Amendments"
                ]
            }
            
            logger.info(f"Found building codes for {location_info['city']}, TX ({zip_code})")
            return building_codes
            
        else:
            # Return generic Texas building codes for unknown zip codes
            logger.warning(f"Zip code {zip_code} not found in database, using default Texas codes")
            return get_default_texas_building_codes(zip_code)
            
    except Exception as e:
        logger.error(f"Error getting building codes for zip {zip_code}: {str(e)}")
        return get_default_texas_building_codes(zip_code)

def get_default_texas_building_codes(zip_code=""):
    """
    Return default Texas building codes when specific zip code is not found.
    
    Args:
        zip_code (str): The zip code that was requested
        
    Returns:
        dict: Default Texas building codes
    """
    return {
        "min_door_width": 32.0,
        "source": "Texas Building Code (Default)",
        "location": {
            "zip_code": zip_code,
            "city": "Unknown",
            "county": "Unknown",
            "jurisdiction": "State of Texas"
        },
        "requirements": [
            "Minimum door width: 32 inches (IBC Section 1010.1.1)",
            "Clear opening width measured between face of door and stop, with door open 90 degrees",
            "Door opening height shall not be less than 80 inches",
            "Doors shall be of the pivoted or side-hinged swinging type for egress",
            "Maximum opening force: 5 pounds for interior doors (not fire doors)"
        ],
        "exceptions": [
            "Storage closets less than 10 square feet are exempt from minimum width",
            "Doors not part of required means of egress in Group R-2 and R-3 occupancies",
            "Resident sleeping units in Group I-3 occupancies: minimum 28 inches"
        ],
        "special_requirements": [],
        "reference_sections": [
            "International Building Code (IBC) Section 1010.1.1",
            "Texas Building Code Chapter 10",
            "Texas Accessibility Standards (TAS) Section 404.2.3"
        ]
    }

def validate_texas_zip_code(zip_code):
    """
    Validate if the provided zip code is a valid Texas zip code format.
    
    Args:
        zip_code (str): The zip code to validate
        
    Returns:
        bool: True if valid format, False otherwise
    """
    try:
        zip_code = str(zip_code).strip()
        
        # Check if it's 5 digits
        if not zip_code.isdigit() or len(zip_code) != 5:
            return False
            
        # Texas zip codes generally range from 73301 to 88595
        zip_int = int(zip_code)
        if zip_int < 73000 or zip_int > 89000:
            return False
            
        return True
        
    except:
        return False

def get_zip_code_info(zip_code):
    """
    Get location information for a zip code.
    
    Args:
        zip_code (str): The zip code to look up
        
    Returns:
        dict: Location information or None if not found
    """
    try:
        zip_code = str(zip_code).strip()
        
        if zip_code in TEXAS_BUILDING_CODES:
            info = TEXAS_BUILDING_CODES[zip_code]
            return {
                "valid": True,
                "city": info["city"],
                "county": info["county"],
                "jurisdiction": info["jurisdiction"],
                "message": f"Found: {info['city']}, {info['county']} County"
            }
        elif validate_texas_zip_code(zip_code):
            return {
                "valid": True,
                "city": "Unknown",
                "county": "Unknown", 
                "jurisdiction": "State of Texas",
                "message": f"Valid Texas zip code. Using default state building codes."
            }
        else:
            return {
                "valid": False,
                "message": "Invalid or non-Texas zip code. Please enter a valid 5-digit Texas zip code."
            }
            
    except Exception as e:
        logger.error(f"Error validating zip code {zip_code}: {str(e)}")
        return {
            "valid": False,
            "message": "Error validating zip code."
        }