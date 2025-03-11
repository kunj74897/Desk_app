const React = require('react');
const ReactDOM = require('react-dom');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { rgb } = require('pdf-lib');

const findCoordinates = async (pdfPath) => {
    try {
        const bytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(bytes);
        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();
        
        console.log('PDF dimensions:', { width, height });
        // This will help you map coordinates on the template
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'birthdate') calculateAge(value);
    };

    const handleCheckboxChange = (field) => {
        setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const fillPDF = async (formData) => {
        try {
            const templatePath = path.join(__dirname, 'template.pdf');
            await findCoordinates(templatePath);
            const templateBytes = fs.readFileSync(templatePath);
            const pdfDoc = await PDFDocument.load(templateBytes);
            const page = pdfDoc.getPages()[0];
            
            // Adjust these coordinates based on your template.pdf
            const coordinates = {
                // Basic Info
                name: { x: 150, y: 700, maxChars: 30 },
                aadharNo: { x: 150, y: 670, maxChars: 12, spacing: 1 },
                mobileNo: { x: 150, y: 640, maxChars: 10, spacing: 1 },
                
                // HOF Details
                hofName: { x: 150, y: 610, maxChars: 30 },
                hofAadhar: { x: 150, y: 580, maxChars: 12, spacing: 1 },
                hofRelation: { x: 150, y: 550, maxChars: 20 },
                
                // Gender & Email
                gender: { x: 150, y: 520, maxChars: 20 },
                email: { x: 150, y: 490, maxChars: 35 },
                
                // Birth Details
                birthdate: { x: 150, y: 460, maxChars: 10 },
                age: { x: 300, y: 460, maxChars: 3 },
                
                // Address fields (adjust Y coordinates as needed)
                careOf: { x: 150, y: 430, maxChars: 30 },
                houseNo: { x: 150, y: 400, maxChars: 20 },
                street: { x: 150, y: 370, maxChars: 30 },
                landmark: { x: 150, y: 340, maxChars: 30 },
                area: { x: 150, y: 310, maxChars: 30 },
                village: { x: 150, y: 280, maxChars: 30 },
                postOffice: { x: 150, y: 250, maxChars: 30 },
                pincode: { x: 150, y: 220, maxChars: 6, spacing: 1 },
                subDistrict: { x: 150, y: 190, maxChars: 30 },
                district: { x: 150, y: 160, maxChars: 30 },
                state: { x: 150, y: 130, maxChars: 30 }
            };

            // Function to handle character spacing for boxes
            const drawTextInBoxes = (text, config) => {
                const { x, y, maxChars, spacing = 0 } = config;
                const chars = text.split('');
                chars.forEach((char, index) => {
                    if (index < maxChars) {
                        page.drawText(char, {
                            x: x + (index * (12 + spacing)),
                            y: y,
                            size: 12,
                            color: rgb(0, 0, 0)
                        });
                    }
                });
            };

            // Fill the PDF with formatted text
            Object.entries(formData).forEach(([key, value]) => {
                if (value && coordinates[key]) {
                    const config = coordinates[key];
                    if (config.spacing !== undefined) {
                        // Draw in boxes for fields like Aadhar, Mobile, Pincode
                        drawTextInBoxes(value.toString(), config);
                    } else {
                        // Normal text for other fields
                        page.drawText(value.toString().substring(0, config.maxChars), {
                            x: config.x,
                            y: config.y,
                            size: 12,
                            color: rgb(0, 0, 0)
                        });
                    }
                }
            });

            // Save and download
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'filled_form.pdf';
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
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
                    pattern: '[0-9]{12}',
                    value: formData.aadharNo,
                    onChange: handleInputChange,
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
                        pattern: '[0-9]{12}',
                        value: formData.hofAadhar,
                        onChange: handleInputChange,
                        disabled: !selectedFields.hof
                    })
                ),
                React.createElement('div', { className: 'form-group' },
                    React.createElement('div', { className: 'radio-group' },
                        ['mother', 'father', 'child/ward','legal gurdeian','spouse','sibling'].map(gender =>
                            React.createElement('label', { key: gender, className: 'radio-label' },
                                React.createElement('input', {
                                    type: 'radio',
                                    name: 'hofRelation',
                                    value: gender.toLowerCase(),
                                    checked: formData.hofRelation === gender.toLowerCase(),
                                    onChange: handleInputChange,
                                    disabled: !selectedFields.hofRelation
                                }),
                                gender
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
                        value: formData.age,
                        readOnly: true
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
                await fillPDF(formData);
            }
        }, 'Generate & Download PDF')
    );
};

ReactDOM.render(
    React.createElement(AadharForm),
    document.getElementById('root')
);