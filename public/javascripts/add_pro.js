function validateForm() {
    const name = document.getElementById("name").value;
    const category = document.getElementById("category").value;
    const originalprice = document.getElementById("originalprice").value;
    const offers = document.getElementById("offers").value;
    const quantity = document.getElementById("quantity").value;
    const discription = document.getElementById("discription").value;
    const image = document.getElementById("fileUploader").files[0];

    // const errorMessages = document.getElementById("error-messages");
    // errorMessages.innerHTML = ""; // Clear previous error messages
    const e_name = document.getElementById("name-error-messages");
    const e_category = document.getElementById("category-error-messages");
    const e_price = document.getElementById("price-error-messages");
    const e_offers = document.getElementById("offers-error-messages");
    const e_quantity = document.getElementById("quantity-error-messages");
    const e_discription = document.getElementById("discription-error-messages");
    const e_image = document.getElementById("image-error-messages");

    let isValid = true;

    // Validation for Name, Category, Price, Offers, Quantity, and Description
    if (name.trim() === "") {
      e_name.innerHTML = "Name is required.";
      // appendErrorMessage("Name is required.");
      // isValid = false;
    } else if (name.trim().length < 5) {
      e_name.innerHTML = "Name must be at least 3 characters.";
      // appendErrorMessage("Name must be at least 3 characters.");
      // isValid = false;
    } else if (name.trim().length) {
      e_name.innerHTML = " ";
    }

    if (category.trim() === " ") {
      // appendErrorMessage("Category is required.");
      e_category.innerHTML = "Category is required.";
      isValid = false;
    }

    if (originalprice.trim() === "") {
      // appendErrorMessage("Price is required.");
      e_price.innerHTML = "Price is required.";
      isValid = false;
    } else if (originalprice.trim().length) {
      e_price.innerHTML = " ";
    }

    if (offers.trim() === "") {
      // appendErrorMessage("Offers is required.");
      e_offers.innerHTML = "Offers is required.";
      isValid = false;
    } else if (offers.trim().length) {
      e_offers.innerHTML = " ";
    }

    if (quantity.trim() === "") {
      // appendErrorMessage("Quantity is required.");
      e_quantity.innerHTML = "Quantity is required.";
      isValid = false;
    } else if (quantity.trim().length) {
      e_quantity.innerHTML = " ";
    }

    if (discription.trim() === "") {
      // appendErrorMessage("Description is required.");
      e_discription.innerHTML = "Description is required.";
      isValid = false;
    } else if (discription.trim().length < 10) {
      e_discription.innerHTML = "Description at least 10 characters.";
      isValid = false;
    } else if (discription.trim().length) {
      e_discription.innerHTML = " ";
    }

    // Image validation
    if (image) {
      const allowedExtensions = ["jpg", "png", "jpeg"];
      const maxSize = 5 * 1024 * 1024; // 5 MB

      const fileName = image.name.toLowerCase();
      const fileExtension = fileName.split(".").pop();

      if (!allowedExtensions.includes(fileExtension)) {
        // appendErrorMessage("Image must be in jpg, png, or jpeg format.");
        e_image.innerHTML = "Image must be in jpg, png, or jpeg format.";
        isValid = false;
      }

      if (image.size > maxSize) {
        // appendErrorMessage("Image size exceeds 5 MB.");
        e_image.innerHTML = "Image size exceeds 5 MB.";
        isValid = false;
      }
    }

    return isValid;
  }

  // function appendErrorMessage(message) {
  //     const errorMessages = document.getElementById("error-messages");
  //     const errorMessageElement = document.createElement("div");
  //     errorMessageElement.innerText = message;
  //     errorMessages.appendChild(errorMessageElement);
  // }