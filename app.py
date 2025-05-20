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

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create the Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "buildsat-dev-secret")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure upload settings
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max upload
app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()
app.config['ALLOWED_EXTENSIONS'] = {'ifc', 'pdf'}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_files():
    # Check if files are present in the request
    if 'ifc_file' not in request.files or 'code_pdf' not in request.files:
        flash('Both IFC and PDF files are required', 'error')
        return jsonify({'success': False, 'error': 'Missing files'}), 400
    
    ifc_file = request.files['ifc_file']
    code_pdf = request.files['code_pdf']
    
    # Validate files
    if ifc_file.filename == '' or code_pdf.filename == '':
        flash('No file selected', 'error')
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    if not (allowed_file(ifc_file.filename, {'ifc'}) and allowed_file(code_pdf.filename, {'pdf'})):
        flash('Invalid file format', 'error')
        return jsonify({'success': False, 'error': 'Invalid file format'}), 400
    
    try:
        # Save files temporarily
        ifc_filename = secure_filename(ifc_file.filename)
        pdf_filename = secure_filename(code_pdf.filename)
        
        ifc_path = os.path.join(app.config['UPLOAD_FOLDER'], ifc_filename)
        pdf_path = os.path.join(app.config['UPLOAD_FOLDER'], pdf_filename)
        
        ifc_file.save(ifc_path)
        code_pdf.save(pdf_path)
        
        # Process the IFC file to extract model data
        ifc_data = process_ifc_file(ifc_path)
        
        # Extract building codes from PDF using Claude AI
        building_codes = extract_building_codes(pdf_path)
        
        # Check door compliance against building codes
        compliance_results = check_door_compliance(ifc_data, building_codes)
        
        # Generate report hash for verification
        report_hash = generate_report_hash(compliance_results)
        
        # Store results in session for later access
        session['ifc_data'] = ifc_data
        session['compliance_results'] = compliance_results
        session['report_hash'] = report_hash
        
        # Clean up temporary files
        os.remove(ifc_path)
        os.remove(pdf_path)
        
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
