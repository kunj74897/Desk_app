const { useState } = require('react');
const { PDFDocument, StandardFonts } = require('pdf-lib');

function AadharForm() {
    const [selectedFields, setSelectedFields] = useState({
        hof: false,
        gender: false,
        email: false,
        birthdate: false,
        address: false
    });

    const [formData, setFormData] = useState({
        name: '',
        aadharNo: '',
        mobileNo: '',
        verificationName: '',
        hof: '',
        gender: '',
        email: '',
        birthdate: '',
        address: ''
    });

    const handleCheckboxChange = (field) => {
        setSelectedFields(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const generatePDF = async () => {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { height, width } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        let yOffset = height - 50;

        // Add form data to PDF
        page.drawText(`Name: ${formData.name}`, {
            x: 50,
            y: yOffset,
            font,
            size: 12
        });

        yOffset -= 20;
        page.drawText(`Aadhar No: ${formData.aadharNo}`, {
            x: 50,
            y: yOffset,
            font,
            size: 12
        });

        // Add other fields based on selection
        if (selectedFields.hof) {
            yOffset -= 20;
            page.drawText(`Head of Family: ${formData.hof}`, {
                x: 50,
                y: yOffset,
                font,
                size: 12
            });
        }

        // Save PDF
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url);
    };

    return (
        <div className="form-container">
            <h2>Aadhar Information Form</h2>
            
            {/* Required Fields */}
            <div className="required-fields">
                <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="aadharNo"
                    placeholder="Aadhar Number"
                    value={formData.aadharNo}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="mobileNo"
                    placeholder="Mobile Number"
                    value={formData.mobileNo}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="verificationName"
                    placeholder="Verification Name"
                    value={formData.verificationName}
                    onChange={handleInputChange}
                />
            </div>

            {/* Optional Fields Checkboxes */}
            <div className="optional-fields">
                <label>
                    <input
                        type="checkbox"
                        checked={selectedFields.hof}
                        onChange={() => handleCheckboxChange('hof')}
                    />
                    Head of Family
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={selectedFields.gender}
                        onChange={() => handleCheckboxChange('gender')}
                    />
                    Gender
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={selectedFields.email}
                        onChange={() => handleCheckboxChange('email')}
                    />
                    Email
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={selectedFields.birthdate}
                        onChange={() => handleCheckboxChange('birthdate')}
                    />
                    Birth Date
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={selectedFields.address}
                        onChange={() => handleCheckboxChange('address')}
                    />
                    Address
                </label>
            </div>

            {/* Conditional Fields */}
            <div className="conditional-fields">
                {selectedFields.hof && (
                    <input
                        type="text"
                        name="hof"
                        placeholder="Head of Family Name"
                        value={formData.hof}
                        onChange={handleInputChange}
                    />
                )}
                {selectedFields.gender && (
                    <select name="gender" value={formData.gender} onChange={handleInputChange}>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                )}
                {selectedFields.email && (
                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                )}
                {selectedFields.birthdate && (
                    <input
                        type="date"
                        name="birthdate"
                        value={formData.birthdate}
                        onChange={handleInputChange}
                    />
                )}
                {selectedFields.address && (
                    <textarea
                        name="address"
                        placeholder="Full Address"
                        value={formData.address}
                        onChange={handleInputChange}
                    />
                )}
            </div>

            <button onClick={generatePDF}>Generate PDF</button>
        </div>
    );
}

module.exports = AadharForm; 