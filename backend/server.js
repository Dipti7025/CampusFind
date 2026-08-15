const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");

require("dotenv").config({
    override: true
});

const Item = require("./models/item");

const app = express();

const isVercel = Boolean(process.env.VERCEL);

// ============================================================
// CLOUDINARY CONFIGURATION
// ============================================================

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log(
    "Cloudinary configured:",
    Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    )
);

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
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!process.env.MONGO_URI) {
        throw new Error(
            "MONGO_URI environment variable is missing."
        );
    }

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
// MULTER MEMORY STORAGE
// ============================================================
//
// IMPORTANT:
// We no longer save images into /uploads.
// The image is temporarily kept in memory and then
// uploaded directly to Cloudinary.
//

const storage = multer.memoryStorage();

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
// UPLOAD IMAGE TO CLOUDINARY
// ============================================================

function uploadToCloudinary(fileBuffer) {
    return new Promise((resolve, reject) => {
        const uploadStream =
            cloudinary.uploader.upload_stream(
                {
                    folder: "campusfind/items",
                    resource_type: "image"
                },
                function (error, result) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

        uploadStream.end(fileBuffer);
    });
}

// ============================================================
// DELETE IMAGE FROM CLOUDINARY
// ============================================================

async function deleteCloudinaryImage(imageUrl) {
    try {
        if (
            !imageUrl ||
            !imageUrl.includes("res.cloudinary.com")
        ) {
            return;
        }

        const parts = imageUrl.split("/");

        const uploadIndex =
            parts.indexOf("upload");

        if (uploadIndex === -1) {
            return;
        }

        let publicIdParts =
            parts.slice(uploadIndex + 1);

        // Remove transformations/version information
        if (
            publicIdParts.length > 0 &&
            /^v\d+$/.test(publicIdParts[0])
        ) {
            publicIdParts.shift();
        }

        // Remove file extension
        const lastIndex =
            publicIdParts.length - 1;

        publicIdParts[lastIndex] =
            publicIdParts[lastIndex].replace(
                /\.[^/.]+$/,
                ""
            );

        const publicId =
            publicIdParts.join("/");

        if (publicId) {
            await cloudinary.uploader.destroy(
                publicId,
                {
                    resource_type: "image"
                }
            );
        }
    } catch (error) {
        console.warn(
            "Could not delete Cloudinary image:",
            error.message
        );
    }
}

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
// SAFE ITEM RESPONSE
// ============================================================

function sanitizeItem(item) {
    const safeItem = {
        ...item
    };

    delete safeItem.verificationAnswer1;
    delete safeItem.verificationAnswer2;

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

            const safeItems =
                items.map(sanitizeItem);

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
            // URGENT
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
            // CLOUDINARY IMAGE
            // =================================================

            let imageUrl = "";

            if (req.file) {
                console.log(
                    "Uploading image to Cloudinary..."
                );

                const cloudinaryResult =
                    await uploadToCloudinary(
                        req.file.buffer
                    );

                imageUrl =
                    cloudinaryResult.secure_url;

                console.log(
                    "Cloudinary image URL:",
                    imageUrl
                );
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
                    imageUrl,

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
                "Saved image:",
                savedItem.image
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
                answer1 === correctAnswer1 &&
                answer2 === correctAnswer2
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
            // NEW IMAGE
            // =================================================

            if (req.file) {
                console.log(
                    "Uploading updated image to Cloudinary..."
                );

                const cloudinaryResult =
                    await uploadToCloudinary(
                        req.file.buffer
                    );

                const newImageUrl =
                    cloudinaryResult.secure_url;

                // Delete old Cloudinary image
                if (
                    existingItem.image &&
                    existingItem.image.includes(
                        "res.cloudinary.com"
                    )
                ) {
                    await deleteCloudinaryImage(
                        existingItem.image
                    );
                }

                existingItem.image =
                    newImageUrl;

                console.log(
                    "Updated image:",
                    newImageUrl
                );
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

            // Delete Cloudinary image
            if (
                deletedItem.image &&
                deletedItem.image.includes(
                    "res.cloudinary.com"
                )
            ) {
                await deleteCloudinaryImage(
                    deletedItem.image
                );
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
                        "Cloudinary Image Storage Enabled"
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

            console.error(error);

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