from fpdf import FPDF

def create_building_code_pdf():
    pdf = FPDF()
    pdf.add_page()
    
    # Add title
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "Texas Building Code - Door Width Requirements", 0, 1, "C")
    pdf.ln(10)
    
    # Add content
    pdf.set_font("Arial", "", 12)
    pdf.multi_cell(0, 10, "Section 1010.1.1 Size of Doors")
    pdf.multi_cell(0, 8, "The minimum width of each door opening shall be sufficient for the occupant load thereof and shall provide a clear width of 32 inches (813 mm). Clear openings of doorways with swinging doors shall be measured between the face of the door and the stop, with the door open 90 degrees.")
    pdf.ln(5)
    
    pdf.multi_cell(0, 10, "Exceptions:")
    pdf.multi_cell(0, 8, "1. The minimum and maximum width shall not apply to door openings that are not part of the required means of egress in Group R-2 and R-3 occupancies.")
    pdf.multi_cell(0, 8, "2. Door openings to resident sleeping units in Group I-3 occupancies shall have a clear width of not less than 28 inches (711 mm).")
    pdf.multi_cell(0, 8, "3. Door openings to storage closets less than 10 square feet (0.93 m²) in area shall not be limited by the minimum width.")
    pdf.ln(5)
    
    pdf.multi_cell(0, 10, "Section 1010.1.1.1 Projections into clear width")
    pdf.multi_cell(0, 8, "There shall not be projections into the required clear width lower than 34 inches (864 mm) above the floor or ground. Projections into the clear opening width between 34 inches (864 mm) and 80 inches (2032 mm) above the floor or ground shall not exceed 4 inches (102 mm).")
    pdf.ln(5)
    
    pdf.multi_cell(0, 10, "Texas Accessibility Standards (TAS)")
    pdf.multi_cell(0, 8, "Doors, Gates, and Turnstiles")
    pdf.multi_cell(0, 8, "404.2.3 Clear Width. Door openings shall provide a clear width of 32 inches (815 mm) minimum. Clear openings of doorways with swinging doors shall be measured between the face of the door and the stop, with the door open 90 degrees.")
    
    # Save the PDF
    pdf_path = "sample_files/texas-building-code.pdf"
    pdf.output(pdf_path)
    print(f"PDF saved to: {pdf_path}")

if __name__ == "__main__":
    create_building_code_pdf()