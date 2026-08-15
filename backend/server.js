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


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());
app.use(express.json());


// =========================================================
// UPLOAD FOLDER
// =========================================================

const uploadFolder = path.join(
    __dirname,
    "uploads"
);

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}


// =========================================================
// MULTER
// =========================================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadFolder);
    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }

});


const upload = multer({

    storage: storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowedTypes =
            /jpeg|jpg|png|webp/;

        const extension =
            allowedTypes.test(
                path.extname(
                    file.originalname
                ).toLowerCase()
            );

        const mimeType =
            allowedTypes.test(
                file.mimetype
            );

        if (extension && mimeType) {

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


// =========================================================
// SERVE IMAGES
// =========================================================

app.use(
    "/uploads",
    express.static(uploadFolder)
);


// =========================================================
// HOME ROUTE
// =========================================================

app.get("/", (req, res) => {

    res.send(
        "Campus Lost & Found Backend is Running!"
    );

});


// =========================================================
// GET ALL ITEMS
// =========================================================

app.get(
    "/api/items",
    async (req, res) => {

        try {

            const items =
                await Item.find()
                    .sort({
                        createdAt: -1
                    })
                    .lean();


            const safeItems =
                items.map((item) => {

                    const safeItem = {
                        ...item
                    };


                    // Never expose verification answers
                    delete safeItem.verificationAnswer1;
                    delete safeItem.verificationAnswer2;


                    // Backward compatibility for old
                    // question-based Found reports
                    const hasQuestions =
                        typeof safeItem.verificationQuestion1 === "string" &&
                        safeItem.verificationQuestion1.trim() !== "" &&
                        typeof safeItem.verificationQuestion2 === "string" &&
                        safeItem.verificationQuestion2.trim() !== "";


                    if (
                        safeItem.type === "Found" &&
                        hasQuestions
                    ) {

                        safeItem.verificationMethod =
                            "questions";

                    }


                    if (
                        !safeItem.verificationMethod
                    ) {

                        safeItem.verificationMethod =
                            "none";

                    }


                    // Always return a real boolean
                    safeItem.isUrgent =
                        safeItem.isUrgent === true;

                    return safeItem;

                });


            res.status(200).json(
                safeItems
            );

        } catch (error) {

            console.error(
                "ERROR FETCHING ITEMS:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to fetch items",

                error:
                    error.message

            });

        }

    }
);


// =========================================================
// GET ONE ITEM
// =========================================================

app.get(
    "/api/items/:id",
    async (req, res) => {

        try {

            const item =
                await Item.findById(
                    req.params.id
                )
                .lean();


            if (!item) {

                return res.status(404).json({

                    message:
                        "Item not found"

                });

            }


            const safeItem = {
                ...item
            };


            delete safeItem.verificationAnswer1;
            delete safeItem.verificationAnswer2;


            const hasQuestions =
                typeof safeItem.verificationQuestion1 === "string" &&
                safeItem.verificationQuestion1.trim() !== "" &&
                typeof safeItem.verificationQuestion2 === "string" &&
                safeItem.verificationQuestion2.trim() !== "";


            if (
                safeItem.type === "Found" &&
                hasQuestions
            ) {

                safeItem.verificationMethod =
                    "questions";

            }


            if (
                !safeItem.verificationMethod
            ) {

                safeItem.verificationMethod =
                    "none";

            }


            safeItem.isUrgent =
                safeItem.isUrgent === true;


            res.status(200).json(
                safeItem
            );

        } catch (error) {

            console.error(
                "ERROR FETCHING SINGLE ITEM:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to fetch item",

                error:
                    error.message

            });

        }

    }
);


// =========================================================
// ADD NEW ITEM
// =========================================================

app.post(
    "/api/items",
    upload.single("image"),
    async (req, res) => {

        try {

            // ==========================================
            // DEBUG
            // ==========================================

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
                "isUrgent received:",
                req.body.isUrgent
            );

            console.log(
                "Verification method:",
                req.body.verificationMethod
            );


            // ==========================================
            // URGENT FLAG
            // ==========================================

            let isUrgent = false;


            if (
                req.body.type === "Lost"
            ) {

                const urgentValue =
                    String(
                        req.body.isUrgent || ""
                    )
                    .trim()
                    .toLowerCase();


                isUrgent =
                    urgentValue === "true";

            }


            console.log(
                "isUrgent converted to:",
                isUrgent
            );


            // ==========================================
            // VERIFICATION
            // ==========================================

            let verificationMethod =
                req.body.verificationMethod ||
                "none";


            const hasQuestions =
                typeof req.body.verificationQuestion1 === "string" &&
                req.body.verificationQuestion1.trim() !== "" &&
                typeof req.body.verificationQuestion2 === "string" &&
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


            if (
                ![
                    "none",
                    "questions",
                    "faceToFace"
                ].includes(
                    verificationMethod
                )
            ) {

                verificationMethod =
                    "none";

            }


            // ==========================================
            // CREATE ITEM
            // ==========================================

            const newItem =
                new Item({

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

                    // IMPORTANT
                    isUrgent:
                        isUrgent,

                    verificationMethod:
                        verificationMethod,

                    verificationQuestion1:
                        verificationMethod === "questions"
                            ? (
                                req.body.verificationQuestion1 ||
                                ""
                            ).trim()
                            : "",

                    verificationAnswer1:
                        verificationMethod === "questions"
                            ? (
                                req.body.verificationAnswer1 ||
                                ""
                            ).trim()
                            : "",

                    verificationQuestion2:
                        verificationMethod === "questions"
                            ? (
                                req.body.verificationQuestion2 ||
                                ""
                            ).trim()
                            : "",

                    verificationAnswer2:
                        verificationMethod === "questions"
                            ? (
                                req.body.verificationAnswer2 ||
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


            res.status(201).json({

                message:
                    "Item reported successfully",

                item:
                    savedItem

            });

        } catch (error) {

            console.error(
                "ERROR ADDING ITEM:",
                error
            );

            res.status(400).json({

                message:
                    "Failed to add item",

                error:
                    error.message

            });

        }

    }
);


// =========================================================
// VERIFY OWNERSHIP
// =========================================================

app.post(
    "/api/items/:id/verify",
    async (req, res) => {

        try {

            const item =
                await Item.findById(
                    req.params.id
                );


            if (!item) {

                return res.status(404).json({

                    verified:
                        false,

                    message:
                        "Item not found"

                });

            }


            if (
                item.type !== "Found"
            ) {

                return res.status(400).json({

                    verified:
                        false,

                    message:
                        "Verification is only available for found items."

                });

            }


            const hasQuestions =
                typeof item.verificationQuestion1 === "string" &&
                item.verificationQuestion1.trim() !== "" &&
                typeof item.verificationQuestion2 === "string" &&
                item.verificationQuestion2.trim() !== "";


            const questionVerificationEnabled =
                item.verificationMethod === "questions" ||
                hasQuestions;


            if (
                !questionVerificationEnabled
            ) {

                return res.status(400).json({

                    verified:
                        false,

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

                    verified:
                        true,

                    message:
                        "Ownership verified successfully."

                });

            }


            return res.status(401).json({

                verified:
                    false,

                message:
                    "Ownership could not be verified. Please check your answers."

            });

        } catch (error) {

            console.error(
                "ERROR VERIFYING OWNERSHIP:",
                error
            );

            res.status(500).json({

                verified:
                    false,

                message:
                    "Verification failed.",

                error:
                    error.message

            });

        }

    }
);


// =========================================================
// UPDATE ITEM
// =========================================================

app.put(
    "/api/items/:id",
    upload.single("image"),
    async (req, res) => {

        try {

            const existingItem =
                await Item.findById(
                    req.params.id
                );


            if (!existingItem) {

                return res.status(404).json({

                    message:
                        "Item not found"

                });

            }


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


            // ==========================================
            // UPDATE URGENT FLAG
            // ==========================================

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


            // ==========================================
            // UPDATE VERIFICATION
            // ==========================================

            let verificationMethod =
                req.body.verificationMethod ||
                "none";


            const hasQuestions =
                typeof req.body.verificationQuestion1 === "string" &&
                req.body.verificationQuestion1.trim() !== "" &&
                typeof req.body.verificationQuestion2 === "string" &&
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


            if (
                ![
                    "none",
                    "questions",
                    "faceToFace"
                ].includes(
                    verificationMethod
                )
            ) {

                verificationMethod =
                    "none";

            }


            existingItem.verificationMethod =
                verificationMethod;


            if (
                verificationMethod === "questions"
            ) {

                existingItem.verificationQuestion1 =
                    (
                        req.body.verificationQuestion1 ||
                        ""
                    ).trim();

                existingItem.verificationAnswer1 =
                    (
                        req.body.verificationAnswer1 ||
                        ""
                    ).trim();

                existingItem.verificationQuestion2 =
                    (
                        req.body.verificationQuestion2 ||
                        ""
                    ).trim();

                existingItem.verificationAnswer2 =
                    (
                        req.body.verificationAnswer2 ||
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


            // ==========================================
            // UPDATE IMAGE
            // ==========================================

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

                        fs.unlinkSync(
                            oldFilePath
                        );

                    }

                }


                existingItem.image =
                    `/uploads/${req.file.filename}`;

            }


            const updatedItem =
                await existingItem.save();


            res.status(200).json({

                message:
                    "Item updated successfully",

                item:
                    updatedItem

            });

        } catch (error) {

            console.error(
                "ERROR UPDATING ITEM:",
                error
            );

            res.status(400).json({

                message:
                    "Failed to update item",

                error:
                    error.message

            });

        }

    }
);


// =========================================================
// RESOLVE ITEM
// =========================================================

app.put(
    "/api/items/:id/resolve",
    async (req, res) => {

        try {

            const updatedItem =
                await Item.findByIdAndUpdate(

                    req.params.id,

                    {
                        status:
                            "Resolved",

                        isUrgent:
                            false
                    },

                    {
                        new:
                            true
                    }
                );


            if (!updatedItem) {

                return res.status(404).json({

                    message:
                        "Item not found"

                });

            }


            res.status(200).json({

                message:
                    "Item marked as resolved successfully",

                item:
                    updatedItem

            });

        } catch (error) {

            console.error(
                "ERROR RESOLVING ITEM:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to update item status",

                error:
                    error.message

            });

        }

    }
);


// =========================================================
// DELETE ITEM
// =========================================================

app.delete(
    "/api/items/:id",
    async (req, res) => {

        try {

            const deletedItem =
                await Item.findByIdAndDelete(
                    req.params.id
                );


            if (!deletedItem) {

                return res.status(404).json({

                    message:
                        "Item not found"

                });

            }


            // Delete image
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

                    fs.unlinkSync(
                        filePath
                    );

                }

            }


            res.status(200).json({

                message:
                    "Item deleted successfully"

            });

        } catch (error) {

            console.error(
                "ERROR DELETING ITEM:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to delete item",

                error:
                    error.message

            });

        }

    }
);


// =========================================================
// START SERVER
// =========================================================

mongoose
    .connect(
        process.env.MONGO_URI
    )

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


        const PORT =
            process.env.PORT ||
            5000;


        app.listen(
            PORT,
            () => {

                console.log(
                    `Server running on http://localhost:${PORT}`
                );

            }
        );

    })
    .catch((error) => {

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

    });