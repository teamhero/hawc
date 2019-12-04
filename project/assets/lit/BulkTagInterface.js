class BulkTagInterface {
	maxRefsPerBatch = 500;

	assessmentId = -1;
	pageNum = 0;
	pageSize = 50;
	sortOrder = "-year";
	referenceSelections = null;
	tagSelections = null;

	constructor(lit, assessmentId, tags) {
		this.assessmentId = assessmentId;
		this.referenceSelections = {
			ids: {},
			numberOfIds: 0
		};

		this.tagSelections = {
			ids: {},
			numberOfTags: 0
		};

		this.pageNum = 0;

		var hook = this;
		$("#listing_variety").change(function() {
			hook.pageNum = 0;
			hook.loadReferences();
		});

		var shortcutDiv = $("#shortcut_links");
		$("<a/>").html("Check All Boxes On This Page").appendTo(shortcutDiv).click(function() { hook.checkAllBoxes(true); });
		$("<span/>").html(" | ").appendTo(shortcutDiv);
		$("<a/>").html("Uncheck All Boxes On This Page").appendTo(shortcutDiv).click(function() { hook.checkAllBoxes(false); });
		$("<span/>").html(" | ").appendTo(shortcutDiv);
		$("<a/>").html("Clear All Selected References").appendTo(shortcutDiv).click(function() {
			if (hook.referenceSelections.numberOfIds > 0 && confirm('Are you sure you want to clear all selections?')) {
				$("input[type='checkbox']").each(function() {
					$(this).prop("checked", false);
					hook.referenceSelections.ids = {};
					hook.referenceSelections.numberOfIds = 0;
				});

				hook.updateTaglistTitle();
			}
		});

		// add tagtree widget
        window.tagtree = new lit.TagTree(tags);
        $('#taglist').html(window.tagtree.get_nested_list({"show_refs_count": false}))
            .on('hawc-tagClicked', function(e){
                var clickedTag = $(e.target);
                console.log("tag clicked");
                var tagId = clickedTag.parent("div").attr("data-id");
                  // $(e.target).addClass("selected");
                if (clickedTag.hasClass("selected")) {
                    clickedTag.removeClass("selected");
					hook.tagSelections.numberOfTags--;
					delete hook.tagSelections.ids[tagId];
                } else {
                    clickedTag.addClass("selected");
					hook.tagSelections.numberOfTags++;
					hook.tagSelections.ids[tagId] = true;
                }

				console.log(hook.tagSelections);
				hook.updateTaglistTitle();
            });

		$("#submitBtn").click(function() {
			hook.submitBulkOperation();
		});
 

		this.updateTaglistTitle();
	}

	commaDelim = function(obj) {
		var rv = "";
		for (var key in obj) {
			rv += (rv == "" ? "" : ",") + key;
		}
		return rv;
	}

	submitBulkOperation = function() {
		var numRefs = this.referenceSelections.numberOfIds;
		var numTags = this.tagSelections.numberOfTags;

		if (numRefs > 0 && numTags > 0) {
			console.log("go ahead...");
			$("#bulkTaggingForm #referenceIds").val(this.commaDelim(this.referenceSelections.ids));
			$("#bulkTaggingForm #tagIds").val(this.commaDelim(this.tagSelections.ids));

			$("#bulkTaggingForm").submit();
		} else {
			alert('You must select at least one reference and one tag to submit');
		}
	}

	showMaxWarning = function() {
		alert("You have selected the maximum of " + this.maxRefsPerBatch + " references.");
	}

	checkAllBoxes = function(doCheck) {
		var hook = this;
		var singleAlertShown = false;
		$("input[type='checkbox']").each(function() {
			if ($(this).prop("checked") != doCheck) {
				console.log("now at [" + hook.referenceSelections.numberOfIds + "]...");
				if (!doCheck || hook.referenceSelections.numberOfIds < hook.maxRefsPerBatch) {
					$(this).prop("checked", doCheck).trigger("change");
				} else {
					if (doCheck && !singleAlertShown) {
						setTimeout(function() {
							hook.showMaxWarning();
						}, 10);
						singleAlertShown = true;
					}
				}
			}
		});
	}

	setLoading = function(doClear) {
		if (doClear) {
			$("table#reference_list").empty();
		}
		this.setStatus("Loading...");
	}

	setStatus = function(s) {
		$("div#status_msg").html(s);
	}

	updateTaglistTitle = function() {
		var numRefs = this.referenceSelections.numberOfIds;
		var numTags = this.tagSelections.numberOfTags;
		var submitBtn = $("#submitBtn");
		submitBtn.html("Apply " + numTags + " selected tag" +
								(numTags == 1 ? "" : "s") +
								" to " + numRefs + 
								" reference" + (numRefs == 1 ? "" : "s") +
								" (maximum of " + this.maxRefsPerBatch + ")");

		submitBtn.parent("div.span3").css("width", "100%");

		if (numRefs > 0 && numTags > 0) {
			submitBtn.removeClass("disabled");
		} else {
			submitBtn.addClass("disabled");
		}
	};
	
	onCheckboxModified = function(checkbox) {
		var referenceId = checkbox.attr("data-referenceId");
		if (checkbox.prop("checked")) {
			if (this.referenceSelections.numberOfIds < this.maxRefsPerBatch) {
				console.log("checked [" + referenceId + "]");
				if (this.referenceSelections.ids[referenceId] === undefined) {
					this.referenceSelections.ids[referenceId] = true;
					this.referenceSelections.numberOfIds++;
				}
			} else {
				checkbox.prop("checked", false);
				this.showMaxWarning();
			}
		} else {
			console.log("deselected [" + referenceId + "]");
			if (this.referenceSelections.ids[referenceId] !== undefined) {
				delete this.referenceSelections.ids[referenceId];
				this.referenceSelections.numberOfIds--;
			}
		}

		console.log("NOW:");
		console.log(this.referenceSelections);
		this.updateTaglistTitle();
	}

	populateTable = function(data) {
		var hook = this;
		var startIdx = (this.pageNum * this.pageSize) + 1;
		var endIdx = startIdx + data.results.length - 1;
		var totalIdx = data.count;

		if (totalIdx == 0) {
			this.setStatus("No References Found");
		} else {
			this.setStatus("References " + startIdx + "-" + endIdx + " of " + totalIdx);
		}
		console.log(data);

		var tbl = $("table#reference_list");
		var headerRow = $("<tr/>").appendTo(tbl);
		var headers = [ "", "title", "authors", "year" ];
		var widths = [ 5, 60, 25, 10 ];

		var sortByHeader = function(header, prefix) {
			hook.sortOrder = (prefix === undefined ? "" : prefix) + header;
			hook.pageNum = 0;
			hook.loadReferences();
		};

		for (var i = 0 ; i < headers.length ; i++) {
			var header = headers[i];
			var th = $("<th/>").addClass("sort-header").attr("data-sortkey", header).html(header).appendTo(headerRow);
			th.css("width", widths[i] + "%");

			if (header == this.sortOrder) {
				th.addClass("sort-down");
				th.click(function() { sortByHeader($(this).attr("data-sortkey"), "-"); });
			} else if ("-" + header == this.sortOrder) {
				th.addClass("sort-up");
				th.click(function() { sortByHeader($(this).attr("data-sortkey")); });
			} else {
				th.click(function() { sortByHeader($(this).attr("data-sortkey")); });
			}
		}

		for (var i = 0 ; i < data.results.length ; i++) {
			var ref = data.results[i];
			var row = $("<tr/>").appendTo(tbl);
			var td = $("<td/>").appendTo(row);

			var cb = $("<input/>").attr("type", "checkbox").attr("data-referenceId", ref.id).appendTo(td).change(function() {
				hook.onCheckboxModified($(this));
			});

			if (this.referenceSelections.ids[ref.id] !== undefined) {
				cb.prop("checked", true);
			}

			$("<td/>").html(ref.title + " (" + ref.id + ")").appendTo(row);
			$("<td/>").html(ref.authors).appendTo(row);
			$("<td/>").html(ref.year).appendTo(row);
		}

		var paginationDiv = $("div#pagination_links").empty();
		if (data.previous != null) {
			$("<a/>").html("Previous").click(function() {
				hook.pageNum -= 1;
				hook.loadReferences();
			}).appendTo(paginationDiv);
		}

		if (data.next != null) {
			if (data.previous != null) {
				$("<span/>").html(" | ").appendTo(paginationDiv);
			}

			$("<a/>").html("Next").click(function() {
				hook.pageNum += 1;
				hook.loadReferences();
			}).appendTo(paginationDiv);
		}

	}

	loadReferences = function() {
		// http://localhost:8000/lit/api/reference/?assessment_id=483&limit=25&ordering=title&listing_variety=untagged_onlyx
		var testUrl = "/lit/api/reference/?assessment_id=" +
						this.assessmentId +
						"&limit=" + this.pageSize + 
						"&offset=" + (this.pageNum * this.pageSize) +
						"&listing_variety=" + $("#listing_variety").val();

		if (this.sortOrder != "") {
			testUrl += "&ordering=" + this.sortOrder;
		}
		console.log("test url is [" + testUrl + "]");

		this.setLoading(true);

		var hook = this;
		$.get(testUrl, function (data, success) {
			if (success) {
				hook.populateTable(data);
			} else {
				hook.setStatus("An error occurred.");
			}
		});
	}
};

export default BulkTagInterface;
