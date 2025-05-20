import os
import logging
import sys
import anthropic
from anthropic import Anthropic
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

def extract_building_codes(pdf_path):
    """
    Extract building codes from PDF using Claude AI.
    
    Args:
        pdf_path (str): Path to the building code PDF
        
    Returns:
        dict: Extracted building codes and requirements
    """
    try:
        logger.info(f"Extracting building codes from: {pdf_path}")
        
        # Extract text from PDF
        pdf_text = extract_text_from_pdf(pdf_path)
        
        # Initialize Anthropic client for Claude
        anthropic_key = os.environ.get('ANTHROPIC_API_KEY')
        if not anthropic_key:
            logger.warning("ANTHROPIC_API_KEY not found, using default building codes")
            return get_default_building_codes()
            
        client = Anthropic(api_key=anthropic_key)
        
        # Prepare prompt for Claude
        prompt = f"""
        I need to extract building code requirements related to door widths from this document, specifically for Texas building codes. Please analyze the text and extract:
        
        1. The minimum required door width for standard doors (in inches)
        2. Any exceptions or special cases
        3. Specific requirements for accessible doors or emergency exits
        
        Format the response as a structured JSON with the following fields:
        - min_door_width: The minimum width in inches
        - requirements: A list of text snippets from the code that specify requirements
        - exceptions: A list of any exceptions to the general rules
        - reference_sections: References to specific sections in the code
        
        Here's the document text:
        
        {pdf_text[:10000]}  # Limit text size to avoid token limits
        
        If you cannot find specific door width requirements, use the standard Texas building code which requires a minimum door width of 32 inches (81.3 cm) for all egress doors.
        """
        
        # Call Claude API
        # The newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            temperature=0,
            system="You are a building code expert specializing in analyzing construction documents and extracting specific requirements.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract and parse the JSON response
        response_text = response.content[0].text
        
        # In case we didn't get valid JSON, use default codes
        try:
            import json
            import re
            
            # Try to extract JSON from the response
            json_match = re.search(r'```json(.*?)```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1).strip()
                building_codes = json.loads(json_str)
            else:
                # If no JSON code block, try parsing the whole response
                building_codes = json.loads(response_text)
                
            logger.info("Successfully extracted building codes using Claude")
            return building_codes
            
        except Exception as json_error:
            logger.error(f"Error parsing Claude response: {str(json_error)}")
            logger.warning("Using default building codes")
            return get_default_building_codes()
            
    except Exception as e:
        logger.error(f"Error extracting building codes: {str(e)}")
        return get_default_building_codes()

def extract_text_from_pdf(pdf_path):
    """
    Extract text from a PDF file.
    
    Args:
        pdf_path (str): Path to the PDF file
        
    Returns:
        str: Extracted text
    """
    try:
        pdf_document = fitz.open(pdf_path)
        text = ""
        
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            text += page.get_text()
            
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        return ""

def get_default_building_codes():
    """
    Return default Texas building codes for door widths.
    
    Returns:
        dict: Default building codes
    """
    return {
        "min_door_width": 32.0,  # 32 inches (standard Texas requirement)
        "requirements": [
            "The minimum width for a standard door shall be 32 inches (81.3 cm).",
            "The clear opening width shall be measured between the face of the door and the stop, with the door open 90 degrees.",
            "Door openings within a dwelling unit shall not be less than 78 inches (1981 mm) in height."
        ],
        "exceptions": [
            "Doors to storage closets less than 10 square feet (0.93 m²) in area are exempt.",
            "Access doors or gates to swimming pools, spas and hot tubs shall comply with the special provisions in Section 3109.4.1.7."
        ],
        "reference_sections": [
            "Texas Building Code Section 1010.1.1",
            "International Building Code (IBC) Section 1010.1.1",
            "Texas Accessibility Standards (TAS)"
        ]
    }
