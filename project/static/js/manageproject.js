var usageSubmitButtonText = "";
var original_usage_id_order = {};
var original_usage_html = {};
var isListPage = false;

$(document).ready(function() {
	isListPage = ((typeof(pageAction) != "undefined") && (pageAction == "list")) ? true : false;

	// By default, hide the 'Loading' spinning graphic, and on the project list page, hide the projects' usage lists
	$("#ajaxLoadingIcon").hide();

	// Make every other usageElement (on details page) shaded
	$(".topUsageContainer").find(".usageElement:even").addClass("shaded");

	// Set shading and highlighting classes for project rows (on list page)
	var $projectRow = $(".projectRow");
	if ($projectRow.length > 0) {
		// Make every other project row (on list page) shaded
		$(".projectRow:even").addClass("shaded");

		// Add a highlighting class when hovering over a project row
		$projectRow.hover(
			function() {
				if (!$(this).hasClass("selected")) {
					$(this).addClass("highlight");
				}
			}
			,function() {
				$(this).removeClass("highlight");
				if (!$(this).hasClass("selected")) {
				}
			}
		);
	}

	// For the 'list' page, set the tabs() for the project categories
	var $project_tabs = $("#project_tabs");
	if ($project_tabs.length > 0) {
		// The 'destroy' method gets called because if this is the second (or more) time calling this function, the tabs need
		// to be destroyed and re-initialized
		$project_tabs.tabs("destroy");
		$project_tabs.tabs();
	}

	// Set the list of the usage_id values in their original order (before anything gets drug 'n' dropped)
	makeOrderedUsageIdList();

	// Set the drag 'n' drop sortability for the usage branches
	makeUsagesSortable();

	// Set the click() handler for the ajaxUsageLink links
	handleUsageClick();

	// Set the click() handler for saving a re-ordered usage tree
	handleSaveUsageOrderClick();

	// Set the click() handler for the "Modify Tag Order" buttons (on list page)
	handleModifyUsageOrderClick();

	// Set show/hide for project usages (on list page)
	if (isListPage) {
		var $tagListExpand = $(".tagListExpand");
		if ($tagListExpand.length > 0) {
			$tagListExpand.siblings("div").hide();
			$tagListExpand.click(function() {
				$(this).siblings("div").toggle();
				$(this).childNodes[0].toggleClass("fa-minus-square fa-plus-square");
				($(this).title == 'Click the plus sign to see all the options') ?
					$(this).attr("title", "Click the plus sign to see all the options") :
					$(this).attr("title", "Click the minus sign to hide all the options");
			});
		}
	}

	// Set the button() look and feel for the "Refresh Tag Tree" button (if it exists)
	$("#refreshTagTreeButton").button();
});

// This function checks an object to see whether or not it is empty
isEmpty = function(toCheck) {
	if (typeof(toCheck) == 'object') {
		// Item being checked is an object, continue checking

		for (var i in toCheck) {
			// Item being checked has at least one index or key/value pair, return false
			return false;
		}

		// Object being checked had no indices or key/value pairs, return true
		return true;
	}
	else {
		// Item being checked is not an object, return false
		return false;
	}
}

// This function creates a comma-separated list of a project's usage_id values as currently ordered on the page (order can change as branches
// of the usage tree are dragged and dropped); if no project_id is passed in, lists will be created for all the projects on the page
makeOrderedUsageIdList = function() {
	var orderListExists = (typeof(original_usage_id_order) == "object");
	var orderHTMLExists = (typeof(original_usage_html) == "object");

	if ((orderListExists) && (orderHTMLExists)) {
		// The page-level object original_usage_id_order and original_usage_html both exist, continue

		var div_id = [];

		// Iterate through incoming arguments looking for potiential project_id values
		for (var i in arguments) {
			var type = typeof(arguments[i]);

			if (type == "string") {
				// For strings, check to see if the string is a comma-separated list of numbers

				var values = arguments[i].split(",");
				for (var i in values) {
					if ((!isNaN(values[i])) && (Math.floor(values[i]) > 0)) {
						// The value is a number with the integer portion greater than zero, check to see if a related usage
						// a related usage container element exists for this project_id

						var id = "#project_id_" + Math.floor(values[i]) + "_usage_container";
						if ($(id).length > 0) {
							// Element exists, include id in div_id array
							div_id.push(id);
						}
					}
				}
			}
			else if ((type == "number") && (Math.floor(arguments[i]) > 0)) {
				// The argument is a number with the integer portion greater than zero, check to see if a related usage
				// usage container element exists for this project_id

				var id = "#project_id_" + Math.floor(arguments[i]) + "_usage_container";
				if ($(id).length > 0) {
					// Element exists, include id in div_id array
					div_id.push(id);
				}
			}
		}

		if (div_id.length == 0) {
			// No valid project_id values were passed in, look for all project usage containers on the page

			$(".topUsageContainer").each(function() {
				if (typeof($(this).attr("id")) != "undefined") {
					// The element has an id, include it in the div_id array
					div_id.push("#" + $(this).attr("id"));
				}
			});
		}

		// Iterate through div_id and extract usage_id values from the usage elements within each project's div
		for (var i in div_id) {
			var usage_id = [];

			// Iterate through each usage element; if the element has an id value that matches the desired naming convention,
			// extract the user_id from it and add it to the user_id array
			$(div_id[i]).find(".usageElement").each(function() {
				if ((typeof($(this).attr("id")) != "undefined") && ($(this).attr("id").match(/^usage_id_\d+$/i))) {
					usage_id.push($(this).attr("id").replace(/^usage_id_(\d+)$/, "$1"));
				}
			});

			// Save out a comma-separated string of usage_id values in the page-level original_usage_id_order object
			original_usage_id_order[div_id[i]] = usage_id.join();

			// Save out a copy of the HTML that makes up the entire set of usages
			original_usage_html[div_id[i]] = $(div_id[i]).html();
		}
	}
}

getCurrentUsageOrder = function(id) {
	var returnValue = [];

	if ((typeof(id) != "undefined") && (id != "") && (typeof(original_usage_id_order[id]) != "undefined")) {
		var counter = 0;
		$(id).find(".usageElement").each(function() {
			counter++;
			if ((typeof($(this).attr("id")) != "undefined") && ($(this).attr("id").match(/^usage_id_\d+$/i))) {
				returnValue.push($(this).attr("id").replace(/^usage_id_(\d+)$/, "$1"));
			}
		});
	}

	return returnValue.join();
}

// This function makes the hierarchy tree of usages (tags) sortable; this is done in a separate function because it needs to be called
// more than once within the page execution
makeUsagesSortable = function() {
	var $usageContainer = $(".usageContainer");
	if ($usageContainer.length > 0) {
		$usageContainer.sortable({
			items: "> .sortableElement"
			,axis: "y"
			,start: function(event, ui) {
				// This function is executed whenever an element starts being drug, add the 'beingDragged' class to the element
				ui.item.addClass("beingDragged");
			}
			,stop: function(event, ui) {
				// This function is executed whenever the element being drug is dropped

				// First, remove the 'beingDragged' class from the element being dropped and add the 'gotDropped' class to it
				ui.item.removeClass("beingDragged");
				ui.item.addClass("gotDropped");

				// Go up the "parent chain" for the element that was just dropped and look for the top-level usage container
				// container for this particular usage's project
				var project_id = "";
				var $element = $(event.target).parent();

				// If project_id has not yet been found and the parent element being checked has a "usageContainer" class,
				// keep searching for project_id
				while ((project_id == "") && ($element.hasClass("usageContainer"))) {
					if (($element.hasClass("topUsageContainer")) && (typeof($element.attr("id")) != "undefined") && ($element.attr("id").match(/^project_id_(\d+)_usage_container/))) {
						// The top-level usage container for the usage being dropped has been found and it has an id
						// attribute that matches the desired naming convention, extract project_id from the id
						project_id = $element.attr("id").replace(/^project_id_(\d+)_usage_container.*$/, "$1");
					}

					// Move up to the next parent in the "parent chain"
					$element = $element.parent();
				}

				if (project_id != "") {
					// project_id found to go with the usageElement that was drug 'n' dropped

					// Set the name of the usage container's ID
					var containerId = "#project_id_" + project_id + "_usage_container";
					if (isListPage) {
						containerId = containerId + "_form";
					}

					$container = $(containerId);
					if (($container.length > 0) && (typeof($container.attr("id")) != "undefined")) {
						// Make sure that only every other usageElement for this project_id is shaded
						$container.find(".usageElement").removeClass("shaded");
						$container.find(".usageElement:even").addClass("shaded");

						// Make sure that the related "Save Order" button and its containing div element exist
						var $orderDivs = $("#project_id_" + project_id + "_save_usage_order_div,#project_id_" + project_id + "_reset_usage_order_div");
						var $orderButtons = $("#project_id_" + project_id + "_save_usage_order_button,#project_id_" + project_id + "_reset_usage_order_button");
						if (($orderDivs.length > 0) && ($orderButtons.length > 0)) {
							var id = "#" + $container.attr("id");

							if (original_usage_id_order[id] != getCurrentUsageOrder(id)) {
								// The new order of the usages has changed, make the Save/Reset Order buttons visible
								// and enable them
								$orderDivs.css("visibility", "visible");
								$orderButtons.removeAttr("disabled");

								// Don't forget to make sure the jQueryUI look-and-feel is appropriate for the enabled buttons
								$orderButtons.button("enable");
							}
							else {
								// The 'new' order of the usages matches the order when the page was first loaded (or updated),
								// disable the Save/Reset Order buttons and remove any 'moved' shading changes from any
								// usages that had been moved

								$orderButtons.attr("disabled", true);

								var $usageElements = $(".topUsageContainer").find(".usageElement");
								$usageElements.removeClass("beingDragged");
								$usageElements.removeClass("gotDropped");

								// Don't forget to make sure the jQueryUI look-and-feel is appropriate for the disabled buttons
								$orderButtons.button("disable");
							}
						}
					}
				}
				else {
					// No project_id found to go with the usageElement that was drug 'n' dropped, go through every usageElement
					// in the entire page and make sure that only every other one is shaded
					$(".topUsageContainer").find(".usageElement").removeClass("shaded");
					$(".topUsageContainer").find(".usageElement:even").addClass("shaded");
				}
			}
		});
	}

	// Set the tooltip text to be displayed when the user hovers over a draggable element
	$(".sortableElement").tooltip({
		bodyHandler: function() {
			return "Click and drag tags to re-order them";
		}
		,showURL: false
	});
}

// This function sets the click() handler for the add/edit usage links on the page.  It is a stand-alone function because is needs to be
// re-invoked after usages get updated on the page for any reason (e.g. list being re-ordered)
handleUsageClick = function() {
	// Iterate through all of the usage links and set the click() handler for those that do not have one set up yet

	$(".ajaxUsageLink").each(function() {
		var elementEvents = $._data(this, "events");
		if ((!elementEvents) || (!elementEvents.click)) {
			// This link does not yet have a click() hander set up, set it up now

			$(this).click(function() {
				var linkId = $(this).attr("id");
				var usageURL = $(this).attr("href");

				if ((typeof(usageURL) != "undefined") && (typeof(linkId) != "linkId") && (linkId.match(/project_id_\d+/i))) {
					// The element clicked upon is indeed a link, and has an ID attribute that matches the desired
					// naming convention, continue

					// Make sure that the URL includes the variable 'suppresslayout'
					if (!usageURL.match(/\/suppresslayout/i)) {
						usageURL = usageURL + "/suppresslayout/true";
					}

					// Make sure that the URL includes the variable 'includelibraries'
					if (!usageURL.match(/\/includelibraries/i)) {
						usageURL = usageURL + "/includelibraries/false";
					}

					// Make sure that the URL includes the variable 'returnjson'
					if (!usageURL.match(/returnjson/i)) {
						usageURL = usageURL + "/returnjson/true";
					}

					if ((linkId.match(/_add_usage$/i)) || (linkId.match(/^edit_/i))) {
						// This is a call to either add or edit a usage, load the colorbox with the necessary form

						$("#colorbox").find("*").css("background-color", "#FFFFFF");
						$.colorbox({
							width: "70%"
							,href: usageURL
							,onComplete: function() {
								handleUsageSubmit(linkId.replace(/.*project_id_(\d+).*/i, "$1"));
							}
						});
					}
					else if (linkId.match(/^delete_/i)) {
						// This is a call to delete a usage, ask the user to confirm and then (if confirmed), open up a colorbox
						// and submit the delete request via AJAX

						if (confirm("Please Confirm That You Wish To Delete This Tag")) {
							// The user confirmed deleting this tag

							// Make sure usageURL has a necessary variable
							if (!usageURL.match(/\/submittype/i)) {
								usageURL = usageURL + "/submittype/confirmed";
							}

							// If this is being run on the project list page, add a "returnSimple" variable to the URL
							if (isListPage) {
								usageURL = usageURL + "/returnsimple/true";
							}

							// Open up a colorbox with a "Please Wait" message
							$("#colorbox").find("*").css("background-color", "#FFFFFF");
							$.colorbox({
								width: "60%"
								,html: "<strong>This Tag Is Being Deleted, Please Wait. . .</strong>"
							});

							// Make an AJAX call to delete the tag
							$.ajax({
								type: "get"
								,url: usageURL
								,dataType: "json"
								,success: function(data) {
									// Look at the data returned by the AJAX call to see if it was successful or not

									if ((typeof(data.success) == "boolean") && (typeof(data.message) != "undefined")) {
										// The JSON object returned was of the expected type, continue
										if (data.success) {
											// The usage was deleted successfully

											// Either deliver the returned message or a generic message (if no message was
											// returned) to the user
											var alertMessage = (data.message != "") ? data.message : "The tag has been deleted";
											alert(alertMessage);

											// Try to refresh the project's usage tree
											refreshUsageOrder(linkId.replace(/.*project_id_(\d+).*/i, "$1"));
										}
										else if (data.message != "") {
											// The tag was not deleted and a specific error message was returned */
											alert("Error deleting tag: " + data.message);
										}
										else {
											// The tag was not deleted, but no error message was returned
											alert("There was an unknown error deleting the tag, please try again soon");
										}
									}
									else {
										// The data returned was not of the expected format
										alert("There was an unknown error deleting the tag, please try again soon");
									}

									// Close the colorbox
									$.colorbox.close();
								}
								,error: function(response, ajaxOptions, thrownError) {
									// There was a problem deleting the usage, alert the user and close the colorbox
									alert("There was an unknown error saving the new order, please try again soon");
									$.colorbox.close();
								}
							});
						}
					}
				}

				// Return false to suppress actually going to the URL in the link clicked upon
				return false;
			});
		}
	});
}

// This function attempts to refresh a project's usage tag tree from the server
refreshUsageOrder = function(project_id) {
	var $container = $("#project_id_" + project_id + "_usage_container");
	if (($container.length > 0) && (typeof(refreshUsageOrderLink) != "undefined") && (refreshUsageOrderLink != "")) {
		// The tag container and the refresh tags link both exist, continue

		var usageURL = refreshUsageOrderLink;
		if (isListPage) {
			// This is being run on the project list page, add a Boolean "returnSimple" variable to the URL
			usageURL = usageURL + "/returnsimple/true";
		}
		else {
			// This is being run on the project's main "view" page, add a Boolean "includeDeleteUsageLink" variable to the URL
			usageURL = usageURL + "/includedeleteusagelink/true";
		}

		$.ajax({
			type: "get"
			,url: usageURL + "/project_id/" + escape(project_id)
			,dataType: "json"
			,success: function(data) {
				// Look at the data returned by the AJAX call to see if it was successful or not

				if ((typeof(data.success) == "boolean") && (data.success) && (typeof(data.newUsageHTML) != "undefined")) {
					// Update the HTML text for the usage tree
					$container.html(data.newUsageHTML);

					if (isListPage) {
						// This is being called from the project list page, manage the expand/shrink controller

						var $toggler = $("#toggle_usage_" + project_id);
						if ($toggler.length > 0) {
							if (data.newUsageHTML.length > 0) {
								// This project contains one or more usages, make sure the expand/shrink controller has a
								// plus or minus sign icon

								if ($toggler.hasClass("ui-icon-blank")) {
									$toggler.removeClass("ui-icon-blank");
								}

								if ((!$toggler.hasClass("ui-icon-plus")) && (!$toggler.hasClass("ui-icon-minus"))) {
									$toggler.addClass("ui-icon-plus");
									$toggler.attr("title", "Click the plus sign to see all the options");
								}

								// Make sure that the "Modify Tag Order" button is visible
								$("#project_id_" + project_id + "_modify_usage_order_div").show();
							}
							else {
								// This project contains no usages, make sure the expand/shrink controller is blank

								// If it has the class, remove the plus icon from the toggler
								if ($toggler.hasClass("ui-icon-plus")) {
									$toggler.removeClass("ui-icon-plus");
								}

								// If it has the class, remove the minus icon from the toggler
								if ($toggler.hasClass("ui-icon-minus")) {
									$toggler.removeClass("ui-icon-minus");
								}

								// If it does not have the class, add the blank icon to the toggler
								if (!$toggler.hasClass("ui-icon-blank")) {
									$toggler.addClass("ui-icon-blank");
								}

								// Make sure the toggler's title is empty and that the "Modify Tag Order" button is hidden
								$toggler.attr("title", "");
								$("#project_id_" + project_id + "_modify_usage_order_div").hide();
							}
						}
					}
					else {
						// This is being called from a page other than the project list, set further classes and handlers

						// Make sure every other line in the usage tree is shaded
						$container.find(".usageElement").removeClass("shaded");
						$container.find(".usageElement:even").addClass("shaded");

						// Update the "original" order of the usage_id value list
						if (typeof(original_usage_id_order) == "object") {
							makeOrderedUsageIdList(project_id);
						}

						if (data.newUsageHTML.length > 0) {
							// This project contains one or more usages, make sure the DIV containing the "No Tags" 
							// message is cleared
							$("#noUsages").html("");
						}
						else {
							// This project contains no usages, make sure the appropriate DIV contains that message
							$("#noUsages").html("This Project Has No Tags");
						}

						// re-set the drag 'n' drop sortability for the usage branch(es) that changed
						makeUsagesSortable();
					}

					// Set the click() handler for the add/edit usage links that don't have one yet
					handleUsageClick();
				}
			}
			,error: function(response, ajaxOptions, thrownError) {
				// There was a problem retrieving the usage order, do nothing for now
			}
		});
	}
}

// This function attempts to handle the click() on a "Save New Order" or "Reset Order" button
var handleSaveUsageOrderClick = function() {
	// Iterate through all of the usage save and reset order buttons and set the click() handler for those that do not have
	// one set up yet

	$(".saveUsageOrderButton,.resetUsageOrderButton").each(function() {
		var elementEvents = $._data(this, "events");
		if ((!elementEvents) || (!elementEvents.click)) {
			// This link does not yet have a click() hander set up, set it up now

			var $element = $(this);

			// Set the button look and feel, and disable it by default
			$element.button({
				disabled: true
			});

			// Set the click() handler for the Save Order button
			$element.click(function() {
				// First, get some of the particulars of the button that was clicked
				var $buttonClicked = $(this);
				var isSaveButton = $buttonClicked.hasClass("saveUsageOrderButton");
				var isResetButton = $buttonClicked.hasClass("resetUsageOrderButton");
				var buttonId = (typeof($buttonClicked.attr("id")) != "undefined") ? $buttonClicked.attr("id") : "";

				if (
					((isSaveButton) && (typeof(updateUsageOrderLink) != "undefined") && (buttonId.match(/^project_id_\d+_save_usage_order_button$/i)))
					|| ((isResetButton) && (buttonId.match(/^project_id_\d+_reset_usage_order_button$/i)))
				) {
					// One of the following conditions has been met:
					//		+ it is a save button
					//		+ the updateUsageOrderLink variable exists
					//		+ the button's ID matches the desired naming convention
					//	OR
					//		+ it is a reset button
					//		+ the button's ID matches the desired naming convention

					// Extract the project_id value from the button's ID
					var project_id = buttonId.replace(/^project_id_(\d+)_(reset|save)_usage_order_button$/, "$1");

					// Get the save/reset order divs and buttons for later use
					var $orderDivs = $("#project_id_" + project_id + "_save_usage_order_div,#project_id_" + project_id + "_reset_usage_order_div");
					var $orderButtons = $("#project_id_" + project_id + "_save_usage_order_button,#project_id_" + project_id + "_reset_usage_order_button");

					if (isSaveButton) {
						// This is a save button, try to submit the new order of usages to the server via AJAX

						var getFromId = "#project_id_" + project_id + "_usage_container";
						if (isListPage) {
							getFromId = getFromId + "_form";
						}

						var displayToId = "#project_id_" + project_id + "_usage_container";
						var $container = $(displayToId);

						new_usage_id_order = getCurrentUsageOrder(getFromId);
						if (new_usage_id_order != "") {
							// The usage container has been found, submit the new order of usages

							var usageURL = updateUsageOrderLink;

							// If the colorbox is open (i.e. on list page), close it and add a "returnSimple" variable to the URL
							if (isListPage) {
								$.colorbox.close();
								usageURL = usageURL + "/returnsimple/true";
							}

							// Submit the new order via AJAX
							$("#ajaxLoadingIcon").show();
							$.ajax({
								type: "get"
								,url: usageURL + "/project_id/" + escape(project_id) + "/usage_id/" + escape(new_usage_id_order)
								,dataType: "json"
								,success: function(data) {
									// Look at the data returned by the AJAX call to see if it was successful or not

									$("#ajaxLoadingIcon").hide();

									if ((typeof(data.success) == "boolean") && (typeof(data.errorMessage) != "undefined") && (typeof(data.newUsageHTML) != "undefined")) {
										if (data.success) {
											// The updated order was saved

											// Update the HTML text for the usage tree, flag this click as successful
											// and tell the user that the new order has been saved

											wasSuccessful = true;
											alert("The new tag order has been saved");
											$container.html(data.newUsageHTML);

											// Set the click() handler for the add/edit usage links that don't have one yet
											handleUsageClick();

											if (!isListPage) {
												// This was not done on the project list page

												if (($orderDivs.length > 0) && ($orderButtons.length)) {
													// Disable the Save/Reset Order buttons
													$orderButtons.attr("disabled", true);

													// Don't forget to make sure the jQueryUI look-and-feel is appropriate for the
													// disabled button
													$orderButtons.button("disable");

													// Make sure that only every other usage element line is shaded
													$container.find(".usageElement").removeClass("shaded");
													$container.find(".usageElement:even").addClass("shaded");
												}
											}
										}
										else if (data.errorMessage != "") {
											// The updated order was not saved and a specific error message was returned
											alert("Error saving the new order: " + data.errorMessage);
										}
										else {
											// The update order was not saved, but no error message was returned
											alert("There was an unknown error saving the new order, please try again soon");
										}
									}
									else {
										// The data returned was not of the expected format
										alert("There was an unknown error saving the new order, please try again soon");
									}
								}
								,error: function(response, ajaxOptions, thrownError) {
									// There was a problem updating the usage order
									$("#ajaxLoadingIcon").hide();
									alert("There was an unknown error saving the new order, please try again soon");
								}
							});
						}
					}
					else {
						// This is a reset button, try to roll back to the most-recently saved order of the usages

						var containerId = "#project_id_" + project_id + "_usage_container";
						if (isListPage) {
							containerId = containerId + "_form";
						}
						var $container = $(containerId);

						if (($container.length > 0) && (typeof(original_usage_html) == "object") && (typeof(original_usage_html[containerId]) != "undefined")) {
							// The usage container exists, as does the most-recently saved HTML text for the container,
							// replace the modified text with the original and flag this click as successful
							$container.html(original_usage_html[containerId]);

							// Set the click() handler for the add/edit usage links that don't have one yet
							handleUsageClick();

							if (($orderDivs.length > 0) && ($orderButtons.length > 0)) {
								// Disable the Save/Reset Order buttons
								$orderButtons.attr("disabled", true);

								// Don't forget to make sure the jQueryUI look-and-feel is appropriate for the disabled button
								$orderButtons.button("disable");

								// Make sure that only every other usage element line is shaded
								$container.find(".usageElement").removeClass("shaded");
								$container.find(".usageElement:even").addClass("shaded");
							}
						}
					}
				}

				// Re-make the usages in this list sortable
				makeUsagesSortable();
			});
		}
	});
}

// This function attempts to handle the click() on a "Modify Tag Order" buttons
var handleModifyUsageOrderClick = function() {
	// Iterate through all of the usage save and reset order buttons and set the click() handler for those that do not have
	// one set up yet

	$(".modifyUsageOrderButton").each(function() {
		var elementEvents = $._data(this, "events");
		if ((!elementEvents) || (!elementEvents.click)) {
			var $element = $(this);

			// First, set the look and feel of the button
			$element.button();

			// Now set the click() handler for the buttons
			$element.click(function(event) {
				event.preventDefault();

				var id = $(this).attr("id");
				if (
					(typeof(id) != "undefined") && (id.match(/project_id_\d+_modify_usage_order_button/i))
					&& (typeof(updateUsageOrderFormLink) != "undefined") && (updateUsageOrderFormLink != "")
				) {
					// The element clicked upon has an ID attribute that matches the desired naming convention and the
					// URL for the update usage order form exists and is not empty, continue

					// Get the project_id value from the ID
					var project_id = id.replace(/project_id_(\d+)_modify_usage_order_button/i, "$1");

					// Set the base URL (may be built upon with subsequent checks)
					var usageURL = updateUsageOrderFormLink;

					// Make sure that the URL includes the variable 'suppresslayout'
					if (!usageURL.match(/\/suppresslayout/i)) {
						usageURL = usageURL + "/suppresslayout/true";
					}

					// Make sure that the URL includes the variable 'includelibraries'
					if (!usageURL.match(/\/includelibraries/i)) {
						usageURL = usageURL + "/includelibraries/false";
					}

					// Make sure that the URL includes the variable 'returnjson'
					if (!usageURL.match(/returnjson/i)) {
						usageURL = usageURL + "/returnjson/true";
					}

					$.colorbox({
						width: "60%"
						,href: usageURL + "/project_id/" + escape(project_id)
						,onComplete: function() {
							// Make every other usageElement (on details page) shaded
							$(".topUsageContainer").find(".usageElement:even").addClass("shaded");

							if (typeof(original_usage_html) != "undefined") {
								var containerId = "#project_id_" + project_id + "_usage_container";
								if (isListPage) {
									containerId = containerId + "_form";
								}

								var $container = $(containerId);
								if ($container.length > 0) {
									original_usage_html[containerId] = $container.html();
								}
							}

							makeOrderedUsageIdList();
							makeUsagesSortable();
							handleSaveUsageOrderClick();
							handleUsageClick();
						}
					});
				}
			});
		}
	});
}

// This function gives the user the option to refresh the cached query and application-scope object for the big HERO-wide projects tag
// tree details
var showRefreshTagTree = function() {
	$("#refreshTagTreeDiv").show();
	/*
	if (typeof(refreshTagTreeLink) != "undefined") {
		if (confirm('Click "OK" If You Want To Refresh The In-Cache Tags Tree Object\n(This could take a long time)')) {
			window.open(refreshTagTreeLink, "RefreshTagTree");
		}
	}
	*/
}
