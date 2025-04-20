const React = require("react");
const ReactDOM = require("react-dom");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const findCoordinates = async (pdfPath) => {
  try {
    const bytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(bytes);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    console.log("PDF dimensions:", { width, height });
    return { width, height };
  } catch (error) {
    console.error("Error reading PDF:", error);
  }
};
const AadharForm = () => {
  const [formData, setFormData] = React.useState({
    name: "",
    aadharNo: "",
    mobileNo: "",
    verificationName: "",
    hofName: "",
    hofAadhar: "",
    hofRelation: "",
    birthdate: "",
    age: "",
    pdb: "",
    gender: "",
    email: "",
    careOf: "",
    houseNo: "",
    street: "",
    landmark: "",
    area: "",
    village: "",
    postOffice: "",
    pincode: "",
    subDistrict: "",
    district: "",
    state: "",
    poi: "",
    poa: "",
    residentialType: "",
    isVerificationNameLocked: false,
  });

  const [selectedFields, setSelectedFields] = React.useState({
    hof: false,
    gender: false,
    email: false,
    birthdate: false,
    address: false,
  });

  const [alertMessage, setAlertMessage] = React.useState("");
  const [showAlert, setShowAlert] = React.useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = React.useState(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Create a custom alert component that doesn't block UI
  const CustomAlert = ({ message, onClose }) => {
    return React.createElement(
      "div",
      {
        className: "custom-alert",
        style: {
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#f8d7da",
          border: "1px solid #f5c6cb",
          color: "#721c24",
          padding: "15px 20px",
          borderRadius: "5px",
          zIndex: 1000,
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        },
      },
      React.createElement("div", null, message),
      React.createElement(
        "button",
        {
          onClick: onClose,
          style: {
            marginTop: "10px",
            padding: "5px 10px",
            background: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
          },
        },
        "Close"
      )
    );
  };

  // Replace all alert() calls with this function
  const showCustomAlert = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    setFormData((prev) => ({ ...prev, age: age.toString() }));
  };

  const formatAadharNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Format with spaces after every 4 digits (XXXX XXXX XXXX)
    let formatted = "";
    for (let i = 0; i < digits.length && i < 12; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += " ";
      }
      formatted += digits[i];
    }

    return formatted;
  };

  const validateMobileNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    
    // Indian mobile numbers are 10 digits and typically start with 6, 7, 8, or 9
    const isValidIndianMobile = /^[6-9]\d{9}$/.test(digits);
    
    return isValidIndianMobile;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "aadharNo" || name === "hofAadhar") {
      // Format Aadhar numbers with spaces
      const formattedValue = formatAadharNumber(value);
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    } else if (name === "mobileNo") {
      // Only allow digits for mobile number
      const digits = value.replace(/\D/g, "");
      if (digits.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: digits }));
      }
    } else if (name === "birthdate") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      calculateAge(value);
    } else if (type === "radio") {
      // Clear the radio value if it's already selected (clicking the same radio button)
      if (formData[name] === value) {
        setFormData((prev) => ({ ...prev, [name]: "" }));
        e.target.checked = false;  // Uncheck the radio button
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (field) => {
    const newSelectedFields = { ...selectedFields, [field]: !selectedFields[field] };
    setSelectedFields(newSelectedFields);
    
    // If unchecking a field, clear all related data
    if (selectedFields[field] === true) {
      // Clear section data when unchecking
      const clearData = {};
      
      if (field === 'hof') {
        clearData.hofName = "";
        clearData.hofAadhar = "";
        clearData.hofRelation = "";
      } else if (field === 'gender') {
        clearData.gender = "";
      } else if (field === 'email') {
        clearData.email = "";
      } else if (field === 'birthdate') {
        clearData.birthdate = "";
        clearData.age = "";
        clearData.pdb = "";
      } else if (field === 'address') {
        clearData.careOf = "";
        clearData.houseNo = "";
        clearData.street = "";
        clearData.landmark = "";
        clearData.area = "";
        clearData.village = "";
        clearData.postOffice = "";
        clearData.pincode = "";
        clearData.subDistrict = "";
        clearData.district = "";
        clearData.state = "";
        clearData.poi = "";
        clearData.poa = "";
      }
      
      setFormData(prev => ({...prev, ...clearData}));
    }
  };

  // Add this helper function to format dates
  const formatDateForPDF = (dateString) => {
    if (!dateString) return "";

    // Parse the date from yyyy-mm-dd format
    const [year, month, day] = dateString.split("-");

    // Return in ddmmyyyy format without hyphens
    return day + month + year;
  };

  const fillPDF = async (formData, previewOnly = false) => {
    try {
      setIsGenerating(true);
      const templatePath = path.join(__dirname, "template.pdf");
      if (!fs.existsSync(templatePath)) {
        throw new Error("Template PDF not found");
      }

      const templateBytes = fs.readFileSync(templatePath);
      const pdfDoc = await PDFDocument.load(templateBytes);

      // Use Times New Roman instead of Helvetica
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const zapfDingbatsFont = await pdfDoc.embedFont(
        StandardFonts.ZapfDingbats
      );

      const page = pdfDoc.getPages()[0];

      const coordinates = {
        update: { x: 258, y: 720, symbol: "✓", font: zapfDingbatsFont },
        mobile: { x: 206, y: 277, symbol: "✓", font: zapfDingbatsFont },
        name: { x: 110, y: 678, maxChars: 30, spacing: 0.2 },
        aadharNo: { x: 219, y: 300, maxChars: 12, spacing: 0 },
        mobileNo: { x: 468, y: 612, maxChars: 10, spacing: 2.3 },
        hofName: { x: 195, y: 437, maxChars: 30, spacing: 0.2 },
        hofAadhar: { x: 422, y: 436, maxChars: 12, spacing: 0 },
        hofRelation: {
          options: {
            mother: { x: 205, y: 423, symbol: "✓", font: zapfDingbatsFont },
            father: { x: 259, y: 423, symbol: "✓", font: zapfDingbatsFont },
            "legal guardian": {
              x: 318,
              y: 423,
              symbol: "✓",
              font: zapfDingbatsFont,
            },
            spouse: { x: 263, y: 410, symbol: "✓", font: zapfDingbatsFont },
            "child/ward": {
              x: 318,
              y: 410,
              symbol: "✓",
              font: zapfDingbatsFont,
            },
            sibling: { x: 389, y: 410, symbol: "✓", font: zapfDingbatsFont },
          },
        },
        // Checkbox coordinates for HOF and Address (single coordinates)
        checkboxHOF: { x: 144, y: 278, symbol: "✓", font: zapfDingbatsFont },
        checkboxAddress: { x: 144, y: 278, symbol: "✓", font: zapfDingbatsFont },
        
        // Checkbox coordinates for other options
        checkboxGender: { x: 87, y: 279, symbol: "✓", font: zapfDingbatsFont },
        checkboxEmail: { x: 272, y: 279, symbol: "✓", font: zapfDingbatsFont },
        checkboxBirthdate: { x: 453, y: 291, symbol: "✓", font: zapfDingbatsFont },
        
        gender: {
          options: {
            male: { x: 68, y: 640, symbol: "✓", font: zapfDingbatsFont },
            female: { x: 120, y: 652, symbol: "✓", font: zapfDingbatsFont },
            "third gender/transgender": {
              x: 68,
              y: 630,
              symbol: "✓",
              font: zapfDingbatsFont,
            },
          },
        },
        email: { x: 114, y: 613, maxChars: 35 },
        birthdate: { x: 279, y: 653, maxChars: 10, spacing: 2.3 },
        age: { x: 473, y: 653, maxChars: 3 },
        pdb: {
          x: 414,
          y: 467,
          maxChars: 30,
        },
        careOf: { x: 201, y: 560, maxChars: 30 },
        houseNo: { x: 195, y: 547, maxChars: 20 },
        street: { x: 321, y: 547, maxChars: 30 },
        landmark: { x: 115, y: 532, maxChars: 30 },
        area: { x: 383, y: 532, maxChars: 30 },
        village: { x: 147, y: 520, maxChars: 30 },
        postOffice: { x: 338, y: 520, maxChars: 30 },
        pincode: { x: 507, y: 520, maxChars: 6, spacing: 10 },
        subDistrict: { x: 119, y: 505, maxChars: 30 },
        district: { x: 281, y: 505, maxChars: 30 },
        state: { x: 440, y: 505, maxChars: 30 },
        residentialType: {
          x: 150,
          y: 600,
          options: {
            "indian residential": {
              x: 143,
              y: 704,
              symbol: "✓",
              font: zapfDingbatsFont,
            },
            "non residential indian": {
              x: 258,
              y: 704,
              symbol: "✓",
              font: zapfDingbatsFont,
            },
          },
        },
        poi: {
          x: 349,
          y: 496,
          maxChars: 30,
        },
        poa: {
          x: 356,
          y: 481,
          maxChars: 30,
        },
      };

      const drawTextInBoxes = (text, config, key = "") => {
        const { x, y, maxChars, spacing = 0.5 } = config;

        // Handle the update checkbox
        if (config.symbol) {
          page.drawText(config.symbol, {
            x: config.x,
            y: config.y,
            size: 10,
            font: config.font || timesRomanFont,
            color: rgb(0, 0, 0),
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
              font: option.font || timesRomanFont,
              color: rgb(0, 0, 0),
            });
          }
        } else {
          // Check if this is a numeric field that needs character-by-character placement
          const isNumericField =
            key === "aadharNo" ||
            key === "hofAadhar" ||
            key === "mobileNo" ||
            key === "pincode" ||
            key === "birthdate";

          if (isNumericField) {
            // Character-by-character placement for numbers
            const digits = text.replace(/\s/g, "");
            // Different spacing for different fields
            const charSpacing =
              key === "mobileNo" ? 10.2 : key === "birthdate" ? 10.2 : 10.2;

            for (let i = 0; i < digits.length && i < maxChars; i++) {
              let xPos = x + i * charSpacing;

              // Add extra gap after every 4 digits for Aadhar numbers
              if ((key === "aadharNo" || key === "hofAadhar") && i >= 4)
                xPos += 12;
              if ((key === "aadharNo" || key === "hofAadhar") && i >= 8)
                xPos += 12;

              // Add extra gap for birthdate (DD-MM-YYYY format)
              if (key === "birthdate" && i === 2) xPos += 5;
              if (key === "birthdate" && i === 4) xPos += 5;

              page.drawText(digits[i], {
                x: xPos,
                y: y,
                size: 10,
                font: timesRomanFont,
                color: rgb(0, 0, 0),
              });
            }
          } else {
            // For regular text fields - draw the text directly as is
            const displayText =
              text.length > maxChars ? text.substring(0, maxChars) : text;

            page.drawText(displayText, {
              x: x,
              y: y,
              size: 10,
              font: timesRomanFont,
              color: rgb(0, 0, 0),
            });
          }
        }
      };

      // Draw the update checkbox first
      drawTextInBoxes("✓", coordinates.update);
      
      // Draw checkbox ticks for selected fields
      if (selectedFields.hof) {
        drawTextInBoxes("✓", coordinates.checkboxHOF);
      }
      
      if (selectedFields.address) {
        drawTextInBoxes("✓", coordinates.checkboxAddress);
      }
      
      if (selectedFields.gender) {
        drawTextInBoxes("✓", coordinates.checkboxGender);
      }
      
      if (selectedFields.email) {
        drawTextInBoxes("✓", coordinates.checkboxEmail);
      }
      
      if (selectedFields.birthdate) {
        drawTextInBoxes("✓", coordinates.checkboxBirthdate);
      }

      // Handle the rest of the form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value && coordinates[key]) {
          const config = coordinates[key];

          // Format birthdate specially
          if (key === "birthdate" && value) {
            const formattedDate = formatDateForPDF(value);
            drawTextInBoxes(formattedDate, config, key);
          }
          // Handle Aadhar numbers
          else if ((key === "aadharNo" || key === "hofAadhar") && value) {
            const cleanValue = value.replace(/\s/g, "");
            if (cleanValue.length === 12) {
              drawTextInBoxes(cleanValue, config, key);
            }
          }
          // Handle mobile with country code
          else if (key === "mobileNo" && value) {
            // Mobile number processing without country code for the form
            drawTextInBoxes(value, config, key);
          }
          // Handle all other fields
          else if (value) {
            drawTextInBoxes(value.toString(), config, key);
          }
        }
      });

      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      if (previewOnly) {
        // Set the preview URL
        setPdfPreviewUrl(url);
        setShowPreview(true);
      } else {
      // Create a download link and trigger download
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `aadhar_form_${Date.now()}.pdf`; // Unique filename
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        window.URL.revokeObjectURL(url);
      }, 100);
      }
      setIsGenerating(false);
    } catch (error) {
      setIsGenerating(false);
      console.error("PDF Generation Error:", error);
      console.error("Error Stack:", error.stack);
      showCustomAlert("Error generating PDF: " + error.message);
    }
  };

  // PDF Preview component
  const PDFPreview = ({ url, onClose, onDownload }) => {
    if (!url) return null;
    
    return React.createElement(
      "div",
      {
        className: "pdf-preview-overlay",
        style: {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        },
      },
      React.createElement(
        "div",
        {
          className: "pdf-preview-container",
          style: {
            backgroundColor: "white",
            borderRadius: "8px",
            width: "90%",
            maxWidth: "1000px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        },
        React.createElement(
          "div",
          {
            className: "pdf-preview-header",
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 20px",
              borderBottom: "1px solid #eee",
            },
          },
          React.createElement(
            "h3",
            { style: { margin: 0, color: "#1a73e8" } },
            "PDF Preview"
          ),
          React.createElement(
            "button",
            {
              onClick: onClose,
              style: {
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#555",
              },
            },
            "×"
          )
        ),
        React.createElement(
          "div",
          {
            className: "pdf-preview-content",
            style: {
              flexGrow: 1,
              overflow: "auto",
              padding: "20px",
              textAlign: "center",
            },
          },
          React.createElement("iframe", {
            src: url,
            style: {
              width: "100%",
              height: "calc(90vh - 140px)",
              border: "1px solid #ddd",
            },
          })
        ),
        React.createElement(
          "div",
          {
            className: "pdf-preview-footer",
            style: {
              display: "flex",
              justifyContent: "center",
              padding: "15px",
              gap: "15px",
              borderTop: "1px solid #eee",
            },
          },
          React.createElement(
            "button",
            {
              onClick: onDownload,
              className: "submit-btn",
              style: {
                margin: 0,
                backgroundColor: "#0f9d58",
              },
            },
            "Download PDF"
          ),
          React.createElement(
            "button",
            {
              onClick: onClose,
              className: "submit-btn",
              style: {
                margin: 0,
                backgroundColor: "#555",
              },
            },
            "Close Preview"
          )
        )
      )
    );
  };

  // Add this function to validate required fields before PDF generation
  const validateForm = () => {
    // Check required fields
    const requiredFields = ["name", "aadharNo", "mobileNo", "verificationName"];

    // Check residentialType is selected
    if (!formData.residentialType) {
      showCustomAlert("Please select a Residential Type");
      return false;
    }

    // Validate mobile number
    if (formData.mobileNo && !validateMobileNumber(formData.mobileNo)) {
      showCustomAlert("Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)");
      return false;
    }

    // Add conditional required fields properly
    if (selectedFields.email && !formData.email) {
      showCustomAlert("Please fill in your Email Address");
      return false;
    }

    if (selectedFields.address) {
      const addressFields = {
        houseNo: "House No./Building/Apartment",
        street: "Street/Road/Lane",
        area: "Area/Locality/Sector",
        pincode: "Pincode",
      };

      for (const [field, label] of Object.entries(addressFields)) {
        if (!formData[field]) {
          showCustomAlert(`Please fill in ${label}`);
          return false;
        }
      }
    }

    // Check basic required fields
    for (const field of requiredFields) {
      if (!formData[field]) {
        showCustomAlert(`Please fill in required field: ${field}`);
        return false;
      }
    }

    // Validate Aadhar number properly
    if (formData.aadharNo) {
      const cleanValue = formData.aadharNo.replace(/\s/g, "");
      if (cleanValue.length !== 12) {
        showCustomAlert("Aadhar number must be 12 digits");
        return false;
      }
    }

    return true;
  };

  // Reset form handler
  const resetForm = () => {
    // Preserve verification name if locked
    const preserveVerificationName = formData.isVerificationNameLocked ? 
      { 
        verificationName: formData.verificationName,
        isVerificationNameLocked: true
      } : {};
    
    setFormData({
      name: "",
      aadharNo: "",
      mobileNo: "",
      verificationName: "",
      hofName: "",
      hofAadhar: "",
      hofRelation: "",
      birthdate: "",
      age: "",
      pdb: "",
      gender: "",
      email: "",
      careOf: "",
      houseNo: "",
      street: "",
      landmark: "",
      area: "",
      village: "",
      postOffice: "",
      pincode: "",
      subDistrict: "",
      district: "",
      state: "",
      poi: "",
      poa: "",
      residentialType: "",
      isVerificationNameLocked: false,
      ...preserveVerificationName
    });
    
    setSelectedFields({
      hof: false,
      gender: false,
      email: false,
      birthdate: false,
      address: false,
    });
  };

  return React.createElement(
    "div",
    { className: "form-container" },
    React.createElement(
      "h2",
      { className: "form-title" },
      "Aadhar Information Form"
    ),

    // Basic Information
    React.createElement(
      "div",
      { className: "section" },
      React.createElement("h3", null, "Basic Information"),
      React.createElement(
        "div",
        { className: "form-group" },
        React.createElement(
          "label",
          { className: "required" },
          "Residential Type"
        ),
        React.createElement(
          "div",
          { className: "radio-group" },
          ["Indian Residential", "Non Residential Indian"].map((type) =>
            React.createElement(
              "label",
              { key: type, className: "radio-label" },
              React.createElement("input", {
                type: "radio",
                name: "residentialType",
                value: type.toLowerCase(),
                checked: formData.residentialType === type.toLowerCase(),
                onChange: handleInputChange,
                required: true,
              }),
              type
            )
          )
        )
      ),
      React.createElement(
        "div",
        { className: "form-group" },
        React.createElement("label", { className: "required" }, "Full Name"),
        React.createElement("input", {
          type: "text",
          name: "name",
          value: formData.name,
          onChange: handleInputChange,
          required: true,
        })
      ),
      React.createElement(
        "div",
        { className: "form-group" },
        React.createElement(
          "label",
          { className: "required" },
          "Aadhar Number"
        ),
        React.createElement("input", {
          type: "text",
          name: "aadharNo",
          value: formData.aadharNo,
          onChange: handleInputChange,
          placeholder: "XXXX XXXX XXXX",
          maxLength: 14,
          required: true,
        })
      ),
      React.createElement(
        "div",
        { className: "form-group" },
        React.createElement(
          "label",
          { className: "required" },
          "Mobile Number"
        ),
        React.createElement("input", {
          type: "tel",
          name: "mobileNo",
          pattern: "[0-9]{10}",
          value: formData.mobileNo,
          onChange: handleInputChange,
          placeholder: "10-digit mobile number",
          required: true,
        }),
        formData.mobileNo && !validateMobileNumber(formData.mobileNo) && 
      React.createElement(
        "div",
            { 
              style: { 
                color: "#d93025", 
                fontSize: "12px", 
                marginTop: "5px" 
              } 
            },
            "Please enter a valid Indian mobile number (10 digits starting with 6, 7, 8, or 9)"
        )
      ),
      React.createElement(
        "div",
        { className: "form-group" },
        React.createElement(
          "label",
          { className: "required" },
          "Verification Name"
        ),
        React.createElement(
          "div",
          { style: { display: "flex", gap: "10px", alignItems: "center" } },
          React.createElement("input", {
            type: "text",
            name: "verificationName",
            value: formData.verificationName,
            onChange: handleInputChange,
            required: true,
            readOnly: formData.isVerificationNameLocked,
          }),
          React.createElement(
            "label",
            { className: "checkbox-label" },
            React.createElement("input", {
              type: "checkbox",
              checked: formData.isVerificationNameLocked,
              onChange: (e) => {
                setFormData((prev) => ({
                  ...prev,
                  isVerificationNameLocked: e.target.checked,
                }));
              },
            }),
            "Lock verification name"
          )
        )
      )
    ),

    // Activation Checkboxes
    React.createElement(
      "div",
      { className: "activation-checkboxes" },
      ["hof", "gender", "email", "birthdate", "address"].map((field) =>
        React.createElement(
          "label",
          { key: field, className: "checkbox-label" },
          React.createElement("input", {
            type: "checkbox",
            checked: selectedFields[field],
            onChange: () => handleCheckboxChange(field),
          }),
          ` ${field.charAt(0).toUpperCase() + field.slice(1)}`
        )
      )
    ),

    // Conditional Sections
    selectedFields.hof &&
      React.createElement(
        "div",
        { className: "section" },
        React.createElement("h3", null, "Head of Family Details"),
        React.createElement(
          "div",
          { className: "input-group" },
          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement("label", null, "HOF Name"),
            React.createElement("input", {
              type: "text",
              name: "hofName",
              value: formData.hofName,
              onChange: handleInputChange,
              disabled: !selectedFields.hof,
            })
          ),
          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement("label", null, "HOF Aadhar Number"),
            React.createElement("input", {
              type: "text",
              name: "hofAadhar",
              value: formData.hofAadhar,
              onChange: handleInputChange,
              placeholder: "XXXX XXXX XXXX",
              maxLength: 14,
              disabled: !selectedFields.hof,
            })
          ),
          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement("label", null, "HOF Relation"),
            React.createElement(
              "div",
              { className: "radio-group" },
              [
                "Mother",
                "Father",
                "Legal Guardian",
                "Spouse",
                "Child/Ward",
                "Sibling",
              ].map((relation) =>
                React.createElement(
                  "label",
                  { key: relation, className: "radio-label" },
                  React.createElement("input", {
                    type: "radio",
                    name: "hofRelation",
                    value: relation.toLowerCase(),
                    checked: formData.hofRelation === relation.toLowerCase(),
                    onChange: handleInputChange,
                    disabled: !selectedFields.hof,
                  }),
                  relation
                )
              )
            )
          )
        )
      ),

    selectedFields.gender &&
      React.createElement(
        "div",
        { className: "section" },
        React.createElement("h3", null, "Gender"),
        React.createElement(
          "div",
          { className: "radio-group" },
          ["Male", "Female", "Third Gender/Transgender"].map((gender) =>
            React.createElement(
              "label",
              { key: gender, className: "radio-label" },
              React.createElement("input", {
                type: "radio",
                name: "gender",
                value: gender.toLowerCase(),
                checked: formData.gender === gender.toLowerCase(),
                onChange: handleInputChange,
                disabled: !selectedFields.gender,
              }),
              gender
            )
          )
        )
      ),

    selectedFields.email &&
      React.createElement(
        "div",
        { className: "section" },
        React.createElement("h3", null, "Email Information"),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement(
            "label",
            { className: "required" },
            "Email Address"
          ),
          React.createElement("input", {
            type: "email",
            name: "email",
            value: formData.email,
            onChange: handleInputChange,
            disabled: !selectedFields.email,
            required: true,
          })
        )
      ),

    selectedFields.birthdate &&
      React.createElement(
        "div",
        { className: "section" },
        React.createElement("h3", null, "Birth Details"),
        React.createElement(
          "div",
          { className: "input-group" },
          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement("label", null, "Birth Date"),
            React.createElement("input", {
              type: "date",
              name: "birthdate",
              value: formData.birthdate,
              onChange: handleInputChange,
              disabled: !selectedFields.birthdate,
            })
          ),
          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement("label", null, "Age"),
            React.createElement("input", {
              type: "text",
              name: "age",
              value: formData.age,
              readOnly: true,
            })
          ),
          React.createElement(
            "div",
            { className: "form-group" },
            React.createElement("label", null, "Proof of Date of Birth"),
            React.createElement(
              "select",
              {
                name: "pdb",
                value: formData.pdb,
                onChange: handleInputChange,
                disabled: !selectedFields.birthdate,
              },
              React.createElement(
                "option",
                { value: "" },
                "Select Proof of Date of Birth"
              ),
              React.createElement('option', { value: 'Valid Indian Passport' }, 'Valid Indian Passport'),
React.createElement('option', { value: 'Service Photo Identity Card issued by Central GovernmentGovernment' }, 'Service Photo Identity Card issued by Central GovernmentGovernment'),
React.createElement('option', { value: 'PSU' }, 'PSU'),
React.createElement('option', { value: 'regulatory body' }, 'regulatory body'),
React.createElement('option', { value: 'statutory body' }, 'statutory body'),
React.createElement('option', { value: 'Pensioner Photo Identity Card' }, 'Pensioner Photo Identity Card'),
React.createElement('option', { value: 'Freedom Fighter Photo Identity Card' }, 'Freedom Fighter Photo Identity Card'),
React.createElement('option', { value: 'Pension Payment Order issued by Central Government' }, 'Pension Payment Order issued by Central Government'),
React.createElement('option', { value: 'Mark-sheet' }, 'Mark-sheet'),
React.createElement('option', { value: 'Certificate issued by recognised Board of Education' }, 'Certificate issued by recognised Board of Education'),
React.createElement('option', { value: 'Certificate issued by university' }, 'Certificate issued by university'),
React.createElement('option', { value: 'Certificate issued by deemed university' }, 'Certificate issued by deemed university'),
React.createElement('option', { value: 'Certificate issued by higher educational institution' }, 'Certificate issued by higher educational institution'),
React.createElement('option', { value: 'Third gender' }, 'Third gender'),
React.createElement('option', { value: 'Transgender Identity Card' }, 'Transgender Identity Card'),
React.createElement('option', { value: 'Certificate issued under the Transgender Persons' }, 'Certificate issued under the Transgender Persons'),
React.createElement('option', { value: 'Birth certificate' }, 'Birth certificate'),
React.createElement('option', { value: 'Self Declaration as per notified format along with Birth certificate' }, 'Self Declaration as per notified format along with Birth certificate'),

            )
          )
        )
      ),

    selectedFields.address &&
      React.createElement(
        "div",
        { className: "section" },
        React.createElement("h3", null, "Address Details"),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement("label", null, "Care of (Optional)"),
          React.createElement("input", {
            type: "text",
            name: "careOf",
            value: formData.careOf,
            onChange: handleInputChange,
            disabled: !selectedFields.address,
          })
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement(
            "label",
            { className: "required" },
            "House No./Building/Apartment"
          ),
          React.createElement("input", {
            type: "text",
            name: "houseNo",
            value: formData.houseNo,
            onChange: handleInputChange,
            disabled: !selectedFields.address,
          })
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement(
            "label",
            { className: "required" },
            "Street/Road/Lane"
          ),
          React.createElement("input", {
            type: "text",
            name: "street",
            value: formData.street,
            onChange: handleInputChange,
            disabled: !selectedFields.address,
          })
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement("label", null, "Landmark"),
          React.createElement("input", {
            type: "text",
            name: "landmark",
            value: formData.landmark,
            onChange: handleInputChange,
            disabled: !selectedFields.address,
          })
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement(
            "label",
            { className: "required" },
            "Area/Locality/Sector"
          ),
          React.createElement("input", {
            type: "text",
            name: "area",
            value: formData.area,
            onChange: handleInputChange,
            disabled: !selectedFields.address,
          })
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement("label", null, "Village"),
          React.createElement("input", {
            type: "text",
            name: "village",
            value: formData.village,
            onChange: handleInputChange,
            disabled: !selectedFields.address,
          })
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement("label", null, "Post Office"),
          React.createElement("input", {
            type: "text",
            name: "postOffice",
            value: formData.postOffice,
            onChange: handleInputChange,
            disabled: !selectedFields.address,
            required: true,
          })
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement("label", { className: "required" }, "Pincode"),
          React.createElement("input", {
            type: "text",
            name: "pincode",
            value: formData.pincode,
            onChange: handleInputChange,
            disabled: !selectedFields.address,
            required: true,
          })
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement("label", null, "Sub District"),
          React.createElement("input", {
            type: "text",
            name: "subDistrict",
            value: formData.subDistrict,
            onChange: handleInputChange,
            disabled: !selectedFields.address,
          })
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement("label", null, "District"),
          React.createElement("input", {
            type: "text",
            name: "district",
            value: formData.district,
            onChange: handleInputChange,
            disabled: !selectedFields.address,
          })
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement("label", null, "State"),
          React.createElement("input", {
            type: "text",
            name: "state",
            value: formData.state,
            onChange: handleInputChange,
            disabled: !selectedFields.address,
          })
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement("label", null, "Proof of Identity (POI)"),
          React.createElement(
            "select",
            {
              name: "poi",
              value: formData.poi,
              onChange: handleInputChange,
              disabled: !selectedFields.address,
            },
            React.createElement(
              "option",
              { value: "" },
              "Select Proof of Identity"
            ),
            React.createElement('option', { value: 'Valid Indian Passport' }, 'Valid Indian Passport'),
React.createElement('option', { value: 'PAN Card/e-PAN Card' }, 'PAN Card/e-PAN Card'),
React.createElement('option', { value: 'Ration Card' }, 'Ration Card'),
React.createElement('option', { value: 'Voter Identity Card' }, 'Voter Identity Card'),
React.createElement('option', { value: 'Driving licence' }, 'Driving licence'),
React.createElement('option', { value: 'Service Photo Identity Card issued by Central Government' }, 'Service Photo Identity Card issued by Central Government'),
React.createElement('option', { value: 'PSU' }, 'PSU'),
React.createElement('option', { value: 'regulatory body' }, 'regulatory body'),
React.createElement('option', { value: 'statutory body' }, 'statutory body'),
React.createElement('option', { value: 'Pensioner Photo Identity Card' }, 'Pensioner Photo Identity Card'),
React.createElement('option', { value: 'Freedom Fighter Photo Identity Card' }, 'Freedom Fighter Photo Identity Card'),
React.createElement('option', { value: 'Pension Payment Order issued by Central Government' }, 'Pension Payment Order issued by Central Government'),
React.createElement('option', { value: 'CGHS' }, 'CGHS'),
React.createElement('option', { value: 'ECHS' }, 'ECHS'),
React.createElement('option', { value: 'ESIC' }, 'ESIC'),
React.createElement('option', { value: 'Medi-Claim Card issued by Central Government' }, 'Medi-Claim Card issued by Central Government'),
React.createElement('option', { value: 'Disability Identity Card' }, 'Disability Identity Card'),
React.createElement('option', { value: 'Certificate of Disability issued under Rights of' }, 'Certificate of Disability issued under Rights of'),
React.createElement('option', { value: 'Photograph Identity Card' }, 'Photograph Identity Card'),
React.createElement('option', { value: 'Bhamashah scheme' }, 'Bhamashah scheme'),
React.createElement('option', { value: 'Domicile Certificate' }, 'Domicile Certificate'),
React.createElement('option', { value: 'MGNREGA/NREGS Job Card' }, 'MGNREGA/NREGS Job Card'),
React.createElement('option', { value: 'Labour Card' }, 'Labour Card'),
React.createElement('option', { value: 'Scheduled Tribe(ST)' }, 'Scheduled Tribe(ST)'),
React.createElement('option', { value: 'Scheduled Cast(SC)' }, 'Scheduled Cast(SC)'),
React.createElement('option', { value: 'Other Backward Cast (OBC) Certificate' }, 'Other Backward Cast (OBC) Certificate'),
React.createElement('option', { value: 'Mark-sheet' }, 'Mark-sheet'),
React.createElement('option', { value: 'Certificate issued by recognised Board of Education' }, 'Certificate issued by recognised Board of Education'),
React.createElement('option', { value: 'Certificate issued by university' }, 'Certificate issued by university'),
React.createElement('option', { value: 'Certificate issued by deemed university' }, 'Certificate issued by deemed university'),
React.createElement('option', { value: 'Certificate issued by higher educational institution' }, 'Certificate issued by higher educational institution'),
React.createElement('option', { value: 'Passbook with photograph' }, 'Passbook with photograph'),
React.createElement('option', { value: 'Third gender' }, 'Third gender'),
React.createElement('option', { value: 'Transgender Identity Card' }, 'Transgender Identity Card'),
React.createElement('option', { value: 'Certificate issued under the Transgender Persons' }, 'Certificate issued under the Transgender Persons'),
React.createElement('option', { value: 'Gazetted Officer at National AIDS Control Organisation (NACO)' }, 'Gazetted Officer at National AIDS Control Organisation (NACO)'),
React.createElement('option', { value: 'State Health Department' }, 'State Health Department'),
React.createElement('option', { value: 'Project Director of the State AIDS Control Society o' }, 'Project Director of the State AIDS Control Society o'),
React.createElement('option', { value: 'Superintendent' }, 'Superintendent'),
React.createElement('option', { value: 'Warden' }, 'Warden'),
React.createElement('option', { value: 'Matron' }, 'Matron'),
React.createElement('option', { value: 'Head of Institution of recognised shelter homes or orphanages' }, 'Head of Institution of recognised shelter homes or orphanages'),
React.createElement('option', { value: 'Prisoner Induction Document' }, 'Prisoner Induction Document'),
React.createElement('option', { value: 'Kisan Photo Passbook' }, 'Kisan Photo Passbook'),
React.createElement('option', { value: 'Marriage Certificate' }, 'Marriage Certificate'),
React.createElement('option', { value: 'School Leaving Certificate (SLC)' }, 'School Leaving Certificate (SLC)'),
React.createElement('option', { value: 'School Transfer Certificate (TC)' }, 'School Transfer Certificate (TC)'),
React.createElement('option', { value: 'Gazette Notification' }, 'Gazette Notification'),
React.createElement('option', { value: 'Divorce Decree' }, 'Divorce Decree'),
React.createElement('option', { value: 'Adoption Certificate' }, 'Adoption Certificate'),

          )
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement("label", null, "Proof of Address (POA)"),
          React.createElement(
            "select",
            {
              name: "poa",
              value: formData.poa,
              onChange: handleInputChange,
              disabled: !selectedFields.address,
            },
            React.createElement(
              "option",
              { value: "" },
              "Select Proof of Address"
            ),
            React.createElement('option', { value: 'Valid Indian Passport' }, 'Valid Indian Passport'),
React.createElement('option', { value: 'Ration Card' }, 'Ration Card'),
React.createElement('option', { value: 'Voter Identity Card' }, 'Voter Identity Card'),
React.createElement('option', { value: 'Disability Identity Card' }, 'Disability Identity Card'),
React.createElement('option', { value: 'Certificate of Disability' }, 'Certificate of Disability'),
React.createElement('option', { value: 'Photograph Identity Card' }, 'Photograph Identity Card'),
React.createElement('option', { value: 'Certificate with photograph' }, 'Certificate with photograph'),
React.createElement('option', { value: 'such as under Bhamashah scheme' }, 'such as under Bhamashah scheme'),
React.createElement('option', { value: 'Domicile Certificate' }, 'Domicile Certificate'),
React.createElement('option', { value: 'MGNREGA/NREGS Job Card' }, 'MGNREGA/NREGS Job Card'),
React.createElement('option', { value: 'Labour Card' }, 'Labour Card'),
React.createElement('option', { value: 'Scheduled Tribe(ST)' }, 'Scheduled Tribe(ST)'),
React.createElement('option', { value: 'Scheduled Cast(SC)' }, 'Scheduled Cast(SC)'),
React.createElement('option', { value: 'Other Backward Cast (OBC) Certificate' }, 'Other Backward Cast (OBC) Certificate'),
React.createElement('option', { value: 'Passbook with photograph' }, 'Passbook with photograph'),
React.createElement('option', { value: 'Third gender' }, 'Third gender'),
React.createElement('option', { value: 'Transgender Identity Card' }, 'Transgender Identity Card'),
React.createElement('option', { value: 'Certificate issued under the Transgender Persons' }, 'Certificate issued under the Transgender Persons'),
React.createElement('option', { value: 'MP' }, 'MP'),
React.createElement('option', { value: 'MLA' }, 'MLA'),
React.createElement('option', { value: 'MLC' }, 'MLC'),
React.createElement('option', { value: 'Municipal Councillor' }, 'Municipal Councillor'),
React.createElement('option', { value: 'Gazetted officer Group ‘A’' }, 'Gazetted officer Group ‘A’'),
React.createElement('option', { value: '(EPFO) Officer' }, '(EPFO) Officer'),
React.createElement('option', { value: 'Tehsildar' }, 'Tehsildar'),
React.createElement('option', { value: 'Gazetted Officer Group ‘B’' }, 'Gazetted Officer Group ‘B’'),
React.createElement('option', { value: 'Gazetted Officer at (NACO)' }, 'Gazetted Officer at (NACO)'),
React.createElement('option', { value: 'State Health Department' }, 'State Health Department'),
React.createElement('option', { value: 'Project Director of the State AIDS Control Society' }, 'Project Director of the State AIDS Control Society'),
React.createElement('option', { value: 'Superintendent' }, 'Superintendent'),
React.createElement('option', { value: 'Warden' }, 'Warden'),
React.createElement('option', { value: 'Matron' }, 'Matron'),
React.createElement('option', { value: 'Head of Institution of recognised shelter homes or orphanages' }, 'Head of Institution of recognised shelter homes or orphanages'),
React.createElement('option', { value: 'Recognised educational institution' }, 'Recognised educational institution'),
React.createElement('option', { value: 'Village Panchayat Head' }, 'Village Panchayat Head'),
React.createElement('option', { value: 'President or Mukhiya' }, 'President or Mukhiya'),
React.createElement('option', { value: 'Gaon Bura' }, 'Gaon Bura'),
React.createElement('option', { value: 'equivalent authority (for rural areas)' }, 'equivalent authority (for rural areas)'),
React.createElement('option', { value: 'Village Panchayat Secretary' }, 'Village Panchayat Secretary'),
React.createElement('option', { value: 'Village Revenue Officer or equivalent (for rural areas)' }, 'Village Revenue Officer or equivalent (for rural areas)'),
React.createElement('option', { value: 'Electricity bill' }, 'Electricity bill'),
React.createElement('option', { value: 'Water bill' }, 'Water bill'),
React.createElement('option', { value: 'Telephone landline bill' }, 'Telephone landline bill'),
React.createElement('option', { value: 'post-paid mobile bill' }, 'post-paid mobile bill'),
React.createElement('option', { value: 'broadband bill' }, 'broadband bill'),
React.createElement('option', { value: 'Valid sale agreement' }, 'Valid sale agreement'),
React.createElement('option', { value: 'gift deed registered with the Registrar Office' }, 'gift deed registered with the Registrar Office'),
React.createElement('option', { value: 'Gas connection bill' }, 'Gas connection bill'),
React.createElement('option', { value: 'Allotment letter of accommodation issued by Central Government' }, 'Allotment letter of accommodation issued by Central Government'),
React.createElement('option', { value: 'PSU' }, 'PSU'),
React.createElement('option', { value: 'regulatory body' }, 'regulatory body'),
React.createElement('option', { value: 'statutory body' }, 'statutory body'),
React.createElement('option', { value: 'Life or medical insurance Policy' }, 'Life or medical insurance Policy'),
React.createElement('option', { value: 'PID issued by Prison Officer' }, 'PID issued by Prison Officer'),
React.createElement('option', { value: 'Kisan Photo Passbook' }, 'Kisan Photo Passbook'),
React.createElement('option', { value: 'Marriage Certificate' }, 'Marriage Certificate'),

          )
        )
      ),

    // Add control buttons at the bottom
    React.createElement(
      "div",
      { 
        className: "form-buttons",
        style: {
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          marginTop: "2rem",
        }
      },
      React.createElement(
        "button",
        {
          type: "button",
          className: "submit-btn preview-btn",
          disabled: isGenerating,
          style: {
            backgroundColor: "#4285f4",
            maxWidth: "200px",
            margin: 0
          },
          onClick: (e) => {
            const isValid = validateForm();
            if (isValid) {
              setTimeout(async () => {
                try {
                  await fillPDF(formData, true);
                } catch (error) {
                  console.error("PDF Preview Error:", error);
                  showCustomAlert("Error generating PDF preview: " + error.message);
                }
              }, 100);
            }
          },
        },
        isGenerating ? "Generating..." : "Preview PDF"
      ),
    React.createElement(
      "button",
      {
        type: "button",
        className: "submit-btn",
          disabled: isGenerating,
          style: {
            backgroundColor: "#0f9d58",
            maxWidth: "200px",
            margin: 0
          },
        onClick: (e) => {
          const isValid = validateForm();
          if (isValid) {
            setTimeout(async () => {
              try {
                  await fillPDF(formData, false);
              } catch (error) {
                console.error("PDF Generation Error:", error);
                showCustomAlert("Error generating PDF: " + error.message);
              }
            }, 100);
          }
          },
        },
        isGenerating ? "Generating..." : "Download PDF"
      ),
      React.createElement(
        "button",
        {
          type: "button",
          className: "submit-btn",
          style: {
            backgroundColor: "#ea4335",
            maxWidth: "200px",
            margin: 0
          },
          onClick: resetForm,
        },
        "Reset Form"
      )
    ),

    // PDF Preview modal
    showPreview && React.createElement(PDFPreview, {
      url: pdfPreviewUrl,
      onClose: () => {
        setShowPreview(false);
        // Clean up URL object
        if (pdfPreviewUrl) {
          window.URL.revokeObjectURL(pdfPreviewUrl);
          setPdfPreviewUrl(null);
        }
      },
      onDownload: () => {
        // Create a download link and trigger download
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfPreviewUrl;
        downloadLink.download = `aadhar_form_${Date.now()}.pdf`; // Unique filename
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(downloadLink);
        }, 100);
      }
    }),

    showAlert &&
      React.createElement(CustomAlert, {
        message: alertMessage,
        onClose: () => setShowAlert(false),
      })
  );
};

// Export the AadharForm component properly
module.exports = {
  default: AadharForm
};

// Keep the direct rendering for when this file is run directly
if (typeof document !== 'undefined' && document.getElementById('root')) {
ReactDOM.render(
  React.createElement(AadharForm),
  document.getElementById("root")
);
}
