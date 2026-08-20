import os
import logging
import json
import hashlib
from flask import Flask, render_template, request, jsonify, flash, redirect, url_for, session
from werkzeug.utils import secure_filename
import tempfile
from werkzeug.middleware.proxy_fix import ProxyFix

from ifc_processor import process_ifc_file, check_door_compliance
from ai_analyzer import extract_building_codes
from utils import allowed_file, generate_report_hash
from texas_building_codes import get_building_codes_for_zip, validate_texas_zip_code, get_zip_code_info

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create the Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "planpass-dev-secret")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure upload settings
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max upload
app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()
app.config['ALLOWED_EXTENSIONS'] = {'ifc', 'pdf'}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/validate-zip', methods=['POST'])
def validate_zip_code():
    data = request.get_json()
    zip_code = data.get('zip_code', '').strip()
    
    if not zip_code:
        return jsonify({'success': False, 'error': 'Zip code is required'}), 400
    
    zip_info = get_zip_code_info(zip_code)
    return jsonify({'success': True, 'zip_info': zip_info})

@app.route('/upload', methods=['POST'])
def upload_files():
    # Check if IFC file is present in the request
    if 'ifc_file' not in request.files:
        flash('IFC file is required', 'error')
        return jsonify({'success': False, 'error': 'Missing IFC file'}), 400
    
    ifc_file = request.files['ifc_file']
    zip_code = request.form.get('zip_code', '').strip()
    
    # Validate IFC file
    if ifc_file.filename == '':
        flash('No IFC file selected', 'error')
        return jsonify({'success': False, 'error': 'No IFC file selected'}), 400
    
    if not allowed_file(ifc_file.filename, {'ifc'}):
        flash('Invalid file format. Please upload an IFC file', 'error')
        return jsonify({'success': False, 'error': 'Invalid IFC file format'}), 400
    
    # Validate zip code
    if not zip_code:
        flash('Texas zip code is required', 'error')
        return jsonify({'success': False, 'error': 'Zip code is required'}), 400
    
    if not validate_texas_zip_code(zip_code):
        flash('Please enter a valid Texas zip code', 'error')
        return jsonify({'success': False, 'error': 'Invalid Texas zip code'}), 400
    
    try:
        # Save IFC file temporarily
        ifc_filename = secure_filename(ifc_file.filename or 'model.ifc')
        ifc_path = os.path.join(app.config['UPLOAD_FOLDER'], ifc_filename)
        ifc_file.save(ifc_path)
        
        # Process the IFC file to extract model data
        ifc_data = process_ifc_file(ifc_path)
        
        # Get building codes based on zip code
        building_codes = get_building_codes_for_zip(zip_code)
        
        # Check door compliance against building codes
        compliance_results = check_door_compliance(ifc_data, building_codes)
        
        # Generate report hash for verification
        report_hash = generate_report_hash(compliance_results)
        
        # Store results in session for later access
        session['ifc_data'] = ifc_data
        session['compliance_results'] = compliance_results
        session['report_hash'] = report_hash
        session['zip_code'] = zip_code
        
        # Clean up temporary files
        os.remove(ifc_path)
        
        return jsonify({
            'success': True,
            'message': 'Files processed successfully',
            'ifc_data': ifc_data,
            'compliance_results': compliance_results,
            'report_hash': report_hash
        })
        
    except Exception as e:
        logger.error(f"Error processing files: {str(e)}")
        flash('Error processing files', 'error')
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/generate-report', methods=['POST'])
def generate_report():
    try:
        # Get results from session
        compliance_results = session.get('compliance_results', {})
        report_hash = session.get('report_hash', '')
        
        # Return report data
        return jsonify({
            'success': True,
            'report': compliance_results,
            'verification_hash': report_hash,
            'timestamp': session.get('timestamp', '')
        })
        
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
