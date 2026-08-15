import { useState } from "react";

function EditItem({ item, onBack, onUpdated }) {
  const [formData, setFormData] = useState({
    itemName: item.itemName || "",
    category: item.category || "",
    type: item.type || "Lost",
    description: item.description || "",
    location: item.location || "",
    date: item.date
      ? new Date(item.date)
          .toISOString()
          .split("T")[0]
      : "",
    contact: item.contact || "",

    verificationMethod:
      item.verificationMethod || "none",

    verificationQuestion1:
      item.verificationQuestion1 || "",

    verificationAnswer1: "",

    verificationQuestion2:
      item.verificationQuestion2 || "",

    verificationAnswer2: ""
  });

  const [image, setImage] = useState(null);

  const [imagePreview, setImagePreview] =
    useState(
      item.image
        ? `https://campus-find-peach.vercel.app${item.image}`
        : ""
    );

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

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


  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData({
      ...formData,
      [name]: value
    });
  };


  const handleImageChange = (event) => {

    const selectedImage =
      event.target.files[0];

    if (!selectedImage) {
      return;
    }

    setImage(selectedImage);

    setImagePreview(
      URL.createObjectURL(
        selectedImage
      )
    );
  };


  const handleSubmit = async (event) => {

    event.preventDefault();

    setLoading(true);
    setMessage("");


    if (
      formData.type === "Found" &&
      formData.verificationMethod ===
        "questions"
    ) {

      if (
        !formData.verificationQuestion1 ||
        !formData.verificationAnswer1 ||
        !formData.verificationQuestion2 ||
        !formData.verificationAnswer2
      ) {

        setMessage(
          "Please complete both verification questions."
        );

        setLoading(false);

        return;
      }
    }


    try {

      const data =
        new FormData();


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
        formData.type
      );

      data.append(
        "description",
        formData.description
      );

      data.append(
        "location",
        formData.type === "Found"
          ? formData.location
          : ""
      );

      data.append(
        "date",
        formData.date
      );

      data.append(
        "contact",
        formData.contact
      );


      // Verification
      if (
        formData.type === "Found"
      ) {

        data.append(
          "verificationMethod",
          formData.verificationMethod
        );


        if (
          formData.verificationMethod ===
          "questions"
        ) {

          data.append(
            "verificationQuestion1",
            formData.verificationQuestion1
          );

          data.append(
            "verificationAnswer1",
            formData.verificationAnswer1
          );

          data.append(
            "verificationQuestion2",
            formData.verificationQuestion2
          );

          data.append(
            "verificationAnswer2",
            formData.verificationAnswer2
          );

        }

      } else {

        data.append(
          "verificationMethod",
          "none"
        );

      }


      if (image) {

        data.append(
          "image",
          image
        );

      }


      const response =
        await fetch(
          `https://campus-find-peach.vercel.app/api/items/${item._id}`,
          {
            method: "PUT",
            body: data
          }
        );


      const result =
        await response.json();


      if (!response.ok) {

        throw new Error(
          result.message ||
          "Failed to update item"
        );

      }


      setMessage(
        "Item updated successfully!"
      );


      setTimeout(() => {
        onUpdated(
          result.item
        );
      }, 500);


    } catch (error) {

      console.error(
        "Error updating item:",
        error
      );

      setMessage(
        error.message ||
        "Unable to update item."
      );

    } finally {

      setLoading(false);

    }

  };


  return (
    <div className="edit-page">

      <div className="edit-container">

        <button
          className="back-btn"
          onClick={onBack}
        >
          ← Back to Admin Dashboard
        </button>


        <div className="edit-header">

          <p className="small-title">
            CAMPUSFIND
          </p>

          <h1>
            Edit Report
          </h1>

          <p>
            Update the details of this
            reported item.
          </p>

        </div>


        <form
          className="edit-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label>
              Item Name *
            </label>

            <input
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              required
            />

          </div>


          <div className="form-group">

            <label>
              Category *
            </label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
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


          <div className="form-group">

            <label>
              Report Type *
            </label>

            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >

              <option value="Lost">
                Lost
              </option>

              <option value="Found">
                Found
              </option>

            </select>

          </div>


          <div className="form-group">

            <label>
              Description *
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
            />

          </div>


          {formData.type === "Found" && (

            <div className="form-group">

              <label>
                Location *
              </label>

              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />

            </div>

          )}


          <div className="form-group">

            <label>
              Date *
            </label>

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />

          </div>


          <div className="form-group">

            <label>
              Contact Information *
            </label>

            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              required
            />

          </div>


          {/* ==========================================
              VERIFICATION
          ========================================== */}

          {formData.type === "Found" && (

            <div className="verification-form-section">

              <div className="verification-form-header">

                <h3>
                  🔐 Ownership Verification
                </h3>

                <p>
                  Choose the verification method
                  for this found item.
                </p>

              </div>


              <div className="verification-method-options">

                <label className="verification-method-option">

                  <input
                    type="radio"
                    name="verificationMethod"
                    value="none"
                    checked={
                      formData.verificationMethod ===
                      "none"
                    }
                    onChange={handleChange}
                  />

                  <span>
                    <strong>
                      No verification
                    </strong>

                    <small>
                      Contact the finder directly.
                    </small>
                  </span>

                </label>


                <label className="verification-method-option">

                  <input
                    type="radio"
                    name="verificationMethod"
                    value="questions"
                    checked={
                      formData.verificationMethod ===
                      "questions"
                    }
                    onChange={handleChange}
                  />

                  <span>
                    <strong>
                      Private questions
                    </strong>

                    <small>
                      Ask questions only the real owner
                      should know.
                    </small>
                  </span>

                </label>


                <label className="verification-method-option">

                  <input
                    type="radio"
                    name="verificationMethod"
                    value="faceToFace"
                    checked={
                      formData.verificationMethod ===
                      "faceToFace"
                    }
                    onChange={handleChange}
                  />

                  <span>
                    <strong>
                      Face-to-face verification
                    </strong>

                    <small>
                      Verify ownership in person.
                    </small>
                  </span>

                </label>

              </div>


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
                      onChange={handleChange}
                      required
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
                      onChange={handleChange}
                      placeholder="Enter the correct answer"
                      required
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
                      onChange={handleChange}
                      required
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
                      onChange={handleChange}
                      placeholder="Enter the correct answer"
                      required
                    />

                  </div>

                </div>
              )}


              {formData.verificationMethod ===
                "faceToFace" && (

                <div className="verification-note">

                  🤝 <strong>
                    Face-to-face verification
                  </strong>

                  <p>
                    The claimant will arrange a
                    meeting with the finder and
                    verify ownership in person.
                  </p>

                </div>

              )}

            </div>
          )}


          {/* IMAGE */}

          <div className="form-group">

            <label>
              Update Image
            </label>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleImageChange}
            />

            <small>
              Leave empty to keep the existing image.
            </small>


            {imagePreview && (

              <div className="edit-image-preview">

                <p>
                  Image Preview
                </p>

                <img
                  src={imagePreview}
                  alt={formData.itemName}
                />

              </div>
            )}

          </div>


          {message && (
            <div className="form-message">
              {message}
            </div>
          )}


          <div className="edit-form-buttons">

            <button
              type="button"
              className="edit-cancel-btn"
              onClick={onBack}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="edit-save-btn"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default EditItem;
