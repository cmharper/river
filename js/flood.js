// -------- START OF DECLARATION OF FUNCTIONS -----------------------//

function formatDateGroup(s,p) {
	// check if the range is only one day
	if ( s == p ) {
		return moment.unix(s).format("Do MMMM YYYY");
	}
	else {
		return moment.unix(s).format("Do") + "-" + moment.unix(p).format("Do MMMM YYYY");
	};
}

function getDatesInSortedOrder(dates){
	var grouped_dates = [], start_group = null, previous = null;
	for ( var d=0;d<dates.length;d++ ) {
		//console.log(dates[d]+" "+previous+" "+moment.unix(dates[d]).diff(moment.unix(previous), "days"));
		var this_date = moment.unix(dates[d]), last_date = moment.unix(previous);
		if ( start_group == null ) {
			start_group = dates[d];
		}
		// if the difference in dates is greater than one day or it
		// is a new month then store the date and start looking 
		// for a new group
		else if ( this_date.format("MMM")!= last_date.format("MMM") || this_date.diff(last_date, "days") > 1 ) {
			grouped_dates.push( formatDateGroup( start_group, previous ));
			start_group = dates[d];
		};
		// remember the date and keep looking
		previous = dates[d];
	}
	grouped_dates.push( formatDateGroup( start_group, previous ));
	return grouped_dates ;
}

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

// return a phrase indicating the age
function ago(num) {
	if ( num == 1 ) { return "yesterday" }
	else if ( num > 1 && num < 7 ) { return "last "+moment().startOf("day").subtract(num,"days").format("dddd"); }
	else if ( num == 7 ) { return "a week ago" } 
	else { return num.toFixed(0)+" days ago" };
}

// return the maximum number in an array and the unique elements
function arrayMax(arr,st) {
	var len = arr.length, max = -Infinity, maxdates = [];
	while (len--) {
		if ( arr[len] != "" ) {
			var val = parseFloat(arr[len]);
			if ( val == max ) {
				maxdates.push( 86400*parseInt(((900*len)+parseInt(st))/86400) );
			}
			else if ( val > max ) {
				maxdates = [];
				max = val;
				maxdates.push( 86400*parseInt(((900*len)+parseInt(st))/86400) );
			}
		}
	}
	return [ max, deduplicate(maxdates) ];
};

// return the minimum number in an array and the unique elements
function arrayMin(arr,st) {
	var len = arr.length, min = Infinity, mindates = [];
	while (len--) {
		if ( arr[len] != "" ) {
			var val = parseFloat(arr[len]);
			if ( val == min ) {
				mindates.push( 86400*parseInt(((900*len)+parseInt(st))/86400) );
			}
			else if ( val < min ) {
				mindates = [];
				min = val;
				mindates.push( 86400*parseInt(((900*len)+parseInt(st))/86400) );
			}
		}
	}
	return [ min, deduplicate(mindates.sort(function(a, b) { return a - b })) ];
};

// return a string with the elements separated by commas and a 
// final and.  eg apple, banana and pear for [ apple, banana, pear ]
function commaAnd(arr) {
	if ( arr.length > 1 ) {
		return arr.slice(0, arr.length - 1).join(', ') + " and " + arr.slice(-1);
	}
	else {
		return arr[0];
	};
};

// the workhorse which adds the data to the page
function create_page(k) {
	try {
		var tt = new Date(),timecounter=1;
		console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date(); tt=new Date();
		// define the number of decimal places accuracy
		var dp = 3;
		if (details[k]["units"] == "cm") {
			dp = 1;
		};
		console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		// get the current date and time
		var current = moment();
		console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		// get the date data in english
		var group_max_dates = getDatesInSortedOrder(details[k]["maximum dates"]);
		var group_min_dates = getDatesInSortedOrder(details[k]["minimum dates"]);
		console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		// today's value
		var todays_value = details[k]["daily values"]["this day"];
		console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		// set the page title
		document.title = "Water levels for " + k;
		
		// clone the readings array and sort numerically and remove null readings
		//var stats = details[k]["readings"].slice(0).filter(function(el) { return !isNaN(parseFloat(el)) && isFinite(el); }).sort(function(a, b) { return a - b });
		console.log(k+" assign stats, "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		// determine the levels for the 5% and 95% percentiles
		//var lower_percentile = parseFloat(percentile(stats, 0.05).toFixed(dp)),
		//		higher_percentile = parseFloat(percentile(stats, 0.95).toFixed(dp));
		console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		// format the max and min to the required precision
		details[k]["maximum"] = parseFloat(details[k]["maximum"]).toFixed(dp);
		details[k]["minimum"] = parseFloat(details[k]["minimum"]).toFixed(dp);
		console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		// determine whether the current level is within or outside the range
		var compared_level = (todays_value >= details[k]["lower percentile"] && todays_value <= details[k]["higher percentile"]) ? "within" : "outside";
		console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		// get the current percentile for the current level
		//var current_percentile = (100 * percentRank(stats, parseFloat(todays_value))).toFixed(0);
		// determine in english what the level is
		var thelevelis = whatisthelevel(details[k]["current percentile"]);
	} catch (e) { showError() };
		console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
	// set the marker showing whether the level is rising or not
	if (todays_value < details[k]["daily values"]["yesterday average"]) {
		$("#marker-rising").removeClass("danger default").addClass("warning");
		$("#marker-rising-text").html("Falling").removeClass("danger default").addClass("warning");
		$("#marker-rising-icon").removeClass("glyphicon-resize-horizontal glyphicon-arrow-up").addClass("glyphicon-arrow-down");
	} else if (todays_value > details[k]["daily values"]["yesterday average"]) {
		$("#marker-rising").removeClass("warning default").addClass("danger");
		$("#marker-rising-text").html("Rising").removeClass("warning default").addClass("danger");
		$("#marker-rising-icon").removeClass("glyphicon-resize-horizontal glyphicon-arrow-down").addClass("glyphicon-arrow-up");
	} else {
		$("#marker-rising").removeClass("danger warning").addClass("default");
		$("#marker-rising-text").html("Steady").removeClass("danger warning").addClass("default");
		$("#marker-rising-icon").removeClass("glyphicon-arrow-up glyphicon-arrow-down").addClass("glyphicon-resize-horizontal");
	}
	console.log(k+" graph1, "+timecounter+": "+(new Date() - tt )); timecounter++; tt = new Date();
	// draw the time graph
	try {
		$('#graph-time').highcharts('StockChart', {
			chart: {
					zoomType: 'x'
			},
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
				min: 0, //details[k]["minimum"],
				//max: details[k]["maximum"],
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
					value: details[k]["lower percentile"],
					color: 'rgba(204, 204, 204, 1)',
					dashStyle: 'shortdash',
					width: 2
				}, {
					value: details[k]["higher percentile"],
					color: 'rgba(204, 204, 204, 1)',
					dashStyle: 'shortdash',
					width: 2
				}],
				plotBands: [{
					from: details[k]["lower percentile"],
					to: details[k]["higher percentile"],
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
				data: details[k]["mode" ]["graphone"],
				type: 'area',
				zIndex: 10,
				threshold: null,
				tooltip: {
					headerFormat: "<span style=\"color:{point.color}\">\u25CF</span> On {point.x:%A, %B %e %Y at %H:%M} ",
					pointFormat: "the recorded depth was {point.y}.",
					valueDecimals: 1,
					valueSuffix: details[k]["units"]
				},
				color: 'rgba(50, 118, 177,1)',
				fillColor: 'rgba(40, 94, 142,0.5)'
			}]
		});
	} catch (e) { $('#graph-time').html("<p>Sorry but we could not draw a chart for the data we had.</p>") };
	console.log(k+" completed graph1, "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
	// lets now create the data for the distribution graph
	try {
		console.log(k+" graph2, "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		// finally lets draw the chart
		$('#graph-distribution').highcharts({
				chart: {
					type: 'areaspline',
					zoomType: 'x'
				},
				legend: {
					enabled: false
				},
				xAxis: {
					//categories: details[k]["mode"].x,
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
						return 'A measurement of ' + this.x + details[k]["units"] + ' has been recorded ' + Number(this.y).toLocaleString('en') + ' times.';
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
					data: details[k]["mode"]["graphtwo"],
					color: 'rgba(50, 118, 177,1)',
					fillColor: 'rgba(40, 94, 142,0.5)'
				}]
		});
		// define the first recording date and number of readings
		$(".number-of-recordings").html( Number(details[k]["readings"].length).toLocaleString('en') );
		var first_recording_date = moment.unix(details[k]["earliest date"]).format("Do MMMM YYYY");
		$(".first-recording-date").html( first_recording_date );
	} catch (e) { $('#graph-distribution').html("<p>Sorry but we could not draw a chart for the data we had.</p>") };
	console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
	// set where the data is for, the current level and when it was taken
	$(".river-location").html(k + details[k]["type"]);
	$(".current-depth").html(todays_value + details[k]["units"]);
	try { $("#last-updated").html("Last updated: about " + moment().to(moment.unix(details[k]["latest date"])) + " ("+moment.unix(details[k]["latest date"]).calendar(moment(), { sameElse: 'Do MMMM YYYY [at] HH:mm' })+")").show(); }
	catch (e) { $("#last-updated").hide(); }
	console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
	// assign the marker for the level and how high it is
	// the blue line in the icon is the percentile
	$("#marker-level").css({
		"background": "#FFF",
		"background": "-moz-linear-gradient(090deg, rgba(50,118,177,1) " + details[k]["current percentile"] + "%, rgba(255,255,255,1) " + details[k]["current percentile"] + "%)",
		"background": "-webkit-gradient(linear, left top, left bottom, color-stop(" + details[k]["current percentile"] + "%, rgba(255,255,255,1)), color-stop(" + details[k]["current percentile"] + "%, rgba(50,118,177,1)))",
		"background": "-webkit-linear-gradient(090deg, rgba(50,118,177,1) " + details[k]["current percentile"] + "%, rgba(255,255,255,1) " + details[k]["current percentile"] + "%)",
		"background": "-o-linear-gradient(090deg, rgba(50,118,177,1) " + details[k]["current percentile"] + "%, rgba(255,255,255,1) " + details[k]["current percentile"] + "%)",
		"background": "-ms-linear-gradient(090deg, rgba(50,118,177,1) " + details[k]["current percentile"] + "%, rgba(255,255,255,1) " + details[k]["current percentile"] + "%)",
		"background": "linear-gradient(0deg, rgba(50,118,177,1) " + details[k]["current percentile"] + "%, rgba(255,255,255,1) " + details[k]["current percentile"] + "%)",
		"filter": "progid:DXImageTransform.Microsoft.gradient( startColorstr='#FFFFFF', endColorstr='#3276B1',GradientType=0 )"
	});
	$("#marker-level-text").html(thelevelis[0]);
	console.log(k+" current percentile,"+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
	// do the facts about panel
	$("#current-depth-percentile-rank").html(details[k]["current percentile"]);
	console.log(k+" lower percentile,"+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
	$("#current-depth-minimum").html(details[k]["lower percentile"] + details[k]["units"]);
	console.log(k+" higher percentile,"+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
	$("#current-depth-maximum").html(details[k]["higher percentile"] + details[k]["units"]);
	console.log(k+" mode,"+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
	$("#current-depth-most-common").html(parseFloat(details[k]["mode"].mode).toFixed(dp) + details[k]["units"]);
	$("#current-depth-most-common-recording").html(parseFloat(details[k]["mode"].mode).toFixed(dp) + details[k]["units"]);
	$("#current-depth-most-common-occurrance").html(Number(parseFloat(details[k]["mode"].greatestFreq).toFixed(0)).toLocaleString('en'));
	
	console.log(k+" para,"+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
	// assign the paragraph of text
	try {
			var desc = "The water level is currently " + todays_value + details[k]["units"] + ".  This is " + compared_level + " the usual range" + thelevelis[1][compared_level] + "; the level " + raised(details[k]["daily values"]["yesterday average"], todays_value, details[k]["units"], dp) + " "+details[k]["daily values"]["yesterday ago"]+" and " + raised(details[k]["daily values"]["last week average"], todays_value, details[k]["units"], dp) + " "+details[k]["daily values"]["last week ago"]+".";
			// if this data is more than a day old
			if ( parseInt(moment().unix())-parseInt(details[k]["latest date"]) > 86400 ) {
				desc = desc.replace(/\ currently /g," ").replace(/\ is\ /g," was ").replace(/\ has\ /g," had ").replace(/\ yesterday\ /g," the previous day ");
			}
			$("#level-description").html(desc).show();
	} catch (e) { $("#para1").hide(); }
	console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
	// do the what is the usual depth panel
	$("#day-average-date").html(current.format("Do MMMM"));
	if (details[k]["max on this day year"] !== null && details[k]["max on this day year"] !== null) {
		try { $("#day-average").html(mean(details[k]["daily values"]["all readings"]).toFixed(dp) + details[k]["units"] + " ± " + standardDeviation(details[k]["daily values"]["all readings"]).toFixed(dp) + details[k]["units"]).show(); }
		catch (e) { $("#day-average-no-data").closest("tr").hide(); };
		$("#day-average-high").html(details[k]["max on this day"] + details[k]["units"] + " in " + details[k]["max on this day year"]);
		$("#day-average-low").html(details[k]["min on this day"] + details[k]["units"] + " in " + details[k]["min on this day year"]);
		$("#day-average-no-data").hide();
		$(".average-hide").show();
	} else {
		$("#day-average-no-data").show();
		$(".average-hide").hide();
	}
	console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
	// do the records panel
	$("#highest-ever").html(details[k]["maximum"] + details[k]["units"]);
	$("#highest-ever-date").html(commaAnd(group_max_dates));
	$("#lowest-ever").html(details[k]["minimum"] + details[k]["units"]);
	$("#lowest-ever-date").html(commaAnd(group_min_dates));
	console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
	// qualify our data if necessary
	var message = "Note: we only began recording <span id=\"start-date\">recently</span>, different depths may have been recorded before then.";
	$("#environment-agency-message").html("<span class=\"text-muted\">"+message+"</span>");
	try { $("#start-date").html("on "+first_recording_date); }
	catch (e) { }; // do nothing
	console.log(k+" final: "+(new Date() - tt )); timecounter++; tt=new Date();
}

// function to return an array with no duplicates
function deduplicate( arr ) {
	var uniques = [];
	$.each(arr, function(i, el){
		if($.inArray(el, uniques) === -1) uniques.push(el);
	});
	return uniques;
}

// function to find a days worth of data from the array
function findData( d, start, end, arr ) {
	var data = [];
	while ( data.length == 0 ) {
		d++;
		data = arr.slice( (parseInt(start)-parseInt(96*d)), (parseInt(end)-parseInt(96*(d-1))) );
		// remove non-numerics from the array
		data = data.filter(function(el) { return !isNaN(parseFloat(el)) && isFinite(el); });
	}
	return [ d, deduplicate(data) ];
};

// returns the mean of the values
function mean(data) {
	data = data.filter(function(el) { return !isNaN(parseFloat(el)) && isFinite(el); });
	var sum = data.reduce(function(sum, value) {
		return sum + parseFloat(value);
	}, 0);
	var avg = sum / data.length;
	return avg;
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
		var tt = new Date(),timecounter=1;
		console.log(k+" started process: "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		// set the multiplier, precision and split the data by new lines
		var multiplier = 0.001,
				dp = 3,
				first_line = null,
				lines = [];
		// correct the multiplier and precision
		if (details[k]["units"] == "cm") {
			multiplier = 0.1;
			dp = 1;
		};
		//console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		// get the data in the correct format
		var dataparts = data.trim().split(",").map(function(n) { if ( isNaN(n) ) { return n } else { return parseFloat(parseInt(n)*multiplier).toFixed(dp) }; }),
				datapartslength = dataparts.length;
		//console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		// set details
		details[k]["earliest date"] = parseInt(dataparts[0]/multiplier);
		details[k]["latest date"] = parseInt(details[k]["earliest date"]+(900*(datapartslength-2)));
		// get the maximum and minimum values
		//console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		var range = arrayMax(dataparts.slice(1,datapartslength),details[k]["earliest date"]);
		details[k]["maximum"] = parseFloat(range[0]);
		details[k]["maximum dates"] = range[1];
		//console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		var range = arrayMin(dataparts.slice(1,datapartslength),details[k]["earliest date"]);
		details[k]["minimum"] = parseFloat(range[0]);
		details[k]["minimum dates"] = range[1];
		//console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		// the data should have 96 (4*15minutes) data points per day but
		// the data does not always start at 00:00.  find out how many
		// data points are missing
		var number_of_missing_points_at_the_start = parseInt((moment.unix(details[k]["earliest date"],"s")-moment.unix(details[k]["earliest date"],"s").startOf("day"))/900000);
		// determine how many days worth of data we have (the data for the
		// last day may not end at 00:00)
		var number_of_days_worth_of_data = parseInt(datapartslength+number_of_missing_points_at_the_start)/96;
		// get the position in the array where the last days worth of
		// data starts
		var start_of_last_day_position = (parseInt( number_of_days_worth_of_data )*96)-number_of_missing_points_at_the_start+1;
		// try to find the day where we last had data
		//console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		var data_found = findData(-1,start_of_last_day_position,datapartslength,dataparts);
		details[k]["daily values"]["this day"] = parseFloat(data_found[1][data_found[1].length-1]).toFixed(dp);
		details[k]["daily values"]["this day date"] = moment.utc( parseInt( 900*(start_of_last_day_position-1) ) + details[k]["earliest date"], "s" ).unix();
		
		// now try to get the previous day with data
		//console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		data_found = findData(data_found[0],start_of_last_day_position, parseInt(datapartslength-details[k]["daily values"]["this day"].length),dataparts);
		details[k]["daily values"]["yesterday average"] = mean(data_found[1]).toFixed(dp);
		details[k]["daily values"]["yesterday ago"] = ago(data_found[0]);
		
		// now try to get the previous data from at least a week ago
		//console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		data_found = findData(data_found[0]+5,start_of_last_day_position, parseInt(datapartslength-details[k]["daily values"]["this day"].length),dataparts);
		details[k]["daily values"]["last week average"] = mean(data_found[1]).toFixed(dp);
		details[k]["daily values"]["last week ago"] = ago(data_found[0]); //moment.utc(details[k]["daily values"]["this day date"],"s").subtract(data_found[0],"days");
		
		// now try to find all the data on a given date
		//console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		var start_year = moment.unix(details[k]["earliest date"],"s").year(),
				end_year = moment.utc(details[k]["daily values"]["this day date"],"s").year();
		var yearly = [];
		details[k]["max on this day"] = -Infinity;
		details[k]["max on this day year"] = [];
		details[k]["min on this day"] = Infinity;
		details[k]["min on this day year"] = [];
		details[k]["daily values"]["all readings"] = [];
		for ( y=start_year;y<end_year;y++ ) {
			var which_date = moment.utc(y+" "+moment.utc().format("MM DD"),"YYYY MM DD").startOf("day").unix();
			var pos = 1 + ( parseInt(which_date) - details[k]["earliest date"] )/900;
			// check we have data in that range
			if ( pos < 0 || pos > dataparts.length ) { continue };
			yearly = dataparts.slice(Math.max(pos,1),pos+96);
			for ( var z=0;z<yearly.length;z++ ) {
				if ( parseFloat(yearly[z]) == details[k]["max on this day"] ) {
					details[k]["max on this day year"].push(y);
				}
				else if ( parseFloat(yearly[z]) > details[k]["max on this day"] ) {
					details[k]["max on this day year"] = [];
					details[k]["max on this day year"].push(y);
					details[k]["max on this day"] = parseFloat(yearly[z]);
				};
				if ( parseFloat(yearly[z]) == details[k]["min on this day"] ) {
					details[k]["min on this day year"].push(y);
				}
				else if ( parseFloat(yearly[z]) < details[k]["min on this day"] ) {
					details[k]["min on this day year"] = [];
					details[k]["min on this day year"].push(y);
					details[k]["min on this day"] = parseFloat(yearly[z]);
				};
				// compile all the daily values
				details[k]["daily values"]["all readings"].push( yearly[z] );
			};
		};
		//console.log(k+" "+timecounter+": "+(new Date() - tt )); timecounter++; tt=new Date();
		details[k]["max on this day"] = parseFloat(details[k]["max on this day"]).toFixed(dp);
		details[k]["max on this day year"] = commaAnd(deduplicate(details[k]["max on this day year"]));
		details[k]["min on this day"] = parseFloat(details[k]["min on this day"]).toFixed(dp);
		details[k]["min on this day year"] = commaAnd(deduplicate(details[k]["min on this day year"]));

		// assign all the readings
		details[k]["readings"] = dataparts.slice(1,datapartslength);

		// now compile the stats
		// see: http://codereview.stackexchange.com/a/68431
		function mode(arr) {
			var count = null;
			return arr.reduce(function(current, item) {
				if ( count == null ) { 
					count = parseInt(item/multiplier)-900;
					return current;
				}
				else {
					count += 900;
					if ( ! isNaN(item) ) {
						current.graphone.push( [ new Date( count * 1000.0).getTime(), parseFloat(item) ] );
						var val = current.numMapping[parseFloat(item).toFixed(1)] = (current.numMapping[parseFloat(item).toFixed(1)] || 0) + 1;
						if (val > current.greatestFreq) {
							current.greatestFreq = val;
							current.mode = item;
						}
						return current;
					}
					else {
						current.graphone.push( [ new Date( count * 1000.0).getTime(), "" ] );
						return current;
					};
				};
			}, {mode: null, greatestFreq: -Infinity, numMapping: {}, graphone: [], graphtwo: []}, arr.slice(1)); };
		details[k]["mode" ] = mode(dataparts);
		var o = details[k]["mode"].numMapping;
		details[k]["mode"]["graphtwo"] = Object.keys(o).sort(function(a, b) { return a - b }).map(function(k) { return [ parseFloat(k), o[k] ] });	
		// clone the readings array and sort numerically and remove null readings
		dataparts = dataparts.slice(1).filter(function(el) { return !isNaN(parseFloat(el)) && isFinite(el); }).sort(function(a, b) { return a - b });
		// determine the levels for the percentiles
		details[k]["lower percentile" ] = parseFloat(percentile(dataparts, 0.05).toFixed(dp));
		details[k]["higher percentile" ] = parseFloat(percentile(dataparts, 0.95).toFixed(dp));
		details[k]["current percentile" ] = (100 * percentRank(dataparts, parseFloat(details[k]["daily values"]["this day"]))).toFixed(0);		
		console.log(k+" final process: "+(new Date() - tt )); timecounter++; tt=new Date();
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
}

// function to calculate the standard deviation of an array of numbers
function standardDeviation(values) {
	values = values.filter(function(el) { return !isNaN(parseFloat(el)) && isFinite(el); });
	var avg = mean(values);
	var squareDiffs = values.map(function(value) {
		var diff = parseFloat(value) - avg;
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
		"daily values": {},
		"maximum": null,
		"maximum dates": [],
		"minimum": null,
		"minimum dates": [],
		"longitude": -2.043272,
		"latitude": 51.160588,
		"max on this day": -Infinity,
		"max on this day year": null,
		"min on this day": Infinity,
		"min on this day year": null,
		"lower percentile": null,
		"higher percentile": null,
		"current percentile": null,
		"mode": {},
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
		"daily values": {},
		"maximum": null,
		"maximum dates": [],
		"minimum": null,
		"minimum dates": [],
		"longitude": -1.9727647,
		"latitude": 51.186216,
		"max on this day": -Infinity,
		"max on this day year": null,
		"min on this day": Infinity,
		"min on this day year": null,
		"lower percentile": null,
		"higher percentile": null,
		"current percentile": null,
		"mode": {},
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
		"daily values": {},
		"maximum": null,
		"maximum dates": [],
		"minimum": null,
		"minimum dates": [],
		"longitude": -2.132143,
		"latitude": 51.1839,
		"max on this day": -Infinity,
		"max on this day year": null,
		"min on this day": Infinity,
		"min on this day year": null,
		"lower percentile": null,
		"higher percentile": null,
		"current percentile": null,
		"mode": {},
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
		"daily values": {},
		"maximum": null,
		"maximum dates": [],
		"minimum": null,
		"minimum dates": [],
		"longitude": -1.958392,
		"latitude": 51.202428,
		"max on this day": -Infinity,
		"max on this day year": null,
		"min on this day": Infinity,
		"min on this day year": null,
		"lower percentile": null,
		"higher percentile": null,
		"current percentile": null,
		"mode": {},
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
	console.log("Start: "+new Date());
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
				alert("uhoh");
				// show the error message
				details[this.location]["warning"] = 100;
				if ( this.location == $("ul.nav-tabs li.active").text() ) {
					showFloodWarnings($("ul.nav-tabs li.active").text());
				};
			})
			// always do this when we have downloaded the data
			.always(function(a, success) {
				alert(JSON.stringify(a));
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
		} 
		else {
			$( "#error-text" ).append( "<span><br>Fetching the water level data for "+this_location+".</span>" );
			// dummy function to fetch this data
			(function (this_location) {
				// download and unzip the data
				//JSZipUtils.getBinaryContent('all_readings.zip', function(err, zipdata) {
				JSZipUtils.getBinaryContent('http://rcors.boff.in/'+this_location, function(err, zipdata) {
					if (err) { showError(); }
					var zip = new JSZip();
					try {
						zip.loadAsync(zipdata)
						.then(function(zip) {
							$( "#error-text" ).append( "<span><br>Processing the water level data for "+this_location+".</span>" );
							return zip.file("all.readings").async("string");
						})
						.then(function success(text) {
							//console.log("End "+this_location+" fetch: "+new Date());
							// process the information downloaded
							processRiverData(this_location, text);
							//console.log("End "+this_location+" processed: "+new Date());
							// add a marker to the map
							marker[this_location] = L.marker([details[this_location]['latitude'], details[this_location]['longitude']]).addTo(mymap).bindPopup("<b>"+this_location + details[this_location]["type"]+"</b><br>Current depth: "+details[this_location]["daily values"]["this day"]+details[this_location]["units"]);
							// show the first tab
							create_page(this_location);
							//console.log("End "+this_location+" created: "+new Date());
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
							//console.log("End "+this_location+" fetch: "+new Date());
						}, function error(e) {
							showError();
						});
					} catch(e) {
						showError();
					}
				});
			}(this_location)); // closure for the dummy function
			
			// now let's get the data for the other locations/tabs
			var tab_data_counter = 1;
			
			$(".nav-tabs a").each( function(tabnumber) {
				// skip the first one as we've already done it
				if (tabnumber > 0) {
					// what is the place name on this tab
					this_location = $(this).text();
					// dummy function to fetch this data
					(function (this_location) {
						// if we have details about it download the data in the
						// background
						if (details.hasOwnProperty(this_location)) {
							JSZipUtils.getBinaryContent('http://rcors.boff.in/'+this_location, function(err, zipdata) {
								if (err) { showError(); }
								var zip = new JSZip();
								try {
									zip.loadAsync(zipdata)
									.then(function(zip) {
										$( "#error-text" ).append( "<span><br>Processing the water level data for "+this_location+".</span>" );
										return zip.file("all.readings").async("string");
									})
									.then(function success(text) {
										// process the information downloaded
										processRiverData(this_location, text);
										// add a marker to the map
										marker[this_location] = L.marker([details[this_location]['latitude'], details[this_location]['longitude']]).addTo(mymap).bindPopup("<b>"+this_location + details[this_location]["type"]+"</b><br>Current depth: "+details[this_location]["daily values"]["this day"]+details[this_location]["units"]);
										// show the tab
										$(".nav-tabs li").eq(tabnumber).show();
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
										//console.log("End "+this_location+" fetch: "+new Date());
									}, function error(e) {
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
									});
								} catch(e) {
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
								}
							});
						}
					}(this_location)); // closure of the dummy function
				}
			});
			
		};
	}
	
});
// -------- WHERE THE FUN ENDS ---------------------------------------//
