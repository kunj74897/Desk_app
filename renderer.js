const React = require('react');
const ReactDOM = require('react-dom');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const findCoordinates = async (pdfPath) => {
    try {
        const bytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(bytes);
        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();
        
        console.log('PDF dimensions:', { width, height });
        return { width, height };
    } catch (error) {
        console.error('Error reading PDF:', error);
    }
};
const AadharForm = () => {
    const [formData, setFormData] = React.useState({
        name: '',
        aadharNo: '',
        mobileNo: '',
        verificationName: '',
        hofName: '',
        hofAadhar: '',
        hofRelation: '',
        birthdate: '',
        age: '',
        pdb: '',
        gender: '',
        email: '',
        careOf: '',
        houseNo: '',
        street: '',
        landmark: '',
        area: '',
        village: '',
        postOffice: '',
        pincode: '',
        subDistrict: '',
        district: '',
        state: '',
        poi: '',
        poa: '',
        residentialType: '',
        isVerificationNameLocked: false
    });

    const [selectedFields, setSelectedFields] = React.useState({
        hof: false,
        gender: false,
        email: false,
        birthdate: false,
        address: false
    });

    const calculateAge = (birthDate) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        setFormData(prev => ({ ...prev, age: age.toString() }));
    };

    const formatAadharNumber = (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        
        // Add spaces after every 4 digits
        const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
        
        // Limit to 12 digits (plus spaces)
        return formatted.slice(0, 14);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'aadharNo' || name === 'hofAadhar') {
            // Format Aadhar numbers with spaces
            const formattedValue = formatAadharNumber(value);
            setFormData(prev => ({ ...prev, [name]: formattedValue }));
        } else if (name === 'birthdate') {
            setFormData(prev => ({ ...prev, [name]: value }));
            calculateAge(value);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCheckboxChange = (field) => {
        setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const fillPDF = async (formData) => {
        try {
            const templatePath = path.join(__dirname, 'template.pdf');
            if (!fs.existsSync(templatePath)) {
                throw new Error('Template PDF not found');
            }

            const templateBytes = fs.readFileSync(templatePath);
            const pdfDoc = await PDFDocument.load(templateBytes);
            
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const zapfDingbatsFont = await pdfDoc.embedFont(StandardFonts.ZapfDingbats);
            
            const page = pdfDoc.getPages()[0];


            const coordinates = {
                update: { x: 258, y: 720, symbol: '✓', font: zapfDingbatsFont },
                name: { x: 110, y: 678, maxChars: 30, spacing: 0.5 },
                aadharNo: { x: 218, y: 300, maxChars: 12, spacing: 2.5 },
                mobileNo: { x: 468, y: 612, maxChars: 10, spacing: 2.3 },
                hofName: { x: 195, y: 437, maxChars: 30, spacing: 0.5 },
                hofAadhar: { x: 422, y: 436, maxChars: 12, spacing: 2.5 },
                hofRelation: { 
                    options: { 
                        mother: { x: 205, y: 423, symbol: '✓', font: zapfDingbatsFont },
                        father: { x: 265, y: 430, symbol: '✓', font: zapfDingbatsFont },
                        'legal guardian': { x: 335, y: 430, symbol: '✓', font: zapfDingbatsFont },
                        spouse: { x: 320, y: 320, symbol: '✓', font: zapfDingbatsFont },
                        'child/ward': { x: 448, y: 320, symbol: '✓', font: zapfDingbatsFont },
                        sibling: { x: 548, y: 320, symbol: '✓', font: zapfDingbatsFont },
                    }
                 },
                gender: {  
                    options: { 
                        male: { x: 68, y: 640, symbol: '✓', font: zapfDingbatsFont },
                        female: { x: 120, y: 652, symbol: '✓', font: zapfDingbatsFont },
                        'third gender/transgender': { x: 68, y: 624, symbol: '✓', font: zapfDingbatsFont }
                    }
                },
                email: { x: 150, y: 490, maxChars: 35 },
                birthdate: { x: 150, y: 460, maxChars: 10 },
                age: { x: 300, y: 460, maxChars: 3 },
                pdb: { x: 450, y: 460, maxChars: 30 },
                careOf: { x: 150, y: 430, maxChars: 30 },
                houseNo: { x: 150, y: 400, maxChars: 20 },
                street: { x: 150, y: 370, maxChars: 30 },
                landmark: { x: 150, y: 340, maxChars: 30 },
                area: { x: 150, y: 310, maxChars: 30 },
                village: { x: 150, y: 280, maxChars: 30 },
                postOffice: { x: 150, y: 250, maxChars: 30 },
                pincode: { x: 150, y: 220, maxChars: 6, spacing: 10 },
                subDistrict: { x: 150, y: 190, maxChars: 30 },
                district: { x: 150, y: 160, maxChars: 30 },
                state: { x: 150, y: 130, maxChars: 30 },
                residentialType: {
                    x: 150,
                    y: 600,
                    options: {
                        'indian residential': { x: 143, y: 704, symbol: '✓', font: zapfDingbatsFont },
                        'non residential indian': { x: 258, y: 704, symbol: '✓', font: zapfDingbatsFont }
                    }
                }
            };
    
            const drawTextInBoxes = (text, config) => {
                const { x, y, maxChars, spacing = 0.5 } = config;
                
                // Handle the update checkbox
                if (config.symbol) {
                    page.drawText(config.symbol, {
                        x: config.x,
                        y: config.y,
                        size: 10,
                        font: config.font || helveticaFont,
                        color: rgb(0, 0, 0)
                    });
                    return;
                }
                
                if (config.options) {
                    const option = config.options[text.toLowerCase()];
                    if (option) {
                        page.drawText(option.symbol, {
                            x: option.x,
                            y: option.y,
                            size: 10,
                            font: option.font || helveticaFont,
                            color: rgb(0, 0, 0)
                        });
                    }
                } else {
                    // Process text based on field type
                    let processedText = text;
                    if (text.includes(' ')) {
                        // Remove existing spaces first
                        processedText = text.replace(/\s/g, '');
                    }
                    
                    // Add spaces for Aadhar numbers
                    if (config.maxChars === 12 && processedText.length === 12) {
                        processedText = processedText.replace(/(\d{4})(?=.)/g, '$1 ');
                    }

                    const chars = processedText.split('');
                    chars.forEach((char, index) => {
                        if (index < maxChars) {
                            let xOffset = x + (index * (8 + spacing));
                            
                            // Adjust offset for Aadhar number spaces
                            if (config.maxChars === 12 && index > 3) {
                                xOffset += 4; // Add extra space after every 4 digits
                            }
                            if (config.maxChars === 12 && index > 7) {
                                xOffset += 4; // Add extra space after 8 digits
                            }
                            
                            page.drawText(char, {
                                x: xOffset,
                                y: y,
                                size: 10,
                                font: helveticaFont,
                                color: rgb(0, 0, 0)
                            });
                        }
                    });
                }
            };
    
            // Draw the update checkbox first
            drawTextInBoxes('✓', coordinates.update);

            // Handle the rest of the form data
            Object.entries(formData).forEach(([key, value]) => {
                if (value && coordinates[key]) {
                    const config = coordinates[key];
                    if (key === 'aadharNo' || key === 'hofAadhar') {
                        // Format Aadhar numbers with proper spacing
                        const cleanValue = value.replace(/\s/g, '');
                        drawTextInBoxes(cleanValue, config);
                    } else {
                        drawTextInBoxes(value.toString(), config);
                    }
                }
            });
    
            // Modified preview section
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            try {
                window.open(url, '_blank');
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                }, 1000);
            } catch (error) {
                console.error('Preview error:', error);
                alert('Error opening PDF preview: ' + error.message);
                window.URL.revokeObjectURL(url);
            }

        } catch (error) {
            console.error('PDF Generation Error:', error);
            console.error('Error Stack:', error.stack);
            alert('Error generating PDF: ' + error.message);
        }
    };

    return React.createElement('form', { className: 'form-container' },
        React.createElement('h2', { className: 'form-title' }, 'Aadhar Information Form'),
        
        // Basic Information
        React.createElement('div', { className: 'section' },
            React.createElement('h3', null, 'Basic Information'),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', { className: 'required' }, 'Full Name'),
                React.createElement('input', {
                    type: 'text',
                    name: 'name',
                    value: formData.name,
                    onChange: handleInputChange,
                    required: true
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', { className: 'required' }, 'Aadhar Number'),
                React.createElement('input', {
                    type: 'text',
                    name: 'aadharNo',
                    value: formData.aadharNo,
                    onChange: handleInputChange,
                    placeholder: 'XXXX XXXX XXXX',
                    maxLength: 14,
                    required: true
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', { className: 'required' }, 'Mobile Number'),
                React.createElement('input', {
                    type: 'tel',
                    name: 'mobileNo',
                    pattern: '[0-9]{10}',
                    value: formData.mobileNo,
                    onChange: handleInputChange,
                    required: true
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', { className: 'required' }, 'Residential Type'),
                React.createElement('div', { className: 'radio-group' },
                    ['Indian Residential', 'Non Residential Indian'].map(type =>
                        React.createElement('label', { key: type, className: 'radio-label' },
                            React.createElement('input', {
                                type: 'radio',
                                name: 'residentialType',
                                value: type.toLowerCase(),
                                checked: formData.residentialType === type.toLowerCase(),
                                onChange: handleInputChange,
                                required: true
                            }),
                            type
                        )
                    )
                )
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', { className: 'required' }, 'Verification Name'),
                React.createElement('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } },
                    React.createElement('input', {
                        type: 'text',
                        name: 'verificationName',
                        value: formData.verificationName,
                        onChange: handleInputChange,
                        required: true,
                        readOnly: formData.isVerificationNameLocked
                    }),
                    React.createElement('label', { className: 'checkbox-label' },
                        React.createElement('input', {
                            type: 'checkbox',
                            checked: formData.isVerificationNameLocked,
                            onChange: (e) => {
                                setFormData(prev => ({
                                    ...prev,
                                    isVerificationNameLocked: e.target.checked
                                }));
                            }
                        }),
                        'Lock verification name'
                    )
                )
            )
        ),
        
        // Activation Checkboxes
        React.createElement('div', { className: 'activation-checkboxes' },
            ['hof', 'gender', 'email', 'birthdate', 'address'].map((field) =>
                React.createElement('label', { key: field, className: 'checkbox-label' },
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: selectedFields[field],
                        onChange: () => handleCheckboxChange(field)
                    }),
                    ` ${field.charAt(0).toUpperCase() + field.slice(1)}`
                )
            )
        ),

        // Conditional Sections
        selectedFields.hof && React.createElement('div', { className: 'section' },
            React.createElement('h3', null, 'Head of Family Details'),
            React.createElement('div', { className: 'input-group' },
                React.createElement('div', { className: 'form-group' },
                    React.createElement('label', null, 'HOF Name'),
                    React.createElement('input', {
                        type: 'text',
                        name: 'hofName',
                        value: formData.hofName,
                        onChange: handleInputChange,
                        disabled: !selectedFields.hof
                    })
                ),
                React.createElement('div', { className: 'form-group' },
                    React.createElement('label', null, 'HOF Aadhar Number'),
                    React.createElement('input', {
                        type: 'text',
                        name: 'hofAadhar',
                        value: formData.hofAadhar,
                        onChange: handleInputChange,
                        placeholder: 'XXXX XXXX XXXX',
                        maxLength: 14,
                        disabled: !selectedFields.hof
                    })
                ),
                React.createElement('div', { className: 'form-group' },
                    React.createElement('label', null, 'HOF Relation'),
                    React.createElement('div', { className: 'radio-group' },
                        ['Mother', 'Father', 'Legal Guardian', 'Spouse', 'Child/Ward', 'Sibling'].map(relation =>
                            React.createElement('label', { key: relation, className: 'radio-label' },
                                React.createElement('input', {
                                    type: 'radio',
                                    name: 'hofRelation',
                                    value: relation.toLowerCase(),
                                    checked: formData.hofRelation === relation.toLowerCase(),
                                    onChange: handleInputChange,
                                    disabled: !selectedFields.hof
                                }),
                                relation
                            )
                        )
                    )
                )
            )
        ),

        selectedFields.gender && React.createElement('div', { className: 'section' },
            React.createElement('h3', null, 'Gender'),
            React.createElement('div', { className: 'radio-group' },
                ['Male', 'Female', 'Third Gender/Transgender'].map(gender =>
                    React.createElement('label', { key: gender, className: 'radio-label' },
                        React.createElement('input', {
                            type: 'radio',
                            name: 'gender',
                            value: gender.toLowerCase(),
                            checked: formData.gender === gender.toLowerCase(),
                            onChange: handleInputChange,
                            disabled: !selectedFields.gender
                        }),
                        gender
                    )
                )
            )
        ),

        selectedFields.email && React.createElement('div', { className: 'section' },
            React.createElement('h3', null, 'Email Information'),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', { className: 'required' }, 'Email Address'),
                React.createElement('input', {
                    type: 'email',
                    name: 'email',
                    value: formData.email,
                    onChange: handleInputChange,
                    disabled: !selectedFields.email,
                    required: true
                })
            )
        ),

        selectedFields.birthdate && React.createElement('div', { className: 'section' },
            React.createElement('h3', null, 'Birth Details'),
            React.createElement('div', { className: 'input-group' },
                React.createElement('div', { className: 'form-group' },
                    React.createElement('label', null, 'Birth Date'),
                    React.createElement('input', {
                        type: 'date',
                        name: 'birthdate',
                        value: formData.birthdate,
                        onChange: handleInputChange,
                        disabled: !selectedFields.birthdate
                    })
                ),
                React.createElement('div', { className: 'form-group' },
                    React.createElement('label', null, 'Age'),
                    React.createElement('input', {
                        type: 'text',
                        name: 'age',
                        value: formData.age,
                        readOnly: true
                    })
                ),
                React.createElement('div', { className: 'form-group' },
                    React.createElement('label', null, 'Place of Birth'),
                    React.createElement('input', {
                        type: 'text',
                        name: 'pdb',
                        value: formData.pdb,
                        onChange: handleInputChange,
                        disabled: !selectedFields.birthdate
                    })
                )
            )
        ),

        selectedFields.address && React.createElement('div', { className: 'section' },
            React.createElement('h3', null, 'Address Details'),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', null, 'Care of (Optional)'),
                React.createElement('input', {
                    type: 'text',
                    name: 'careOf',
                    value: formData.careOf,
                    onChange: handleInputChange,
                    disabled: !selectedFields.address
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', { className: 'required' }, 'House No./Building/Apartment'),
                React.createElement('input', {
                    type: 'text',
                    name: 'houseNo',
                    value: formData.houseNo,
                    onChange: handleInputChange,
                    disabled: !selectedFields.address,
                    required: true
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', { className: 'required' }, 'Street/Road/Lane'),
                React.createElement('input', {
                    type: 'text',
                    name: 'street',
                    value: formData.street,
                    onChange: handleInputChange,
                    disabled: !selectedFields.address,
                    required: true
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', null, 'Landmark'),
                React.createElement('input', {
                    type: 'text',
                    name: 'landmark',
                    value: formData.landmark,
                    onChange: handleInputChange,
                    disabled: !selectedFields.address
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', { className: 'required' }, 'Area/Locality/Sector'),
                React.createElement('input', {
                    type: 'text',
                    name: 'area',
                    value: formData.area,
                    onChange: handleInputChange,
                    disabled: !selectedFields.address,
                    required: true
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', null, 'Village'),
                React.createElement('input', {
                    type: 'text',
                    name: 'village',
                    value: formData.village,
                    onChange: handleInputChange,
                    disabled: !selectedFields.address
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', null, 'Post Office'),
                React.createElement('input', {
                    type: 'text',
                    name: 'postOffice',
                    value: formData.postOffice,
                    onChange: handleInputChange,
                    disabled: !selectedFields.address
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', { className: 'required' }, 'Pincode'),
                React.createElement('input', {
                    type: 'text',
                    name: 'pincode',
                    value: formData.pincode,
                    onChange: handleInputChange,
                    disabled: !selectedFields.address,
                    required: true
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', null, 'Sub District'),
                React.createElement('input', {
                    type: 'text',
                    name: 'subDistrict',
                    value: formData.subDistrict,
                    onChange: handleInputChange,
                    disabled: !selectedFields.address
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', null, 'District'),
                React.createElement('input', {
                    type: 'text',
                    name: 'district',
                    value: formData.district,
                    onChange: handleInputChange,
                    disabled: !selectedFields.address
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', null, 'State'),
                React.createElement('input', {
                    type: 'text',
                    name: 'state',
                    value: formData.state,
                    onChange: handleInputChange,
                    disabled: !selectedFields.address
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', null, 'POI'),
                React.createElement('input', {
                    type: 'text',
                    name: 'poi',
                    value: formData.poi,
                    onChange: handleInputChange,
                    disabled: !selectedFields.address
                })
            ),
            React.createElement('div', { className: 'form-group' },
                React.createElement('label', null, 'POA'),
                React.createElement('input', {
                    type: 'text',
                    name: 'poa',
                    value: formData.poa,
                    onChange: handleInputChange,
                    disabled: !selectedFields.address
                })
            )
        ),

        React.createElement('button', {
            type: 'submit',
            className: 'submit-btn',
            onClick: async (e) => {
                e.preventDefault();
                try {
                    await fillPDF(formData);
                } catch (error) {
                    console.error('Submit error:', error);
                    alert('Error submitting form: ' + error.message);
                }
            }
        }, 'Generate & Print PDF')
    );
};

ReactDOM.render(
    React.createElement(AadharForm),
    document.getElementById('root')
);