import { useState } from "react";

function ReportItem({ type, onBack }) {

  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    description: "",
    location: "",
    date: "",
    contact: "",
    image: null,

    // ==========================================
    // EMERGENCY
    // ==========================================

    isUrgent: false,

    // ==========================================
    // VERIFICATION
    // ==========================================

    verificationMethod: "none",

    verificationQuestion1: "",
    verificationAnswer1: "",

    verificationQuestion2: "",
    verificationAnswer2: ""
  });


  const [imagePreview, setImagePreview] =
    useState("");


  const [message, setMessage] =
    useState("");


  const [loading, setLoading] =
    useState(false);


  const categories = [
    "Electronics",
    "Bags",
    "Personal Items",
    "Documents / ID",
    "Keys",
    "Books / Stationery",
    "Clothing",
    "Accessories",
    "Other"
  ];


  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (event) => {

    const { name, value } =
      event.target;


    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

  };


  // ==========================================
  // HANDLE URGENT CHECKBOX
  // ==========================================

  const handleUrgentChange = (event) => {

    setFormData((previous) => ({
      ...previous,

      isUrgent:
        event.target.checked
    }));

  };


  // ==========================================
  // HANDLE IMAGE
  // ==========================================

  const handleImageChange = (event) => {

    const selectedImage =
      event.target.files[0];


    if (!selectedImage) {
      return;
    }


    setFormData((previous) => ({
      ...previous,
      image: selectedImage
    }));


    setImagePreview(
      URL.createObjectURL(
        selectedImage
      )
    );

  };


  // ==========================================
  // SUBMIT FORM
  // ==========================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setLoading(true);
    setMessage("");


    // ==========================================
    // QUESTION VALIDATION
    // ==========================================

    if (
      type === "Found" &&
      formData.verificationMethod ===
        "questions"
    ) {

      if (
        !formData.verificationQuestion1.trim() ||
        !formData.verificationAnswer1.trim() ||
        !formData.verificationQuestion2.trim() ||
        !formData.verificationAnswer2.trim()
      ) {

        setMessage(
          "Please complete both verification questions and answers."
        );

        setLoading(false);

        return;
      }

    }


    try {

      const data =
        new FormData();


      // ==========================================
      // BASIC DATA
      // ==========================================

      data.append(
        "itemName",
        formData.itemName
      );


      data.append(
        "category",
        formData.category
      );


      data.append(
        "type",
        type
      );


      data.append(
        "description",
        formData.description
      );


      // Location only for Found
      if (type === "Found") {

        data.append(
          "location",
          formData.location
        );

      } else {

        data.append(
          "location",
          ""
        );

      }


      data.append(
        "date",
        formData.date
      );


      data.append(
        "contact",
        formData.contact
      );


      // ==========================================
      // EMERGENCY
      // ONLY LOST ITEMS CAN BE URGENT
      // ==========================================

      data.append(
        "isUrgent",
        type === "Lost"
          ? String(formData.isUrgent)
          : "false"
      );


      // ==========================================
      // VERIFICATION
      // ==========================================

      const selectedMethod =
        type === "Found"
          ? formData.verificationMethod
          : "none";


      data.append(
        "verificationMethod",
        selectedMethod
      );


      if (
        selectedMethod ===
        "questions"
      ) {

        data.append(
          "verificationQuestion1",
          formData.verificationQuestion1.trim()
        );


        data.append(
          "verificationAnswer1",
          formData.verificationAnswer1.trim()
        );


        data.append(
          "verificationQuestion2",
          formData.verificationQuestion2.trim()
        );


        data.append(
          "verificationAnswer2",
          formData.verificationAnswer2.trim()
        );

      }


      // ==========================================
      // IMAGE
      // ==========================================

      if (formData.image) {

        data.append(
          "image",
          formData.image
        );

      }


      // ==========================================
      // SEND TO BACKEND
      // ==========================================

      const response =
        await fetch(
          "http://localhost:5000/api/items",
          {
            method: "POST",
            body: data
          }
        );


      const result =
        await response.json();


      if (!response.ok) {

        throw new Error(
          result.message ||
          "Failed to report item"
        );

      }


      setMessage(
        `${type} item reported successfully!`
      );


      // ==========================================
      // CLEAR FORM
      // ==========================================

      setFormData({

        itemName: "",
        category: "",
        description: "",
        location: "",
        date: "",
        contact: "",
        image: null,

        isUrgent: false,

        verificationMethod: "none",

        verificationQuestion1: "",
        verificationAnswer1: "",

        verificationQuestion2: "",
        verificationAnswer2: ""

      });


      setImagePreview("");


      const fileInput =
        document.getElementById(
          "image"
        );


      if (fileInput) {
        fileInput.value = "";
      }


    } catch (error) {

      console.error(
        "Error reporting item:",
        error
      );


      setMessage(
        error.message ||
        "Something went wrong. Please try again."
      );


    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="report-page">

      <div className="report-container">


        {/* ==========================================
            BACK
        ========================================== */}

        <button
          className="back-btn"
          onClick={onBack}
        >
          ← Back to Home
        </button>


        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="report-header">

          <p>
            CAMPUS LOST & FOUND
          </p>


          <h1>
            Report {type} Item
          </h1>


          <span>
            Provide the details below to help
            students find their items.
          </span>

        </div>


        {/* ==========================================
            MESSAGE
        ========================================== */}

        {message && (

          <div className="form-message">
            {message}
          </div>

        )}


        <form
          className="report-form"
          onSubmit={handleSubmit}
        >


          {/* ==========================================
              ITEM NAME
          ========================================== */}

          <div className="form-group">

            <label>
              Item Name *
            </label>


            <input
              type="text"
              name="itemName"
              value={
                formData.itemName
              }
              onChange={
                handleChange
              }
              placeholder="e.g. Black Wallet"
              required
            />

          </div>


          {/* ==========================================
              CATEGORY
          ========================================== */}

          <div className="form-group">

            <label>
              Category *
            </label>


            <select
              name="category"
              value={
                formData.category
              }
              onChange={
                handleChange
              }
              required
            >

              <option value="">
                Select a category
              </option>


              {categories.map(
                (category) => (

                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>

                )
              )}

            </select>

          </div>


          {/* ==========================================
              DESCRIPTION
          ========================================== */}

          <div className="form-group">

            <label>
              Description *
            </label>


            <textarea
              name="description"
              value={
                formData.description
              }
              onChange={
                handleChange
              }
              placeholder="Describe the item, colour, brand, identifying features, etc."
              rows="4"
              required
            />

          </div>


          {/* ==========================================
              LOCATION
              FOUND ONLY
          ========================================== */}

          {type === "Found" && (

            <div className="form-group">

              <label>
                Location *
              </label>


              <input
                type="text"
                name="location"
                value={
                  formData.location
                }
                onChange={
                  handleChange
                }
                placeholder="Where was the item found?"
                required
              />


              <small>
                Mention where you found
                the item on campus.
              </small>

            </div>

          )}


          {/* ==========================================
              DATE
          ========================================== */}

          <div className="form-group">

            <label>
              Date *
            </label>


            <input
              type="date"
              name="date"
              value={
                formData.date
              }
              onChange={
                handleChange
              }
              required
            />

          </div>


          {/* ==========================================
              CONTACT
          ========================================== */}

          <div className="form-group">

            <label>
              Contact Information *
            </label>


            <input
              type="text"
              name="contact"
              value={
                formData.contact
              }
              onChange={
                handleChange
              }
              placeholder="Phone number or email"
              required
            />

          </div>


          {/* ==========================================
              EMERGENCY BROADCAST
              LOST ONLY
          ========================================== */}

          {type === "Lost" && (

            <div className="emergency-form-section">


              <label className="emergency-checkbox">

                <input
                  type="checkbox"
                  checked={
                    formData.isUrgent
                  }
                  onChange={
                    handleUrgentChange
                  }
                />


                <span>

                  <strong>
                    🚨 Mark as Emergency Lost Item
                  </strong>


                  <small>
                    This item will appear as a
                    prominent campus alert on the
                    Home page to help recover it quickly.
                  </small>

                </span>

              </label>


              {formData.isUrgent && (

                <div className="emergency-warning">

                  🚨
                  <strong>
                    Emergency broadcast enabled
                  </strong>

                  <p>
                    This report will be highlighted
                    on the CampusFind Home page until
                    the item is marked as resolved.
                  </p>

                </div>

              )}

            </div>

          )}


          {/* ==========================================
              VERIFICATION
              FOUND ONLY
          ========================================== */}

          {type === "Found" && (

            <div className="verification-form-section">


              <div className="verification-form-header">

                <h3>
                  🔐 Ownership Verification
                </h3>


                <p>
                  Choose the verification method
                  that suits this item. It is optional.
                </p>

              </div>


              {/* No verification */}

              <label className="verification-method-option">

                <input
                  type="radio"
                  name="verificationMethod"
                  value="none"
                  checked={
                    formData.verificationMethod ===
                    "none"
                  }
                  onChange={
                    handleChange
                  }
                />


                <span>

                  <strong>
                    No verification
                  </strong>


                  <small>
                    The claimant can contact
                    the finder directly.
                  </small>

                </span>

              </label>


              {/* Questions */}

              <label className="verification-method-option">

                <input
                  type="radio"
                  name="verificationMethod"
                  value="questions"
                  checked={
                    formData.verificationMethod ===
                    "questions"
                  }
                  onChange={
                    handleChange
                  }
                />


                <span>

                  <strong>
                    Private questions
                  </strong>


                  <small>
                    The claimant must answer
                    questions before contact details
                    are shown.
                  </small>

                </span>

              </label>


              {/* Face to Face */}

              <label className="verification-method-option">

                <input
                  type="radio"
                  name="verificationMethod"
                  value="faceToFace"
                  checked={
                    formData.verificationMethod ===
                    "faceToFace"
                  }
                  onChange={
                    handleChange
                  }
                />


                <span>

                  <strong>
                    Face-to-face verification
                  </strong>


                  <small>
                    The claimant verifies ownership
                    in person.
                  </small>

                </span>

              </label>


              {/* Questions */}

              {formData.verificationMethod ===
                "questions" && (

                <div className="verification-questions">


                  <div className="form-group">

                    <label>
                      Private Question 1 *
                    </label>


                    <input
                      type="text"
                      name="verificationQuestion1"
                      value={
                        formData.verificationQuestion1
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Example: What is inside the wallet?"
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Correct Answer 1 *
                    </label>


                    <input
                      type="text"
                      name="verificationAnswer1"
                      value={
                        formData.verificationAnswer1
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Private answer"
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Private Question 2 *
                    </label>


                    <input
                      type="text"
                      name="verificationQuestion2"
                      value={
                        formData.verificationQuestion2
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Example: What colour is the card holder?"
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Correct Answer 2 *
                    </label>


                    <input
                      type="text"
                      name="verificationAnswer2"
                      value={
                        formData.verificationAnswer2
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Private answer"
                    />

                  </div>

                </div>

              )}


              {/* Face-to-face */}

              {formData.verificationMethod ===
                "faceToFace" && (

                <div className="verification-note">

                  <strong>
                    🤝 Face-to-face verification
                  </strong>


                  <p>
                    The claimant will contact the
                    finder and verify ownership
                    in person.
                  </p>

                </div>

              )}

            </div>

          )}


          {/* ==========================================
              IMAGE
          ========================================== */}

          <div className="form-group">

            <label>
              Upload Image
            </label>


            <input
              id="image"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={
                handleImageChange
              }
            />


            <small>
              JPG, JPEG, PNG or WEBP.
              Maximum 5MB.
            </small>


            {imagePreview && (

              <div className="image-preview-box">

                <p>
                  Image Preview
                </p>


                <img
                  src={imagePreview}
                  alt="Selected preview"
                  className="image-preview"
                />

              </div>

            )}

          </div>


          {/* ==========================================
              SUBMIT
          ========================================== */}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >

            {loading
              ? "Submitting..."
              : `Report ${type} Item`}

          </button>

        </form>

      </div>

    </div>

  );
}

export default ReportItem;