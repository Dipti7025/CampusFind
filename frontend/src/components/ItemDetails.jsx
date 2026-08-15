import { useState } from "react";

function ItemDetails({ item, onBack }) {
  const [showVerification, setShowVerification] =
    useState(false);

  const [verificationMessage, setVerificationMessage] =
    useState("");

  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");

  const [verified, setVerified] =
    useState(false);

  const [verifying, setVerifying] =
    useState(false);

  const [showContactMessage, setShowContactMessage] =
    useState(false);

  const [isResolved, setIsResolved] =
    useState(item?.status === "Resolved");

  const [resolving, setResolving] =
    useState(false);

  const [resolveMessage, setResolveMessage] =
    useState("");

  const [shareMessage, setShareMessage] =
    useState("");


  if (!item) {
    return null;
  }


  const isLost = item.type === "Lost";
  const isFound = item.type === "Found";

  const verificationMethod =
    item.verificationMethod || "none";


  // ==========================================
  // LINK
  // ==========================================

  const getItemLink = () => {
    return `${window.location.origin}/?item=${item._id}`;
  };


  // ==========================================
  // COPY LINK
  // ==========================================

  const handleCopyLink = async () => {

    try {

      await navigator.clipboard.writeText(
        getItemLink()
      );

      setShareMessage(
        "Report link copied to clipboard!"
      );

    } catch (error) {

      console.error(error);

      setShareMessage(
        "Unable to copy the link."
      );

    }

    setTimeout(() => {
      setShareMessage("");
    }, 3000);
  };


  // ==========================================
  // SHARE
  // ==========================================

  const handleShare = async () => {

    const itemLink =
      getItemLink();

    const shareData = {
      title:
        `${item.itemName} | CampusFind`,

      text:
        `Check out this ${item.type.toLowerCase()} item on CampusFind.`,

      url:
        itemLink
    };

    try {

      if (navigator.share) {

        await navigator.share(
          shareData
        );

        setShareMessage(
          "Report shared successfully!"
        );

      } else {

        await navigator.clipboard.writeText(
          itemLink
        );

        setShareMessage(
          "Sharing is not supported here, so the link was copied instead."
        );
      }

    } catch (error) {

      if (
        error.name !== "AbortError"
      ) {

        setShareMessage(
          "Unable to share the report."
        );

      }
    }

    setTimeout(() => {
      setShareMessage("");
    }, 4000);
  };


  // ==========================================
  // CLAIM ACTION
  // ==========================================

  const handleClaimClick = () => {

    // LOST:
    // Someone found the item

    if (isLost) {
      setShowContactMessage(true);
      return;
    }


    // FOUND:
    // Someone is claiming ownership

    if (isFound) {

      // No verification
      if (
        verificationMethod ===
        "none"
      ) {
        setShowContactMessage(true);
        return;
      }


      // Questions
      if (
        verificationMethod ===
        "questions"
      ) {

        setShowVerification(true);
        setVerificationMessage("");
        return;
      }


      // Face to face
      if (
        verificationMethod ===
        "faceToFace"
      ) {

        setShowContactMessage(true);
        return;
      }
    }
  };


  // ==========================================
  // VERIFY OWNERSHIP
  // ==========================================

  const handleVerifyOwnership = async (
    event
  ) => {

    event.preventDefault();

    setVerifying(true);
    setVerificationMessage("");

    try {

      const response =
        await fetch(
          `http://localhost:5000/api/items/${item._id}/verify`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              answer1,
              answer2
            })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        setVerified(false);

        setVerificationMessage(
          data.message ||
          "Ownership could not be verified."
        );

        return;
      }


      if (data.verified) {

        setVerified(true);

        setVerificationMessage(
          "✅ Ownership verified successfully!"
        );

      }

    } catch (error) {

      console.error(
        "Verification error:",
        error
      );

      setVerificationMessage(
        "Unable to verify ownership."
      );

    } finally {

      setVerifying(false);

    }
  };


  // ==========================================
  // RESOLVE
  // ==========================================

  const handleResolve = async () => {

    const confirmed =
      window.confirm(
        "Are you sure this item has been returned/resolved?"
      );


    if (!confirmed) {
      return;
    }


    setResolving(true);
    setResolveMessage("");


    try {

      const response =
        await fetch(
          `http://localhost:5000/api/items/${item._id}/resolve`,
          {
            method: "PUT"
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to resolve item"
        );

      }


      setIsResolved(true);

      setResolveMessage(
        "Item has been successfully marked as resolved."
      );

    } catch (error) {

      console.error(error);

      setResolveMessage(
        "Unable to update the item."
      );

    } finally {

      setResolving(false);

    }
  };


  return (
    <div className="item-details-page">

      <div className="item-details-container">

        {/* Back */}

        <button
          className="back-btn"
          onClick={onBack}
        >
          ← Back to Browse
        </button>


        <div className="item-details-card">


          {/* IMAGE */}

          <div className="item-details-image-section">

            {item.image ? (

              <img
                src={`http://localhost:5000${item.image}`}
                alt={item.itemName}
                className="item-details-image"
              />

            ) : (

              <div className="item-details-no-image">
                📦
              </div>

            )}

          </div>


          {/* CONTENT */}

          <div className="item-details-content">


            {/* Badges */}

            <div className="details-badges">

              <span
                className={
                  isLost
                    ? "item-type lost"
                    : "item-type found"
                }
              >
                {item.type}
              </span>


              {isResolved && (
                <span className="resolved-badge">
                  ✓ Resolved
                </span>
              )}

            </div>


            {/* Name */}

            <h1>
              {item.itemName}
            </h1>


            {/* Description */}

            <p className="item-details-description">
              {item.description}
            </p>


            {/* Info */}

            <div className="item-details-info">

              <div>
                <strong>
                  Category
                </strong>

                <span>
                  {item.category}
                </span>
              </div>


              <div>
                <strong>
                  Location
                </strong>

                <span>
                  📍{" "}
                  {item.location ||
                    "Not provided"}
                </span>
              </div>


              <div>
                <strong>
                  Date
                </strong>

                <span>
                  {new Date(
                    item.date
                  ).toLocaleDateString()}
                </span>
              </div>


              <div>
                <strong>
                  Status
                </strong>

                <span>
                  {isResolved
                    ? "Resolved"
                    : "Active"}
                </span>
              </div>

            </div>


            {/* SHARE */}

            <div className="share-buttons">

              <button
                className="copy-link-btn"
                onClick={handleCopyLink}
              >
                🔗 Copy Link
              </button>


              <button
                className="share-report-btn"
                onClick={handleShare}
              >
                📤 Share Report
              </button>

            </div>


            {shareMessage && (
              <div className="share-message">
                {shareMessage}
              </div>
            )}


            {/* ==========================================
                LOST ITEM
            ========================================== */}

            {!isResolved &&
              isLost &&
              !showContactMessage && (

                <button
                  className="claim-btn lost-action"
                  onClick={handleClaimClick}
                >
                  🔎 I Found This Item
                </button>

              )}


            {/* Lost contact */}

            {!isResolved &&
              isLost &&
              showContactMessage && (

                <div className="contact-message">

                  <h3>
                    Great! You found this item.
                  </h3>

                  <p>
                    Please contact the person who
                    reported this lost item.
                  </p>

                  <div className="contact-number">
                    📞 {item.contact}
                  </div>

                  <button
                    className="back-contact-btn"
                    onClick={() =>
                      setShowContactMessage(false)
                    }
                  >
                    Back
                  </button>

                  <button
                    className="resolve-btn"
                    onClick={handleResolve}
                    disabled={resolving}
                  >
                    {resolving
                      ? "Updating..."
                      : "✓ Mark as Returned / Resolved"}
                  </button>

                </div>
              )}


            {/* ==========================================
                FOUND ITEM
            ========================================== */}

            {!isResolved &&
              isFound &&
              !showVerification &&
              !showContactMessage &&
              !verified && (

                <button
                  className="claim-btn found-action"
                  onClick={handleClaimClick}
                >
                  🔐 This Is My Item
                </button>

              )}


            {/* ==========================================
                QUESTIONS
            ========================================== */}

            {!isResolved &&
              isFound &&
              verificationMethod ===
                "questions" &&
              showVerification &&
              !verified && (

                <div className="ownership-verification">

                  <div className="verification-header">

                    <h3>
                      🔐 Verify Ownership
                    </h3>

                    <p>
                      Answer the private questions
                      to prove that this item belongs
                      to you.
                    </p>

                  </div>


                  <form
                    onSubmit={
                      handleVerifyOwnership
                    }
                  >

                    <div className="form-group">

                      <label>
                        {item.verificationQuestion1 ||
                          "Verification question unavailable"}
                      </label>

                      <input
                        type="text"
                        value={answer1}
                        onChange={(event) =>
                          setAnswer1(
                            event.target.value
                          )
                        }
                        placeholder="Your answer"
                        required
                      />

                    </div>


                    <div className="form-group">

                      <label>
                        {item.verificationQuestion2 ||
                          "Verification question unavailable"}
                      </label>

                      <input
                        type="text"
                        value={answer2}
                        onChange={(event) =>
                          setAnswer2(
                            event.target.value
                          )
                        }
                        placeholder="Your answer"
                        required
                      />

                    </div>


                    {verificationMessage && (
                      <div className="verification-result">
                        {verificationMessage}
                      </div>
                    )}


                    <button
                      type="submit"
                      className="verify-btn"
                      disabled={verifying}
                    >
                      {verifying
                        ? "Verifying..."
                        : "Verify Ownership"}
                    </button>


                    <button
                      type="button"
                      className="back-contact-btn"
                      onClick={() => {
                        setShowVerification(false);
                        setAnswer1("");
                        setAnswer2("");
                        setVerificationMessage("");
                      }}
                    >
                      Back
                    </button>

                  </form>

                </div>
              )}


            {/* ==========================================
                VERIFIED
            ========================================== */}

            {!isResolved &&
              isFound &&
              verificationMethod ===
                "questions" &&
              verified && (

                <div className="ownership-verified">

                  <h3>
                    ✅ Ownership Verified
                  </h3>

                  <p>
                    The answers matched the private
                    information provided by the finder.
                  </p>

                  <div className="contact-number">
                    📞 {item.contact}
                  </div>

                  <button
                    className="resolve-btn"
                    onClick={handleResolve}
                    disabled={resolving}
                  >
                    {resolving
                      ? "Updating..."
                      : "✓ Mark as Returned / Resolved"}
                  </button>

                </div>
              )}


            {/* ==========================================
                FACE-TO-FACE / NO VERIFICATION
            ========================================== */}

            {!isResolved &&
              isFound &&
              showContactMessage && (

                <div className="contact-message">

                  <h3>
                    {verificationMethod ===
                    "faceToFace"
                      ? "🤝 Face-to-Face Verification"
                      : "📞 Contact the Finder"}
                  </h3>


                  {verificationMethod ===
                  "faceToFace" ? (

                    <p>
                      Please contact the finder and
                      arrange a meeting. Verify ownership
                      in person before collecting the item.
                    </p>

                  ) : (

                    <p>
                      No additional verification was
                      selected. You can contact the finder
                      directly.
                    </p>

                  )}


                  <div className="contact-number">
                    📞 {item.contact}
                  </div>


                  <button
                    className="back-contact-btn"
                    onClick={() =>
                      setShowContactMessage(false)
                    }
                  >
                    Back
                  </button>


                  <button
                    className="resolve-btn"
                    onClick={handleResolve}
                    disabled={resolving}
                  >
                    {resolving
                      ? "Updating..."
                      : "✓ Mark as Returned / Resolved"}
                  </button>

                </div>
              )}


            {/* Resolve message */}

            {resolveMessage && (
              <div className="resolve-message">
                {resolveMessage}
              </div>
            )}


            {/* Already resolved */}

            {isResolved && (
              <div className="already-resolved">

                <h3>
                  ✓ Item Resolved
                </h3>

                <p>
                  This item has already been
                  returned/resolved.
                </p>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default ItemDetails;