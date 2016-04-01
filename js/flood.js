// -------- START OF DECLARATION OF FUNCTIONS -----------------------//

// attach the back to top button to the scrolling of the window
$(function() {
	$(document).on('scroll', function() {
		if ($(window).scrollTop() > 50) {
			$('.scroll-top-wrapper').addClass('show');
		} else {
			$('.scroll-top-wrapper').removeClass('show');
		}
	});
	$('.scroll-top-wrapper').on('click', scrollToTop);
});

// count how many items are in the object
function countProperties(obj) {
	var count = 0;
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop)) { count++ };
	}
	return count;
}

// the workhorse which adds the data to the page
function create_page(k) {
	try {
		// define the number of decimal places accuracy
		var dp = 3;
		if (details[k]["units"] == "cm") {
			dp = 1;
		};
		
		// get the current date and time
		var current = moment();
		
		// check against environment agency max/min and process the data if necessary
		if (details[k]["maximum"] >= details[k]["ea maximum"]) {
			details[k]["ea max dates"] = details[k]["maximum dates"];
		}
		if (details[k]["minimum"] <= details[k]["ea minimum"]) {
			details[k]["ea min dates"] = details[k]["minimum dates"];
		}

		// sort the dates numerically (low to high)
		details[k]["maximum dates"] = details[k]["maximum dates"].sort(function(a, b) { return a - b });
		details[k]["minimum dates"] = details[k]["minimum dates"].sort(function(a, b) { return a - b });
		details[k]["ea max dates"] = details[k]["ea max dates"].sort(function(a, b) { return a - b });
		details[k]["ea min dates"] = details[k]["ea min dates"].sort(function(a, b) { return a - b });
		
		// get the date data in english
		var group_max_dates = languageDates(details[k]["maximum dates"]);
		var group_min_dates = languageDates(details[k]["minimum dates"]);
		var group_ea_min_dates = languageDates(details[k]["ea max dates"]);
		var group_ea_max_dates = languageDates(details[k]["ea min dates"]);

		// check if we need to qualify our results (because the environment
		// agency has better data than us
		var qualify = {};
		if (details[k]["ea minimum"] !== null && details[k]["minimum"] != details[k]["ea minimum"]) {
			if (group_ea_min_dates.length > 1) {
				qualify["minimum"] = "a minimum depth of " + details[k]["ea minimum"].toFixed(dp) + details[k]["units"] + " on " + group_ea_min_dates.slice(0, group_ea_min_dates.length - 1).join(', ') + " and " + group_ea_min_dates.slice(-1);
			} else {
				qualify["minimum"] = "a minimum depth of " + details[k]["ea minimum"].toFixed(dp) + details[k]["units"] + " on " + group_ea_min_dates[0];
			}
		}
		if (details[k]["ea maximum"] !== null && details[k]["maximum"] != details[k]["ea maximum"]) {
			if (group_ea_max_dates.length > 1) {
				qualify["maximum"] = "a maximum depth of " + details[k]["ea maximum"].toFixed(dp) + details[k]["units"] + " on " + group_ea_max_dates.slice(0, group_ea_max_dates.length - 1).join(', ') + " and " + group_ea_max_dates.slice(-1);
			} else {
				qualify["maximum"] = "a maximum depth of " + details[k]["ea maximum"].toFixed(dp) + details[k]["units"] + " on " + group_ea_max_dates[0];
			}
		}
		group_ea_max_dates = null;
		group_ea_max_dates = null;

		// today's value
		var todays_value = details[k]["pairs"][details[k]["latest date"]];
		// yesterday's value
		var yesterdays_value =  nearest( 1, details[k] );
		yesterdays_value[0] = yesterdays_value[0].toFixed(dp);
		var last_weeks_value = nearest( 7, details[k] )
		last_weeks_value[0] = last_weeks_value[0].toFixed(dp);

		// set the page title
		document.title = "Water levels for " + k;
		
		// define stuff to use in calculating the values on a certain day (eg 25 Dec or 07 Sep)
		var day_value = [];
		var day_value_range = {
			"max": null,
			"max_date": "0",
			"min": null,
			"min_date": "0"
		};
		// find out the values on a certain day (eg 25 Dec) and loop
		// through every year from the earliest date year
		var d = moment().startOf('day');
		for (y = parseInt(moment.unix(details[k]["earliest date"]).format("YYYY")); y <= current.year(); y++) {
			// change the year
			d.year(y);
			// get the unix epoch seconds for this date
			var e = d.unix();
			if (details[k]["daily values"].hasOwnProperty(e)) {
				// get all the data, find the max/min and when it occurred
				day_value = day_value.concat(details[k]["daily values"][e]);
				var maxv = Math.max.apply(null, details[k]["daily values"][e]).toFixed(dp);
				var minv = Math.min.apply(null, details[k]["daily values"][e]).toFixed(dp);
				if (day_value_range["max"] == null || (maxv >= day_value_range["max"] && e >= day_value_range["max_date"])) {
					day_value_range["max"] = maxv;
					day_value_range["max_date"] = e;
				}
				if (day_value_range["min"] == null || (minv <= day_value_range["min"] && e >= day_value_range["min_date"])) {
					day_value_range["min"] = minv;
					day_value_range["min_date"] = e;
				}
			};
		}

		// sort the readings numerically
		details[k]["readings"] = details[k]["readings"].sort(function(a, b) { return a - b });

		// determine the levels for the 5% and 95% percentiles
		var lower_percentile = parseFloat(percentile(details[k]["readings"], 0.05).toFixed(dp)),
				higher_percentile = parseFloat(percentile(details[k]["readings"], 0.95).toFixed(dp));

		// format the max and min to the required precision
		details[k]["maximum"] = parseFloat(details[k]["maximum"]).toFixed(dp);
		details[k]["minimum"] = parseFloat(details[k]["minimum"]).toFixed(dp);

		// determine whether the current level is within or outside the range
		var compared_level = (todays_value >= lower_percentile && todays_value <= higher_percentile) ? "within" : "outside";
		
		// get the current percentile for the current level
		var current_percentile = (100 * percentRank(details[k]["readings"], parseFloat(todays_value))).toFixed(0);
		// determine in english what the level is
		var thelevelis = whatisthelevel(current_percentile);
	} catch (e) { showError() };
	
	// set the marker showing whether the level is rising or not
	if (todays_value < yesterdays_value[0]) {
		$("#marker-rising").removeClass("danger default").addClass("warning");
		$("#marker-rising-text").html("Falling").removeClass("danger default").addClass("warning");
		$("#marker-rising-icon").removeClass("glyphicon-resize-horizontal glyphicon-arrow-up").addClass("glyphicon-arrow-down");
	} else if (todays_value > yesterdays_value[0]) {
		$("#marker-rising").removeClass("warning default").addClass("danger");
		$("#marker-rising-text").html("Rising").removeClass("warning default").addClass("danger");
		$("#marker-rising-icon").removeClass("glyphicon-resize-horizontal glyphicon-arrow-down").addClass("glyphicon-arrow-up");
	} else {
		$("#marker-rising").removeClass("danger warning").addClass("default");
		$("#marker-rising-text").html("Steady").removeClass("danger warning").addClass("default");
		$("#marker-rising-icon").removeClass("glyphicon-arrow-up glyphicon-arrow-down").addClass("glyphicon-resize-horizontal");
	}
	
	// draw the time graph
	try {
		$('#graph-time').highcharts('StockChart', {
			rangeSelector: {
				selected: 2,
				buttons: [{
					type: 'day',
					count: 1,
					text: '1d'
				}, {
					type: 'week',
					count: 1,
					text: '1w'
				}, {
					type: 'month',
					count: 1,
					text: '1m'
				}, {
					type: 'month',
					count: 3,
					text: '3m'
				}, {
					type: 'month',
					count: 6,
					text: '6m'
				}, {
					type: 'year',
					count: 1,
					text: '1y'
				}, {
					type: 'all',
					text: 'All'
				}]
			},
			xAxis: {
				ordinal: false
			},
			credits: {
				enabled: false
			},
			yAxis: {
				title: {
					text: 'Depth in ' + details[k]["units"]
				},
				min: details[k]["minimum"],
				max: details[k]["maximum"],
				opposite: false,
				plotLines: [{
					value: details[k]["minimum"],
					color: 'rgba(0, 128, 0, 0.5)',
					dashStyle: 'shortdash',
					width: 2,
					zIndex: 5,
					label: {
						text: 'Lowest recorded level (' + details[k]["minimum"] + details[k]["units"] + ')',
						style: {
							color: 'rgba(0, 128, 0, 0.75)'
						}
					}
				}, {
					value: details[k]["maximum"],
					color: 'rgba(0, 128, 0, 0.5)',
					dashStyle: 'shortdash',
					width: 2,
					zIndex: 5,
					label: {
						text: 'Highest recorded level (' + details[k]["maximum"] + details[k]["units"] + ')',
						style: {
							color: 'rgba(0, 128, 0, 0.75)'
						}
					}
				}, {
					value: lower_percentile,
					color: 'rgba(204, 204, 204, 1)',
					dashStyle: 'shortdash',
					width: 2
				}, {
					value: higher_percentile,
					color: 'rgba(204, 204, 204, 1)',
					dashStyle: 'shortdash',
					width: 2
				}],
				plotBands: [{
					from: lower_percentile,
					to: higher_percentile,
					color: 'rgba(221, 221, 221, 0.5)', //'rgba(153, 186, 221, 0.5)',
					label: {
						text: 'Usual range of ' + k,
						style: {
							color: 'rgba(204, 204, 204, 1)'
						},
					}
				}]
			},
			series: [{
				name: 'Recorded depth',
				data: get_graph_data(k),
				type: 'area',
				zIndex: 10,
				threshold: null,
				tooltip: {
					headerFormat: "<span style=\"color:{point.color}\">\u25CF</span> {point.x:%A, %B %e %Y at %H:%M}<br>",
					pointFormat: "Recorded depth: {point.y}",
					valueDecimals: 1,
					valueSuffix: details[k]["units"]
				},
				color: 'rgba(50, 118, 177,1)',
				fillColor: 'rgba(40, 94, 142,0.5)'
			}]
		});
	} catch (e) { $('#graph-time').html("<p>Sorry but we could not draw a chart for the data we had.</p>") };
	
	
	// lets now create the data for the distribution graph
	try {
		var dist_obj = {}
		// count how many times each reading exists
		for ( var i=0;i<details[k]["readings"].length;i++ ) {
			if ( dist_obj.hasOwnProperty(Math.round(details[k]["readings"][i])) ) {
				dist_obj[Math.round(details[k]["readings"][i])] += 1;
			} else {
				dist_obj[Math.round(details[k]["readings"][i])] = 1;
			}
		}
		// put the data in arrays for the x and y axes
		var dist_x = [], dist_y = [];
		for ( var i=parseInt(details[k]["minimum"]);i<=details[k]["maximum"];i++ ) {
			dist_x.push( i );
			if ( dist_obj.hasOwnProperty(i) ) {
				dist_y.push( dist_obj[i] );
			} else {
				dist_y.push( 0 );
			};
		}
		dist_obj = null;
		// finally lets draw the chart
		$('#graph-distribution').highcharts({
				chart: {
					type: 'areaspline'
				},
				legend: {
					enabled: false
				},
				xAxis: {
					categories: dist_x,
					title: {
						text: 'Depth measurement in ' + details[k]["units"]
					}
				},
				yAxis: {
					title: {
						text: "Number of times the measurement has been made"
					}
				},
				title: { text: null },
				tooltip: {
					formatter: function () {
						return 'A measurement of ' + this.x + details[k]["units"] + " ± 0.5" + details[k]["units"] + ' has been recorded ' + Number(this.y).toLocaleString('en') + ' times.';
					}
        },
				credits: {
					enabled: false
				},
				plotOptions: {
					areaspline: {
						fillOpacity: 0.5
					}
				},
				series: [{
					data: dist_y,
					color: 'rgba(50, 118, 177,1)',
					fillColor: 'rgba(40, 94, 142,0.5)'
				}]
		});
		// define the first recording date and number of readings
		$(".number-of-recordings").html( Number(details[k]["readings"].length).toLocaleString('en') );
		var first_recording_date = moment.unix(details[k]["earliest date"]).format("Do MMMM YYYY");
		$(".first-recording-date").html( first_recording_date );
	} catch (e) { $('#graph-distribution').html("<p>Sorry but we could not draw a chart for the data we had.</p>") };
	
	// set where the data is for, the current level and when it was taken
	$(".river-location").html(k + details[k]["type"]);
	$(".current-depth").html(todays_value + details[k]["units"]);
	try { $("#last-updated").html("Last updated: about " + moment().to(moment.unix(details[k]["latest date"])) + " ("+moment.unix(details[k]["latest date"]).calendar(moment(), { sameElse: 'Do MMMM YYYY [at] HH:mm' })+")").show(); }
	catch (e) { $("#last-updated").hide(); }

	// assign the marker for the level and how high it is
	// the blue line in the icon is the percentile
	$("#marker-level").css({
		"background": "#FFF",
		"background": "-moz-linear-gradient(090deg, rgba(50,118,177,1) " + current_percentile + "%, rgba(255,255,255,1) " + current_percentile + "%)",
		"background": "-webkit-gradient(linear, left top, left bottom, color-stop(" + current_percentile + "%, rgba(255,255,255,1)), color-stop(" + current_percentile + "%, rgba(50,118,177,1)))",
		"background": "-webkit-linear-gradient(090deg, rgba(50,118,177,1) " + current_percentile + "%, rgba(255,255,255,1) " + current_percentile + "%)",
		"background": "-o-linear-gradient(090deg, rgba(50,118,177,1) " + current_percentile + "%, rgba(255,255,255,1) " + current_percentile + "%)",
		"background": "-ms-linear-gradient(090deg, rgba(50,118,177,1) " + current_percentile + "%, rgba(255,255,255,1) " + current_percentile + "%)",
		"background": "linear-gradient(0deg, rgba(50,118,177,1) " + current_percentile + "%, rgba(255,255,255,1) " + current_percentile + "%)",
		"filter": "progid:DXImageTransform.Microsoft.gradient( startColorstr='#FFFFFF', endColorstr='#3276B1',GradientType=0 )"
	});
	$("#marker-level-text").html(thelevelis[0]);
	
	// do the facts about panel
	$("#current-depth-percentile-rank").html(current_percentile);
	$("#current-depth-minimum").html(lower_percentile + details[k]["units"]);
	$("#current-depth-maximum").html(higher_percentile + details[k]["units"]);
	try { $("#current-depth-most-common").html(parseFloat(mode(details[k]["readings"])).toFixed(dp) + details[k]["units"]).show(); }
	catch (e) { $("#current-depth-most-common").closest("tr").hide(); }
	
	// assign the paragraph of text
	try {
			var desc = "The water level is currently " + todays_value + details[k]["units"] + ".  This is " + compared_level + " the usual range" + thelevelis[1][compared_level] + "; the level " + raised(yesterdays_value[0], todays_value, details[k]["units"], dp) + " "+yesterdays_value[2]+" and " + raised(last_weeks_value[0], todays_value, details[k]["units"], dp) + " "+last_weeks_value[2]+".";
			// if this data is more than a day old
			if ( parseInt(moment().unix())-parseInt(details[k]["latest date"]) > 86400 ) {
				desc = desc.replace(/\ currently /g," ").replace(/\ is\ /g," was ").replace(/\ has\ /g," had ").replace(/\ yesterday\ /g," the previous day ");
			}
			$("#level-description").html(desc).show();
	} catch (e) { $("#para1").hide(); }

	// do the what is the usual depth panel
	$("#day-average-date").html(current.format("Do MMMM"));
	if (day_value_range["max"] !== null && day_value_range["min"] !== null) {
		try { $("#day-average").html(mean(day_value).toFixed(dp) + details[k]["units"] + " ± " + standardDeviation(day_value).toFixed(dp) + details[k]["units"]).show(); }
		catch (e) { $("#day-average-no-data").closest("tr").hide(); };
		$("#day-average-high").html(day_value_range["max"] + details[k]["units"] + " in " + moment.unix(day_value_range["max_date"]).format("YYYY"));
		$("#day-average-low").html(day_value_range["min"] + details[k]["units"] + " in " + moment.unix(day_value_range["min_date"]).format("YYYY"));
		$("#day-average-no-data").hide();
		$(".average-hide").show();
	} else {
		$("#day-average-no-data").show();
		$(".average-hide").hide();
	}

	// do the records panel
	$("#highest-ever").html(details[k]["maximum"] + details[k]["units"]);
	if (group_max_dates.length > 1) {
		$("#highest-ever-date").html(group_max_dates.slice(0, group_max_dates.length - 1).join(', ') + " and " + group_max_dates.slice(-1));
	} else {
		$("#highest-ever-date").html(group_max_dates);
	}
	$("#lowest-ever").html(details[k]["minimum"] + details[k]["units"]);
	if (group_min_dates.length > 1) {
		$("#lowest-ever-date").html(group_min_dates.slice(0, group_min_dates.length - 1).join(', ') + " and " + group_min_dates.slice(-1));
	} else {
		$("#lowest-ever-date").html(group_min_dates);
	}
	
	// qualify our data if necessary
	var message = "Note: we only began recording <span id=\"start-date\">recently</span>, different depths may have been recorded before then.";
	if ( countProperties(qualify) > 0 ) { message += "  The Environment Agency records " };
	if (qualify.hasOwnProperty("minimum")) { message += qualify["minimum"]; };
	if (qualify.hasOwnProperty("minimum") && qualify.hasOwnProperty("maximum")) { message += " and " };
	if (qualify.hasOwnProperty("maximum")) { message += qualify["maximum"]; };
	if (qualify.hasOwnProperty("minimum") || qualify.hasOwnProperty("maximum")) { message += " for "+k + details[k]["type"]+"." };
	$("#environment-agency-message").html("<span class=\"text-muted\">"+message+"</span>");
	try { $("#start-date").html("on "+first_recording_date); }
	catch (e) { }; // do nothing
}

// function to return an array with no duplicates
function deduplicate( arr ) {
	var uniques = [];
	$.each(arr, function(i, el){
		if($.inArray(el, uniques) === -1) uniques.push(el);
	});
	return uniques;
}

// used by highcharts to fetch the data
function get_graph_data(arr_name) {
	var g = [];
	for (var key in details[arr_name]["pairs"]) {
		if (details[arr_name]["pairs"].hasOwnProperty(key)) {
			g.push([
				new Date(key * 1000.0).getTime(),
				parseFloat(details[arr_name]["pairs"][key])
			]);
		}
	};
	return g;
}

// check the value is an integer
function isInt(n) {
	return Number(n) === n && n % 1 === 0;
	}

// check the value is a float
function isFloat(n) {
	return Number(n) === n && n % 1 !== 0;
}

// return an array of dates in the format Do MMMM YYYY
function languageDates(arr) {
	var lang_arr = [];
	for (i = 0; i < arr.length; i++) {
		lang_arr.push( moment.unix(arr[i]).format("Do MMMM YYYY") );
	}
	return lang_arr;
}

// returns the mean of the values
function mean(data) {
	var sum = data.reduce(function(sum, value) {
		return sum + value;
	}, 0);

	var avg = sum / data.length;
	return avg;
}

// returns the mode of the values
// ie the most common reading
function mode(ary) {
	var counter = {};
	var mode = [];
	var max = 0;
	for (var i in ary) {
		if (!(ary[i] in counter))
			counter[ary[i]] = 0;
		counter[ary[i]] ++;

		if (counter[ary[i]] == max)
			mode.push(ary[i]);
		else if (counter[ary[i]] > max) {
			max = counter[ary[i]];
			mode = [ary[i]];
		}
	}
	return mode;
}

// find the nearest number in the object
function nearest( noofdays, obj, dp ) {
	var found = 0,
			previous = 0,
			diff = 86400*parseInt(noofdays);
	for (var i in obj["pairs"]) {
		found = i;
		if ( ( parseInt(i) + diff ) >= obj["latest date"] ) { found = previous; break }
		previous = found;
	}
	previous = Math.round(parseInt(moment.unix(obj["latest date"]).startOf("day")-moment.unix(found).startOf("day"))/86400000);
	if ( previous == 1 ) { previous = "yesterday" }
	else if ( previous > 1 && previous < 7 ) { previous = "last "+moment().startOf("day").subtract(previous,"days").format("dddd"); }
	else if ( previous == 7 ) { previous = "a week ago" } 
	else { previous = previous.toFixed(0)+" days ago" };
	return [ mean(obj["daily values"][moment.unix(found).startOf('day').unix()]), found, previous ];
}

// Returns the value at a given percentile in a sorted numeric array.
// "Linear interpolation between closest ranks" method
// https://gist.github.com/IceCreamYou/6ffa1b18c4c8f6aeaad2
function percentile(arr, p) {
		if (arr.length === 0) return 0;
		if (typeof p !== 'number') throw new TypeError('p must be a number');
		if (p <= 0) return arr[0];
		if (p >= 1) return arr[arr.length - 1];

		var index = arr.length * p,
			lower = Math.floor(index),
			upper = lower + 1,
			weight = index % 1;

		if (upper >= arr.length) return arr[lower];
		return arr[lower] * (1 - weight) + arr[upper] * weight;
	}

// Returns the percentile of the given value in a sorted numeric array.
// https://gist.github.com/IceCreamYou/6ffa1b18c4c8f6aeaad2
function percentRank(arr, v) {
	if (typeof v !== 'number') throw new TypeError('v must be a number');
	for (var i = 0, l = arr.length; i < l; i++) {
		if (v <= arr[i]) {
			while (i < l && v === arr[i]) i++;
			if (i === 0) return 0;
			if (v !== arr[i - 1]) {
				i += (v - arr[i - 1]) / (arr[i] - arr[i - 1]);
			}
			return i / l;
		}
	}
	return 1;
}

// function that processes the flood warnings and prints them to screen
function processFloodData(k, data) {
	try {
		if ( typeof data["items"] !== "undefined" ) {
			data["items"] = data["items"].sort(function(a,b) {
				// sort by the severity level of the alert
				if (a.severityLevel > b.severityLevel) {
        return 1;
				} else if (a.severityLevel < b.severityLevel) { 
						return -1;
				}

				// sort by the time the message changed (descending)
				if (a.timeMessageChanged > b.timeMessageChanged) { 
						return -1;
				} else if (a.timeMessageChanged < b.timeMessageChanged) {
						return 1
				} else { // nothing to split them
						return 0;
				}
			});
			if (data["items"].length > 0) {
				for (i = 0; i < data["items"].length; i++) {
					if (data["items"][i]["severityLevel"] < details[k]["warning"]) {
						details[k]["warning"] = data["items"][i]["severityLevel"]
					};
					var img = "";
					if (data["items"][i]["severityLevel"] >= 1 && data["items"][i]["severityLevel"] <= 3) {
						img = "<img class=\"pull-left\" src=\"images/flood/" + data["items"][i]["severityLevel"] + ".jpg\" title=\"" + data["items"][i]["severity"] + "\" />";
						if ( data["items"][i]["severityLevel"] == 2 ) { layer_group = 1 }
						else if ( data["items"][i]["severityLevel"] == 1 ) { layer_group = 0 }
						else { layer_group = 2 }
					}
					var msg = ""
					msg += "<p>" + img + "<strong>" + data["items"][i]["severity"] + ": " + data["items"][i]["description"] + "&nbsp;<a href=\"http://apps.environment-agency.gov.uk/flood/34681.aspx?area="+data["items"][i]["floodAreaID"]+"\" target=\"_blank\" data-toggle=\"tooltip\" data-placement=\"below\" title=\"Map of the area effected\"><span class=\"glyphicon glyphicon-map-marker\"></span></a></strong><br><span class=\"text-muted\">Last updated: " + moment(data["items"][i]["timeMessageChanged"]).format("Do MMMM YYYY [at] HH:mm") + "</span>";
					if ( typeof data["items"][i]["message"] !== "undefined" ) { msg += "<br>" + data["items"][i]["message"] + "</p>"; };
					details[k]["warning messages"].push( msg );
				}
			}
		}
	} catch (e) { showError() };
}

// a function that converts the CSV data into an object we can
// use easier
function processRiverData(k, data) {
	try {
		// set the multiplier, precision and split the data by new lines
		var multiplier = 1,
				dp = 3,
				first_line = null,
				lines = data.split("|");

		// correct the multiplier and precision
		if (details[k]["units"] == "cm") {
			multiplier = 100;
			dp = 1;
		};
		// loop through all the lines
		for (var l = 0; l < lines.length; l++) {
			// split the lines by comma as they are csv
			var this_line = lines[l].split(",");
			// make the the first value is a integer and the second a float
			if ( first_line === null ) { 
				this_line[0] = parseInt(100*parseFloat(this_line[0]));
				first_line = parseFloat(this_line[0]/100); 
			} else {
				this_line[0] = parseInt(100*parseFloat(parseFloat(this_line[0])+parseFloat(first_line)));
			}
			this_line[1] = parseFloat(multiplier * this_line[1] / 1000);
			
			// check the types
			if (isInt(this_line[0]) && (isFloat(this_line[1]) || isInt(this_line[1]))) {
				// check the earliest and latest dates
				if (details[k]["earliest date"] == null || this_line[0] < details[k]["earliest date"]) {
					details[k]["earliest date"] = this_line[0]
				};
				if (details[k]["latest date"] == null || this_line[0] > details[k]["latest date"]) {
					details[k]["latest date"] = this_line[0]
				};
				// compile the "pairs" dictionary
				details[k]["pairs"][this_line[0]] = this_line[1].toFixed(dp);
				// add the value to the readings array
				details[k]["readings"].push(this_line[1]);
				// make the daily array
				var daily_time = moment.unix(this_line[0]).startOf("day").unix();
				if (typeof details[k]["daily values"][daily_time] == "undefined") {
					details[k]["daily values"][daily_time] = []
				};
				details[k]["daily values"][daily_time].push(this_line[1]);

				// check for max and min
				if (details[k]["maximum"] == null) {
					details[k]["maximum"] = this_line[1]
				};
				if (this_line[1] > details[k]["maximum"]) {
					details[k]["maximum"] = this_line[1];
					details[k]["maximum dates"] = [];
					details[k]["maximum dates"].push(moment.unix(this_line[0]).startOf("day").unix());
				} else if (this_line[1] == details[k]["maximum"]) {
					details[k]["maximum dates"].push(moment.unix(this_line[0]).startOf("day").unix());
				};
				if (details[k]["minimum"] == null) {
					details[k]["minimum"] = this_line[1]
				};
				if (this_line[1] < details[k]["minimum"]) {
					details[k]["minimum"] = this_line[1];
					details[k]["minimum dates"] = [];
					details[k]["minimum dates"].push(moment.unix(this_line[0]).startOf("day").unix());
				} else if (this_line[1] == details[k]["minimum"]) {
					details[k]["minimum dates"].push(moment.unix(this_line[0]).startOf("day").unix());
				};
			};
		}
		// make sure we only have different dates in the arrays
		details[k]["maximum dates"] = deduplicate(details[k]["maximum dates"]);
		details[k]["minimum dates"] = deduplicate(details[k]["minimum dates"]);
	} catch (e) { showError() };
}

// function used to return a phrase regarding rise/fall/same
function raised(n, o, u, d) {
	n = parseFloat(n);
	o = parseFloat(o);
	if (n > o) {
		return "has fallen " + (n - o).toFixed(d) + u + " since"
	} else if (n < o) {
		return "has risen " + (o - n).toFixed(d) + u + " since"
	} else {
		return "is the same as"
	};
}

// function that provides the scroll to top button
function scrollToTop() {
	verticalOffset = typeof(verticalOffset) != 'undefined' ? verticalOffset : 0;
	element = $('body');
	offset = element.offset();
	offsetTop = offset.top;
	$('html, body').animate({
		scrollTop: offsetTop
	}, 500, 'linear');
}

// display the flood warnings
function showFloodWarnings(k) {
	// that is all the calculations done, now let's do some styling
	// do the warning box, there are 4 possible flood warning levels plus a few for errors
	$("#alert-box-message-text").html(details[k]["warning messages"].join(""));
	if (details[k]["warning"] == 4) {
		$("#marker-warning").removeClass("warning danger default").addClass("info");
		$("#marker-warning-text").html("The warning is no longer in force").removeClass("warning danger default").addClass("info");
		$("#marker-warning-icon").removeClass("glyphicon-alert").addClass("glyphicon-thumbs-up");
		$("#alert-box-message-title").html("The warning is no longer in force");
		$("#alert-box-message").removeClass("panel-warning-bold panel-danger-bold panel-default").addClass("panel-info").show();
	} else if (details[k]["warning"] == 3) {
		$("#marker-warning").removeClass("info danger default").addClass("warning");
		$("#marker-warning-text").html("Flood Alert:	Flooding is possible, be prepared").removeClass("info danger default").addClass("warning");
		$("#marker-warning-icon").removeClass("glyphicon-thumbs-up").addClass("glyphicon-alert");
		$("#alert-box-message-title").html("Flood Alert:	Flooding is possible, be prepared");
		$("#alert-box-message").removeClass("panel-info panel-danger-bold panel-default").addClass("panel-warning-bold").show();
	} else if (details[k]["warning"] == 2) {
		$("#marker-warning").removeClass("warning info default").addClass("danger");
		$("#marker-warning-text").html("Flood Warning:	Flooding is expected, immediate action is required").removeClass("warning info default").addClass("danger");
		$("#marker-warning-icon").removeClass("glyphicon-thumbs-up").addClass("glyphicon-alert");
		$("#alert-box-message-title").html("Flood Warning:	Flooding is expected, immediate action is required");
		$("#alert-box-message").removeClass("panel-warning-bold panel-info panel-default").addClass("panel-danger-bold").show();
	} else if (details[k]["warning"] == 1) {
		$("#marker-warning").removeClass("warning info default").addClass("danger");
		$("#marker-warning-text").html("Severe Flood Warning:	Severe flooding, danger to life").removeClass("warning info default").addClass("danger");
		$("#marker-warning-icon").removeClass("glyphicon-thumbs-up").addClass("glyphicon-alert");
		$("#alert-box-message-title").html("Severe Flood Warning:	Severe flooding, danger to life");
		$("#alert-box-message").removeClass("panel-warning-bold panel-info panel-default").addClass("panel-danger-bold").show();
	} else if (details[k]["warning"] == 100) {
		$("#marker-warning").removeClass("info danger default").addClass("warning");
		$("#marker-warning-text").html("Error collecting flood warning data").removeClass("info danger default").addClass("warning");
		$("#marker-warning-icon").removeClass("glyphicon-thumbs-up").addClass("glyphicon-alert");
		$("#alert-box-message-title").html("Error collecting data the flood warning data");
		$("#alert-box-message-text").append("<p>There was an error collecting the flood warning data.  This means our data may be out of date or incorrect.  Please refresh this page or try again later if the problem persists.</p><p>Click <a href=\"https://flood-warning-information.service.gov.uk/\" title=\"Environment Agency Flood Warnings\">here</a> to view the latest flood warnings on the Environment Agency website.</p>");
		$("#alert-box-message").removeClass("panel-info panel-danger-bold panel-default").addClass("panel-warning-bold").show();
	} else {
		$("#marker-warning").removeClass("warning danger info").addClass("default");
		$("#marker-warning-text").html("There are no flood warnings in place for the " + k + " area").removeClass("warning danger info").addClass("default");
		$("#marker-warning-icon").removeClass("glyphicon-alert").addClass("glyphicon-thumbs-up");
		$("#alert-box-message-title").html("Nothing to see here, move along");
		$("#alert-box-message-text").append("Nothing to see here, move along.");
		$("#alert-box-message").removeClass("panel-warning-bold panel-danger-bold panel-info").addClass("panel-default").hide();
	}
};

// show an error message
function showError() {
	$("#error-title").html("Error").show();
	$("#error-text").html("<p>Well, that wasn't supposed to happen!</p><p>There has been an error collecting the data for the stations.  Please try again or later if you keep getting this message.</p>").show();
	$("#error-messages").show();
	$(".nav").hide();
	$("#river-data").hide();
	// stop the timers
	clearTimeout(apology);
	clearTimeout(dots);
}

// function to calculate the standard deviation of an array of numbers
function standardDeviation(values) {
	var avg = mean(values);

	var squareDiffs = values.map(function(value) {
		var diff = value - avg;
		var sqrDiff = diff * diff;
		return sqrDiff;
	});

	var avgSquareDiff = mean(squareDiffs);

	var stdDev = Math.sqrt(avgSquareDiff);
	return stdDev;
}

// returns an array with various strings depending on the level
function whatisthelevel(p) {
	if (p == 0) {
		return ["Extremely low", {
			"outside": " and extremely low",
			"within": " and extremely low"
		}]
	} else if (p > 0 && p <= 20) {
		return ["Very low", {
			"outside": " and very low",
			"within": " but very low"
		}]
	} else if (p > 20 && p <= 40) {
		return ["Low", {
			"outside": " and low",
			"within": " but low"
		}]
	} else if (p > 40 && p <= 60) {
		return ["Average", {
			"outside": " but as expected",
			"within": " and as expected"
		}]
	} else if (p > 60 && p <= 80) {
		return ["High", {
			"outside": " and high",
			"within": " but high"
		}]
	} else if (p > 80 && p < 100) {
		return ["Very high", {
			"outside": " and very high",
			"within": " but very high"
		}]
	} else if (p == 100) {
		return ["Extremely high", {
			"outside": " and extremely high",
			"within": " and extremely high"
		}]
	} else {
		return ["Unknown", {
			"outside": "",
			"within": ""
		}]
	}
}

// returns currently if the reading was recent
function whenwasthereading(key) {
	return (parseInt(moment().unix())-parseInt(details[key]["latest date"]) <= 10800 ) ? [ "is currently ", "is " ] : [ "was ", "was " ];
}

// -------- END OF DECLARATION OF FUNCTIONS --------------------------//

// -------- GLOBAL VARIABLES -----------------------------------------//

// define an object to hold the details discovered
// this is based on details found here:
// https://environment.data.gov.uk/flood-monitoring/id/stations/{id}
var details = {
	"Chitterne Brook": {
		"id": 43117,
		"type": " (The Cut)",
		"units": "cm",
		"readings": [],
		"pairs": {},
		"daily values": {},
		"maximum": null,
		"maximum dates": [],
		"minimum": null,
		"minimum dates": [],
		"longitude": -2.043272,
		"latitude": 51.160588,
		"ea maximum": 134.6,
		"ea max dates": [1389235500],
		"ea minimum": 0,
		"ea min dates": [782703000],
		"warning": 99,
		"warning messages": [],
		"earliest date": null,
		"latest date": null
	},
	"Chitterne Down": {
		"id": 43171,
		"type": " (Groundwater)",
		"units": "m",
		"readings": [],
		"pairs": {},
		"daily values": {},
		"maximum": null,
		"maximum dates": [],
		"minimum": null,
		"minimum dates": [],
		"longitude": -1.9727647,
		"latitude": 51.186216,
		"ea maximum": null,
		"ea max dates": [],
		"ea minimum": null,
		"ea min dates": [],
		"warning": 99,
		"warning messages": [],
		"earliest date": null,
		"latest date": null
	},
	"Norton Bavant": {
		"id": 43112,
		"type": "",
		"units": "cm",
		"readings": [],
		"pairs": {},
		"daily values": {},
		"maximum": null,
		"maximum dates": [],
		"minimum": null,
		"minimum dates": [],
		"longitude": -2.132143,
		"latitude": 51.1839,
		"ea maximum": 72.3,
		"ea max dates": [1388885400],
		"ea minimum": 4.9,
		"ea min dates": [904590900],
		"warning": 99,
		"warning messages": [],
		"earliest date": null,
		"latest date": null
	},
	"Orcheston": {
		"id": 43122,
		"type": " (Groundwater)",
		"units": "m",
		"readings": [],
		"pairs": {},
		"daily values": {},
		"maximum": null,
		"maximum dates": [],
		"minimum": null,
		"minimum dates": [],
		"longitude": -1.958392,
		"latitude": 51.202428,
		"ea maximum": null,
		"ea max dates": [],
		"ea minimum": null,
		"ea min dates": [],
		"warning": 99,
		"warning messages": [],
		"earliest date": null,
		"latest date": null
	}
};

// -------- END OF GLOBAL VARIABLES ----------------------------------//

// define a message to indicate progress
$( document ).ajaxSend(function( event, request, settings ) {
  if ( typeof settings.message !== "undefined" ) {
		$( "#error-text" ).append( "<span>"+settings.message+"</span>" );
	};
});

// add timers
var dots = window.setInterval( function() { $( "#error-title, #error-text span:last" ).append( "." ); }, 750),
		apology = window.setInterval( function() { 
			$( "#error-title" ).html( $( "#error-title" ).html().replace( /\.{1,}/g, "." ) );
			$( "#error-text" ).html( $( "#error-text" ).html().replace( /\.{1,}/g, "." ) );
			$( "#error-text" ).append( "<br><span>This is taking longer than expected, please hold or try again later.  We are still working on getting the data for you.</span>" ); 
		}, 10000);


// -------- WHERE THE FUN BEGINS -------------------------------------//
$(document).ready(function() {
	// add all the tooltips
	$('[data-toggle="tooltip"]').tooltip();
	// what to do when a tab is clicked
	$('.nav-tabs a').click(function(e) {
		e.preventDefault();
		create_page( $(e.target).text() );
	})
	// hide all the tabs, we will show them when we have data on them
	$(".nav-tabs li").hide();
	
	// start a leaflet map object
	var mymap = L.map('map').setView([51.1858, -2.01874], 12);
	mymap.scrollWheelZoom.disable();
	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
		maxZoom: 18,
		id: 'cmharper.peo9a1fg',
		accessToken: 'pk.eyJ1IjoiY21oYXJwZXIiLCJhIjoiY2lseXM4bWIxMDBoNHVvbTQyaWxybmkzdiJ9.dUIGzsKI6FbWnAd8dsAdcQ'
	}).addTo(mymap);

	// initialise an array to hold the markers on the map
	var marker = [];

	// loop through all the items in the object and get the flood warnings
	// these are on google to avoid CORS
	for (var k in details) {
		if (details.hasOwnProperty(k)) {
			// define the url
			var myurl = "https://script.google.com/macros/s/AKfycbwOUxqNA-rvJ-qbh1wH-sVo7Y9HDQlEDsySXWAAAXozI5guZzI/exec";
			//var myurl = "fail";
			// start getting the flood warnings in the background
			$.ajax({ 
					url: myurl,
					type: "POST",
					dataType: "json",
					location: k,
					data: { 
						url: details[k]['id'],
						latitude: details[k]['latitude'],
						longitude: details[k]['longitude']
					},
					message: "<br>Fetching flood warnings for " + k +"."
			})
			.fail(function() {
				// show the error message
				details[this.location]["warning"] = 100;
				if ( this.location == $("ul.nav-tabs li.active").text() ) {
					showFloodWarnings($("ul.nav-tabs li.active").text());
				};
			})
			// always do this when we have downloaded the data
			.always(function(a, success) {
				// don't fail on error just show the user a warning
				if (success == "error") {
					details[this.location]["warning"] = 100;
				} else {
					// process the data if it is defined
					if ( typeof a !== "undefined" ) { 
						$.when(processFloodData(this.location, a));
					};
					if ( this.location == $("ul.nav-tabs li.active").text() ) {
						showFloodWarnings($("ul.nav-tabs li.active").text());
					};
				}
			});
		};
	};
	
	// lets try to get the data for the first tab if we don't 
	// have an error
	if ($("#error-title").text() !== "Error") {
		// the place name on the first tab is
		var this_location = $(".nav-tabs a:first").text();
		if (! details.hasOwnProperty(this_location)) {
			showError();
		} else {
			// get this information in the background
			$.ajax({ 
					url: "https://script.google.com/macros/s/AKfycbzlhe1LMeAOCyNbl7Pn_EFg7y3W-5lZJFZT53M8nvjuw7HERcy5/exec",
					type: "POST",
					dataType: "json",
					location: this_location,
					data: { 
						place: encodeURIComponent(this_location)
					},
					message: "<br>Fetching the water level data for "+this_location+"."
			})
			// show an error message if we haven't got this data
			.fail( function() {
				showError();
			})
			// otherwise always do this
			.always(function(a, success) {
				try {
					// show a progress message and process the data
					$( "#error-text span:last" ).append( "<br>Processing the data for "+this.location );
					processRiverData(this.location, a[this.location]);
					// add a marker to the map
					marker[this.location] = L.marker([details[this.location]['latitude'], details[this.location]['longitude']]).addTo(mymap).bindPopup("<b>"+this.location + details[this.location]["type"]+"</b><br>Current depth: "+details[this.location]["pairs"][details[this.location]["latest date"]]+details[this.location]["units"]);
					// show the first tab
					create_page(this.location);
					// set a timer to update the last updated time
					var last_updated_time = window.setInterval( function() { 
						try { $("#last-updated").html("Last updated: about " + moment().to(moment.unix(details[$("ul.nav-tabs li.active").text()]["latest date"])) + " ("+moment.unix(details[$("ul.nav-tabs li.active").text()]["latest date"]).calendar(moment(), { sameElse: 'Do MMMM YYYY [at] HH:mm' })+")").show(); }
						catch (e) { $("#last-updated").hide(); }
					}, 60000);
					// make everything visible
					$("#error-messages").hide();
					$(".nav-tabs li:first").show();
					$(".nav").show();
					$("#river-data").show();
					// re-size the map
					mymap.invalidateSize();
					
					// now let's get the data for the other locations/tabs
					var tab_data_counter = 1;
					$(".nav-tabs a").each( function(n) {
						// skip the first one as we've already done it
						if (n > 0) {
							// what is the place name on this tab
							this_location = $(this).text();
							// if we have details about it download the data in the
							// background
							if (details.hasOwnProperty(this_location)) {
								$.ajax( { 
										url: "https://script.google.com/macros/s/AKfycbzlhe1LMeAOCyNbl7Pn_EFg7y3W-5lZJFZT53M8nvjuw7HERcy5/exec",
										type: "POST",
										dataType: "json",
										location: this_location,
										tab_num: n,
										data: { 
											place: encodeURIComponent(this_location)
										},
										message: "<br>Fetching the water level data for "+this_location+"."
								})
								// don't worry too much if we don't get this information
								// just do the minimum
								.fail( function() {
									// increment the tab_data_counter and if this is 
									// the same as the number of tabs then stop the timers
									tab_data_counter++;
									if ( tab_data_counter == $(".nav-tabs a").length ) {
										// stop the timers
										clearTimeout(apology);
										clearTimeout(dots);
										// open the pop-up on the map
										marker[$("ul.nav-tabs li.active").text()].openPopup();
									};
								})
								// when we have data always do this
								.always(function(a, success) {
									try {
										if ( typeof a !== "undefined" ) { 
											// show a progress message
											$( "#error-text span:last" ).append( "<br>Processing the data for "+this.location );
											processRiverData(this.location, a[this.location]);
											// add a marker to the map
											marker[this.location] = L.marker([details[this.location]['latitude'], details[this.location]['longitude']]).addTo(mymap).bindPopup("<b>"+this.location + details[this.location]["type"]+"</b><br>Current depth: "+details[this.location]["pairs"][details[this.location]["latest date"]]+details[this.location]["units"]);
										};
										// show the tab
										$(".nav-tabs li").eq(this.tab_num).show();
										// increment the tab_data_counter and if this is 
										// the same as the total number of tabs then stop 
										// the timers as we have processed all the tabs
										tab_data_counter++;
										if ( tab_data_counter == $(".nav-tabs a").length ) {
											// stop the timers
											clearTimeout(apology);
											clearTimeout(dots);
											// open the pop-up on the map
											marker[$("ul.nav-tabs li.active").text()].openPopup();
										};
									} catch (e) { showError() };
								});
							}
						}
					});
				} catch (e) { showError() };
			});
		};
	}
	
});
// -------- WHERE THE FUN ENDS ---------------------------------------//
