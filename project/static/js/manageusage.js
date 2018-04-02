// This function sets the submit() handler for the add/edit usage form that shows up in a colorbox; it is set up as
// a separate function mainly to keep the colorbox() function call from getting a little too deep and in-depth
handleUsageSubmit = function(project_id) {
	var $usageForm = $("#frmUsage");
	if ($usageForm.length > 0) {
		// The usage form was found (presumably in the colorbox), check and make sure it has an 'action' attribute
		// before setting the submit() handler

		var action = $usageForm.attr("action");
		if ((typeof(action) != "undefined") && (action != "")) {
			// The form has a non-empty 'action' attribute, set its submit() handler

			// Just in case the usage form somehow already has a submit() handler set up, clear it out before creating the new handler
			$usageForm.unbind("submit");

			$usageForm.submit(function(event) {
				if ((!isNaN(project_id)) && (project_id > 0)) {
					// The incoming project_id is a number greater than zero, continue handling form click
					event.preventDefault();

					// By default, don't submit this form
					var submitForm = false;
					if (typeof($(this)["validate"]) == "function") {
						// Client-side validation is being done, check it first before deciding to submit this form
						submitForm = (($(this).validate().errorList.length) == 0) ? true : false;
					}
					else {
						// No client-side validation is being done, go ahead and submit this form
						submitForm = true;
					}

					if (submitForm) {
						// The form's data has either been validated or is not being checked on the client side,
						// submit the form

						// Change the form's background color
						$("#colorbox").find("*").css("background-color", "#808080");

						// Try to change the Usage Submit button's text
						var waitText = "Tag Is Being Saved, Please Wait";
						var buttonType = "";
						var $button = $("#frmUsageSubmit");
						if ($button.length > 0) {
							// The button exists, first, try to treat it like a button() object

							var $buttonText = $("#frmUsageSubmit").find("span.ui-button-text");
							if ($buttonText.length > 0) {
								// It is a button() object, save its original text and change it

								buttonType = "button";
								usageSubmitButtonText = $buttonText.html();
								$buttonText.html(waitText);
							}
							else if (typeof($button.attr("value")) != "undefined") {
								// It is not a button() object, but it does have a value attribute, save the original value and
								// change it

								buttonType = "input";
								usageSubmitButtonText = $button.attr("value");
								$button.attr("value", waitText);
							}
						}

						// Instead of submitting the form and going to the resulting page, handle the POST submit via an AJAX call
						$.post(
							action
							,$usageForm.serialize()
							,function(data) {
								if ((typeof(data.saved) == "boolean") && (data.saved)) {
									// The tag data was saved, build the alert message, alert the user and close the colorbox
									var alertMessage = "";

									if ((typeof(data.message) != "undefined") && (data.message != "")) {
										alertMessage = data.message.replace(/Usage/, "Tag");
									}

									if (alertMessage == "") {
										alertMessage = "The Tag Was Saved";
									}

									alert(alertMessage);

									// Try to update the list of tags for this project
									if (typeof(refreshUsageOrder) != "undefined") {
										// The function "refreshUsageOrder()" is present, use it
										refreshUsageOrder(project_id);
									}
									else if ((typeof(data.usage_id) != "undefined") && (data.usage_id != "") && (typeof(data.usage) != "undefined") && (data.usage != "")) {
										// No "refreshUsageOrder()" function is present, but the desired "usage_id" and "usage" fields are
										// present in the data returned, use it to modify the usage's name displayed on the screen directly

										var $editUsageLink = $("#edit_project_id_" + project_id + "_usage_id_" + data.usage_id);
										if ($editUsageLink.length > 0) {
											// This usage has an "Edit Usage" link that matches the expected naming convention, change
											// its HTML
											$editUsageLink.html("<strong>" + data.usage + "</strong>");
										}

										var $tagReferencesLink = $("#tag_project_id_" + project_id + "_usage_id_" + data.usage_id);
										if ($tagReferencesLink.length > 0) {
											// The usage has a "Tag References" link that matches the expected naming convention, change
											// its HTML
											$tagReferencesLink.html(data.usage);
										}
									}

									// Change the colorbox's background back to white and close it
									$("#colorbox").find("*").css("background-color", "#FFFFFF");
									$.colorbox.close();

									// Give the user the opportunity to refresh both the cached project/tag query and the
									// the application-scope project tag tree object
									if (typeof(showRefreshTagTree) != "undefined") {
										showRefreshTagTree();
									}

									// If this is being access via a LitScreener/Project Page, refresh both the LitScreener and Project
									// tag lists
									if (typeof(refreshTags) != "undefined") {
										refreshTags();
									}
								}
								else {
									// The tag data was not saved, build the alert message and alert the user
									var alertMessage = "";

									if ((typeof(data.message) != "undefined") && (data.message != "")) {
										// Add the message returned from the AJAX call
										alertMessage = data.message;
									}

									if ((typeof(data.error) != "undefined") && (data.error != "")) {
										// Add the error text returned from the AJAX call
										if (alertMessage != "") {
											alertMessage = alertMessage + " - ";
										}
										alertMessage = alertMessage + data.error;
									}

									if (alertMessage == "") {
										// No alert message was build, use the default value instead
										alertMessage = "The Tag Could Not Be Saved";
									}

									alert(alertMessage);

									// If the original submit button text has been saved, re-apply it to the button
									if ((buttonType != "") && (usageSubmitButtonText != "")) {
										if (buttonType == "button") {
											// The submit button is a button() object, set its text accordingly
											$button.find("span.button-ui-text").html(usageSubmitButtonText);
										}
										else if (buttonType == "input") {
											// The submit button is an input tag, set its text accordingly
											$button.attr("value", usageSubmitButtonText);
										}
									}

									// Change the form's background color back to its regular color
									$("#colorbox").find("*").css("background-color", "#FFFFFF");
								}

								// Clear out the original submit button text
								usageSubmitButtonText = "";
							}
						);
					}
				}
				else {
					// Even if there is no processing, change the colorbox's background back to white and close it
					$("#colorbox").find("*").css("background-color", "#FFFFFF");
					$.colorbox.close();
				}

				// Supress the standard form submission activity (form was already submitted via AJAX)
				return false;
			});
		}
	}
}
