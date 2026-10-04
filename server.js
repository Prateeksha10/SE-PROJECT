const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, "registrations.json");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Create registrations.json if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]");
}

// Read registrations
function getRegistrations() {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

// Save registrations
function saveRegistrations(data) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2)
    );
}

// Registration API
app.post("/api/register", (req, res) => {

    const {
        name,
        email,
        phone,
        dob,
        gender,
        qualification,
        exam
    } = req.body;

    // Check required fields
    if (
        !name ||
        !email ||
        !phone ||
        !dob ||
        !gender ||
        !qualification ||
        !exam
    ) {
        return res.status(400).json({
            success: false,
            message: "Please fill in all fields."
        });
    }

    // Name validation
    if (!/^[A-Za-z ]{2,50}$/.test(name)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid name."
        });
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address."
        });
    }

    // Phone validation
    // Must contain exactly 10 digits and nothing else
    if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({
            success: false,
            message: "Phone number must contain exactly 10 digits."
        });
    }

    // Date of birth validation
    const birthDate = new Date(dob);
    const today = new Date();

    if (isNaN(birthDate.getTime())) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid date of birth."
        });
    }

    // Calculate the date exactly 15 years ago
    const minimumAgeDate = new Date(
        today.getFullYear() - 15,
        today.getMonth(),
        today.getDate()
    );

    // Student must be at least 15 years old
    if (birthDate > minimumAgeDate) {
        return res.status(400).json({
            success: false,
            message: "You must be at least 15 years old to register."
        });
    }

    // Get existing registrations
    const registrations = getRegistrations();

    // Check duplicate registration
    const duplicate = registrations.find(
        registration =>
            registration.email.toLowerCase() ===
                email.toLowerCase() &&
            registration.exam === exam
    );

    if (duplicate) {
        return res.status(409).json({
            success: false,
            message: "This email is already registered for this exam."
        });
    }

    // Create registration
    const registration = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dob,
        gender,
        qualification,
        exam,
        registeredAt: new Date().toISOString()
    };

    // Save registration
    registrations.push(registration);

    saveRegistrations(registrations);

    // Send success response
    res.status(201).json({
        success: true,
        message: "Registration successful!",
        registrationId: registration.id
    });
});

// Get all registrations
app.get("/api/registrations", (req, res) => {

    const registrations = getRegistrations();

    res.json({
        success: true,
        data: registrations
    });
});

// Start server
app.listen(PORT, () => {
    console.log(
        `Server running at http://localhost:${PORT}`
    );
});