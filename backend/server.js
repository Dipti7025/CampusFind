const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

require("dotenv").config({
    override: true
});

const Item = require("./models/item");

const app = express();

const isVercel = Boolean(process.env.VERCEL);

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// MONGODB CONNECTION
// ============================================================

let mongoConnectionPromise = null;

async function connectDB() {
    // Already connected
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    // Check environment variable
    if (!process.env.MONGO_URI) {
        throw new Error(
            "MONGO_URI environment variable is missing."
        );
    }

    // Reuse existing connection attempt
    if (!mongoConnectionPromise) {
        mongoConnectionPromise = mongoose
            .connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                minPoolSize: 0
            })
            .then(() => {
                console.log(
                    "=========================================="
                );
                console.log(
                    "MongoDB Connected Successfully"
                );
                console.log(
                    "=========================================="
                );

                return mongoose.connection;
            })
            .catch((error) => {
                mongoConnectionPromise = null;

                console.error(
                    "MongoDB Connection Error:",
                    error.message
                );

                throw error;
            });
    }

    return mongoConnectionPromise;
}

// ============================================================
// UPLOAD DIRECTORY
// ============================================================
//
// LOCAL:
// backend/uploads
//
// VERCEL:
// /tmp/campusfind-uploads
//
// IMPORTANT:
// Vercel /tmp storage is temporary.
// Use Cloudinary/Firebase/S3 for permanent image storage.
// ============================================================

const uploadFolder = isVercel
    ? path.join("/tmp", "campusfind-uploads")
    : path.join(__dirname, "uploads");

try {
    if (!fs.existsSync(uploadFolder)) {
        fs.mkdirSync(uploadFolder, {
            recursive: true
        });
    }
} catch (error) {
    console.error(
        "Error creating upload folder:",
        error.message
    );
}

// ============================================================
// MULTER STORAGE
// ============================================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadFolder);
    },

    filename: function (req, file, cb) {
        const extension = path.extname(
            file.originalname
        );

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            extension;

        cb(null, uniqueName);
    }
});

// ============================================================
// MULTER UPLOAD
// ============================================================

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: function (req, file, cb) {
        const allowedExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        ];

        const extension = path
            .extname(file.originalname)
            .toLowerCase();

        const allowedMimeTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        const validExtension =
            allowedExtensions.includes(extension);

        const validMimeType =
            allowedMimeTypes.includes(file.mimetype);

        if (
            validExtension &&
            validMimeType
        ) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only JPG, JPEG, PNG and WEBP images are allowed."
                )
            );
        }
    }
});

// ============================================================
// SERVE UPLOADED IMAGES
// ============================================================

app.use(
    "/uploads",
    express.static(uploadFolder)
);

// ============================================================
// HEALTH / HOME ROUTE
// ============================================================

app.get("/", function (req, res) {
    res.status(200).json({
        success: true,
        message:
            "Campus Lost & Found Backend is Running!",
        environment: isVercel
            ? "vercel"
            : "local"
    });
});

// ============================================================
// DATABASE MIDDLEWARE
// ============================================================

app.use(
    "/api",
    async function (req, res, next) {
        try {
            await connectDB();
            next();
        } catch (error) {
            console.error(
                "DATABASE CONNECTION FAILED:",
                error.message
            );

            return res.status(503).json({
                success: false,
                message:
                    "Database connection failed.",
                error: error.message
            });
        }
    }
);

// ============================================================
// HELPER: SAFE ITEM RESPONSE
// ============================================================

function sanitizeItem(item) {
    const safeItem = {
        ...item
    };

    // Never expose verification answers
    delete safeItem.verificationAnswer1;
    delete safeItem.verificationAnswer2;

    // Backward compatibility
    const hasQuestions =
        typeof safeItem.verificationQuestion1 ===
            "string" &&
        safeItem.verificationQuestion1.trim() !== "" &&
        typeof safeItem.verificationQuestion2 ===
            "string" &&
        safeItem.verificationQuestion2.trim() !== "";

    if (
        safeItem.type === "Found" &&
        hasQuestions
    ) {
        safeItem.verificationMethod =
            "questions";
    }

    if (!safeItem.verificationMethod) {
        safeItem.verificationMethod = "none";
    }

    safeItem.isUrgent =
        safeItem.isUrgent === true;

    return safeItem;
}

// ============================================================
// GET ALL ITEMS
// ============================================================

app.get(
    "/api/items",
    async function (req, res) {
        try {
            const items = await Item.find()
                .sort({
                    createdAt: -1
                })
                .lean();

            const safeItems = items.map(
                sanitizeItem
            );

            return res.status(200).json(
                safeItems
            );
        } catch (error) {
            console.error(
                "ERROR FETCHING ITEMS:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch items.",
                error: error.message
            });
        }
    }
);

// ============================================================
// GET SINGLE ITEM
// ============================================================

app.get(
    "/api/items/:id",
    async function (req, res) {
        try {
            const item =
                await Item.findById(
                    req.params.id
                ).lean();

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Item not found."
                });
            }

            return res.status(200).json(
                sanitizeItem(item)
            );
        } catch (error) {
            console.error(
                "ERROR FETCHING SINGLE ITEM:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch item.",
                error: error.message
            });
        }
    }
);

// ============================================================
// ADD NEW ITEM
// ============================================================

app.post(
    "/api/items",
    upload.single("image"),
    async function (req, res) {
        try {
            console.log(
                "------------------------------------------"
            );

            console.log(
                "NEW ITEM RECEIVED"
            );

            console.log(
                "Item Name:",
                req.body.itemName
            );

            console.log(
                "Type:",
                req.body.type
            );

            console.log(
                "Urgent:",
                req.body.isUrgent
            );

            console.log(
                "Verification:",
                req.body.verificationMethod
            );

            // =================================================
            // URGENT FLAG
            // =================================================

            let isUrgent = false;

            if (req.body.type === "Lost") {
                const urgentValue =
                    String(
                        req.body.isUrgent || ""
                    )
                        .trim()
                        .toLowerCase();

                isUrgent =
                    urgentValue === "true";
            }

            // =================================================
            // VERIFICATION METHOD
            // =================================================

            let verificationMethod =
                req.body.verificationMethod ||
                "none";

            const hasQuestions =
                typeof req.body.verificationQuestion1 ===
                    "string" &&
                req.body.verificationQuestion1.trim() !== "" &&
                typeof req.body.verificationQuestion2 ===
                    "string" &&
                req.body.verificationQuestion2.trim() !== "";

            if (
                req.body.type === "Found" &&
                hasQuestions
            ) {
                verificationMethod =
                    "questions";
            }

            if (
                req.body.type !== "Found"
            ) {
                verificationMethod =
                    "none";
            }

            const allowedVerificationMethods = [
                "none",
                "questions",
                "faceToFace"
            ];

            if (
                !allowedVerificationMethods.includes(
                    verificationMethod
                )
            ) {
                verificationMethod =
                    "none";
            }

            // =================================================
            // CREATE ITEM
            // =================================================

            const newItem = new Item({
                itemName:
                    req.body.itemName,

                category:
                    req.body.category,

                type:
                    req.body.type,

                description:
                    req.body.description,

                location:
                    req.body.location || "",

                date:
                    req.body.date,

                contact:
                    req.body.contact,

                image:
                    req.file
                        ? `/uploads/${req.file.filename}`
                        : "",

                status:
                    "Active",

                isUrgent:
                    isUrgent,

                verificationMethod:
                    verificationMethod,

                verificationQuestion1:
                    verificationMethod ===
                    "questions"
                        ? String(
                              req.body
                                  .verificationQuestion1 ||
                                  ""
                          ).trim()
                        : "",

                verificationAnswer1:
                    verificationMethod ===
                    "questions"
                        ? String(
                              req.body
                                  .verificationAnswer1 ||
                                  ""
                          ).trim()
                        : "",

                verificationQuestion2:
                    verificationMethod ===
                    "questions"
                        ? String(
                              req.body
                                  .verificationQuestion2 ||
                                  ""
                          ).trim()
                        : "",

                verificationAnswer2:
                    verificationMethod ===
                    "questions"
                        ? String(
                              req.body
                                  .verificationAnswer2 ||
                                  ""
                          ).trim()
                        : ""
            });

            const savedItem =
                await newItem.save();

            console.log(
                "Saved item:",
                savedItem.itemName
            );

            console.log(
                "Saved isUrgent:",
                savedItem.isUrgent
            );

            console.log(
                "------------------------------------------"
            );

            return res.status(201).json({
                success: true,
                message:
                    "Item reported successfully.",
                item:
                    sanitizeItem(
                        savedItem.toObject()
                    )
            });
        } catch (error) {
            console.error(
                "ERROR ADDING ITEM:",
                error
            );

            return res.status(400).json({
                success: false,
                message:
                    "Failed to add item.",
                error: error.message
            });
        }
    }
);

// ============================================================
// VERIFY OWNERSHIP
// ============================================================

app.post(
    "/api/items/:id/verify",
    async function (req, res) {
        try {
            const item =
                await Item.findById(
                    req.params.id
                );

            if (!item) {
                return res.status(404).json({
                    verified: false,
                    message:
                        "Item not found."
                });
            }

            if (
                item.type !== "Found"
            ) {
                return res.status(400).json({
                    verified: false,
                    message:
                        "Verification is only available for found items."
                });
            }

            const hasQuestions =
                typeof item.verificationQuestion1 ===
                    "string" &&
                item.verificationQuestion1.trim() !== "" &&
                typeof item.verificationQuestion2 ===
                    "string" &&
                item.verificationQuestion2.trim() !== "";

            const questionVerificationEnabled =
                item.verificationMethod ===
                    "questions" ||
                hasQuestions;

            if (
                !questionVerificationEnabled
            ) {
                return res.status(400).json({
                    verified: false,
                    message:
                        "Question verification is not enabled."
                });
            }

            const answer1 =
                String(
                    req.body.answer1 || ""
                )
                    .trim()
                    .toLowerCase();

            const answer2 =
                String(
                    req.body.answer2 || ""
                )
                    .trim()
                    .toLowerCase();

            const correctAnswer1 =
                String(
                    item.verificationAnswer1 ||
                        ""
                )
                    .trim()
                    .toLowerCase();

            const correctAnswer2 =
                String(
                    item.verificationAnswer2 ||
                        ""
                )
                    .trim()
                    .toLowerCase();

            if (
                answer1 ===
                    correctAnswer1 &&
                answer2 ===
                    correctAnswer2
            ) {
                return res.status(200).json({
                    verified: true,
                    message:
                        "Ownership verified successfully."
                });
            }

            return res.status(401).json({
                verified: false,
                message:
                    "Ownership could not be verified. Please check your answers."
            });
        } catch (error) {
            console.error(
                "ERROR VERIFYING OWNERSHIP:",
                error.message
            );

            return res.status(500).json({
                verified: false,
                message:
                    "Verification failed.",
                error: error.message
            });
        }
    }
);

// ============================================================
// UPDATE ITEM
// ============================================================

app.put(
    "/api/items/:id",
    upload.single("image"),
    async function (req, res) {
        try {
            const existingItem =
                await Item.findById(
                    req.params.id
                );

            if (!existingItem) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Item not found."
                });
            }

            // =================================================
            // BASIC DATA
            // =================================================

            existingItem.itemName =
                req.body.itemName;

            existingItem.category =
                req.body.category;

            existingItem.type =
                req.body.type;

            existingItem.description =
                req.body.description;

            existingItem.location =
                req.body.location || "";

            existingItem.date =
                req.body.date;

            existingItem.contact =
                req.body.contact;

            // =================================================
            // URGENT
            // =================================================

            if (
                existingItem.type === "Lost"
            ) {
                const urgentValue =
                    String(
                        req.body.isUrgent || ""
                    )
                        .trim()
                        .toLowerCase();

                existingItem.isUrgent =
                    urgentValue === "true";
            } else {
                existingItem.isUrgent =
                    false;
            }

            // =================================================
            // VERIFICATION
            // =================================================

            let verificationMethod =
                req.body.verificationMethod ||
                "none";

            const hasQuestions =
                typeof req.body.verificationQuestion1 ===
                    "string" &&
                req.body.verificationQuestion1.trim() !== "" &&
                typeof req.body.verificationQuestion2 ===
                    "string" &&
                req.body.verificationQuestion2.trim() !== "";

            if (
                existingItem.type === "Found" &&
                hasQuestions
            ) {
                verificationMethod =
                    "questions";
            }

            if (
                existingItem.type !== "Found"
            ) {
                verificationMethod =
                    "none";
            }

            const allowedVerificationMethods = [
                "none",
                "questions",
                "faceToFace"
            ];

            if (
                !allowedVerificationMethods.includes(
                    verificationMethod
                )
            ) {
                verificationMethod =
                    "none";
            }

            existingItem.verificationMethod =
                verificationMethod;

            if (
                verificationMethod ===
                "questions"
            ) {
                existingItem.verificationQuestion1 =
                    String(
                        req.body
                            .verificationQuestion1 ||
                            ""
                    ).trim();

                existingItem.verificationAnswer1 =
                    String(
                        req.body
                            .verificationAnswer1 ||
                            ""
                    ).trim();

                existingItem.verificationQuestion2 =
                    String(
                        req.body
                            .verificationQuestion2 ||
                            ""
                    ).trim();

                existingItem.verificationAnswer2 =
                    String(
                        req.body
                            .verificationAnswer2 ||
                            ""
                    ).trim();
            } else {
                existingItem.verificationQuestion1 =
                    "";

                existingItem.verificationAnswer1 =
                    "";

                existingItem.verificationQuestion2 =
                    "";

                existingItem.verificationAnswer2 =
                    "";
            }

            // =================================================
            // IMAGE UPDATE
            // =================================================

            if (req.file) {
                if (
                    existingItem.image &&
                    existingItem.image.startsWith(
                        "/uploads/"
                    )
                ) {
                    const oldFileName =
                        path.basename(
                            existingItem.image
                        );

                    const oldFilePath =
                        path.join(
                            uploadFolder,
                            oldFileName
                        );

                    if (
                        fs.existsSync(
                            oldFilePath
                        )
                    ) {
                        try {
                            fs.unlinkSync(
                                oldFilePath
                            );
                        } catch (
                            deleteError
                        ) {
                            console.warn(
                                "Could not delete old image:",
                                deleteError.message
                            );
                        }
                    }
                }

                existingItem.image =
                    `/uploads/${req.file.filename}`;
            }

            const updatedItem =
                await existingItem.save();

            return res.status(200).json({
                success: true,
                message:
                    "Item updated successfully.",
                item:
                    sanitizeItem(
                        updatedItem.toObject()
                    )
            });
        } catch (error) {
            console.error(
                "ERROR UPDATING ITEM:",
                error
            );

            return res.status(400).json({
                success: false,
                message:
                    "Failed to update item.",
                error: error.message
            });
        }
    }
);

// ============================================================
// RESOLVE ITEM
// ============================================================

app.put(
    "/api/items/:id/resolve",
    async function (req, res) {
        try {
            const updatedItem =
                await Item.findByIdAndUpdate(
                    req.params.id,
                    {
                        status: "Resolved",
                        isUrgent: false
                    },
                    {
                        new: true
                    }
                );

            if (!updatedItem) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Item not found."
                });
            }

            return res.status(200).json({
                success: true,
                message:
                    "Item marked as resolved successfully.",
                item:
                    sanitizeItem(
                        updatedItem.toObject()
                    )
            });
        } catch (error) {
            console.error(
                "ERROR RESOLVING ITEM:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update item status.",
                error: error.message
            });
        }
    }
);

// ============================================================
// DELETE ITEM
// ============================================================

app.delete(
    "/api/items/:id",
    async function (req, res) {
        try {
            const deletedItem =
                await Item.findByIdAndDelete(
                    req.params.id
                );

            if (!deletedItem) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Item not found."
                });
            }

            // =================================================
            // DELETE IMAGE
            // =================================================

            if (
                deletedItem.image &&
                deletedItem.image.startsWith(
                    "/uploads/"
                )
            ) {
                const fileName =
                    path.basename(
                        deletedItem.image
                    );

                const filePath =
                    path.join(
                        uploadFolder,
                        fileName
                    );

                if (
                    fs.existsSync(
                        filePath
                    )
                ) {
                    try {
                        fs.unlinkSync(
                            filePath
                        );
                    } catch (
                        deleteError
                    ) {
                        console.warn(
                            "Could not delete image:",
                            deleteError.message
                        );
                    }
                }
            }

            return res.status(200).json({
                success: true,
                message:
                    "Item deleted successfully."
            });
        } catch (error) {
            console.error(
                "ERROR DELETING ITEM:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to delete item.",
                error: error.message
            });
        }
    }
);

// ============================================================
// MULTER ERROR HANDLER
// ============================================================

app.use(
    function (error, req, res, next) {
        if (
            error instanceof multer.MulterError
        ) {
            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Image size must be less than 5MB."
                });
            }

            return res.status(400).json({
                success: false,
                message:
                    error.message
            });
        }

        if (error) {
            return res.status(400).json({
                success: false,
                message:
                    error.message
            });
        }

        next();
    }
);

// ============================================================
// 404 API HANDLER
// ============================================================

app.use(
    "/api",
    function (req, res) {
        return res.status(404).json({
            success: false,
            message:
                "API route not found."
        });
    }
);

// ============================================================
// LOCAL SERVER
// ============================================================

if (!isVercel) {
    connectDB()
        .then(function () {
            const PORT =
                process.env.PORT || 5000;

            app.listen(
                PORT,
                function () {
                    console.log(
                        "=========================================="
                    );

                    console.log(
                        "CampusFind Backend Started"
                    );

                    console.log(
                        `Server running on http://localhost:${PORT}`
                    );

                    console.log(
                        "MongoDB Connected Successfully"
                    );

                    console.log(
                        "=========================================="
                    );
                }
            );
        })
        .catch(function (error) {
            console.error(
                "=========================================="
            );

            console.error(
                "MongoDB Connection Error:"
            );

            console.error(
                error
            );

            console.error(
                "=========================================="
            );

            process.exit(1);
        });
}

// ============================================================
// VERCEL EXPORT
// ============================================================

module.exports = app;