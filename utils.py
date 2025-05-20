import os
import hashlib
import json
import datetime
import logging

logger = logging.getLogger(__name__)

def allowed_file(filename, allowed_extensions=None):
    """
    Check if a file has an allowed extension.
    
    Args:
        filename (str): The filename to check
        allowed_extensions (set): Set of allowed extensions
        
    Returns:
        bool: True if file is allowed, False otherwise
    """
    if allowed_extensions is None:
        allowed_extensions = {'ifc', 'pdf'}
        
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def generate_report_hash(compliance_results):
    """
    Generate a SHA-256 hash of the compliance report for verification.
    
    Args:
        compliance_results (dict): The compliance results
        
    Returns:
        str: SHA-256 hash
    """
    try:
        # Add timestamp to the data
        timestamped_results = compliance_results.copy()
        timestamp = datetime.datetime.now().isoformat()
        timestamped_results['timestamp'] = timestamp
        
        # Convert to JSON and generate hash
        results_json = json.dumps(timestamped_results, sort_keys=True)
        hash_obj = hashlib.sha256(results_json.encode())
        report_hash = hash_obj.hexdigest()
        
        logger.info(f"Generated report hash: {report_hash}")
        return report_hash
        
    except Exception as e:
        logger.error(f"Error generating report hash: {str(e)}")
        return hashlib.sha256(datetime.datetime.now().isoformat().encode()).hexdigest()

def format_compliance_score(score):
    """
    Format compliance score with appropriate color and icon.
    
    Args:
        score (float): Compliance score (0-100)
        
    Returns:
        dict: Formatted score data
    """
    if score >= 90:
        status = "excellent"
        color = "#10B981"  # green
        icon = "check-circle"
    elif score >= 75:
        status = "good"
        color = "#3B82F6"  # blue
        icon = "info-circle"
    elif score >= 50:
        status = "warning"
        color = "#F59E0B"  # amber
        icon = "exclamation-triangle"
    else:
        status = "critical"
        color = "#EF4444"  # red
        icon = "exclamation-circle"
    
    return {
        "score": score,
        "status": status,
        "color": color,
        "icon": icon
    }
