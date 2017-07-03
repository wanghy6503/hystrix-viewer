// CIRCUIT_BREAKER circle visualization settings
var circuitCircleRadius = d3.scalePow().exponent(0.5).domain([0, 400]).range(["5", maxRadiusForCircle]); // requests per second per host
var circuitCircleYaxis = d3.scaleLinear().domain([0, 400]).range(["30%", maxXaxisForCircle]);
var circuitCircleXaxis = d3.scaleLinear().domain([0, 400]).range(["30%", maxYaxisForCircle]);
var circuitColorRange = d3.scaleLinear().domain([10, 25, 40, 50]).range(["green", "#FFCC00", "#FF9900", "red"]);
var circuitErrorPercentageColorRange = d3.scaleLinear().domain([0, 10, 35, 50]).range(["grey", "black", "#FF9900", "red"]);

// default sort type and direction
var _circuitSortedBy = 'alph_asc';

/**
 *
 * Hystrix circuit configuration which holds the circuit chart properties and the data.
 *
 * @param {string} parentDivId div id of parent container
 * @param {string} circuitKey metric prefix for retrieving the individual metric data from metric JSON array.
 * @param {string} serviceName name of the service name which generates the Hystrix metrics
 * @param {string} methodName corresponf method name responsible for generating Hystrix metrics
 * @constructor
 */
function HystrixCommandConfig(parentDivId, circuitKey, serviceName, methodName) {
    this.parentDivId = parentDivId;
    this.circuitKey = circuitKey;
    this.serviceName = serviceName;
    this.methodName = methodName;
    this.suffix = this.serviceName + "_" + this.methodName;
    this.initialized = false;
    this.circuitDivId = "CIRCUIT_" + this.suffix;
    this.chartDivId = "chart_CIRCUIT_" + this.suffix;
    this.dataDivId = this.chartDivId + "_monitor_data";
    this.graphDivId = "graph_CIRCUIT_" + this.suffix;
    this.data = {};
    this.graphData = [];

    this.render = function render() {
        if (!this.initialized) {
            var $parentDiv = $("#" + this.parentDivId);

            var $circuitDiv = $("<div></div>").attr('id', this.circuitDivId)
                .addClass('monitor').css({'position': 'relative'});
            $parentDiv.append($circuitDiv);

            this.addChart($circuitDiv);
            this.addTitle($circuitDiv);
            this.addData($circuitDiv);
            this.addSparkline($circuitDiv);

            this.initialized = true;
        }
    };

    this.refresh = function update(jsonData) {
        this.preProcessData(jsonData);
        this.render();
        this.updateCircle();
        this.updateData();
        this.updateSparkline();
    };

    this.clear = function () {
        $(this.circuitDivId).empty();
        delete this.circuitDivId;

        $(this.chartDivId).empty();
        delete this.chartDivId;

        $(this.dataDivId).empty();
        delete this.dataDivId;

        $(this.graphDivId).empty();
        delete this.graphDivId;

        delete this.data;
        delete this.graphData;
    };

    this.addChart = function addChart(circuitDiv) {
        var $chartDiv = $("<div></div>").attr('id', this.chartDivId).addClass('chart')
            .css({
                'position': 'absolute', 'top': '0px', 'left': '0', 'float': 'left',
                'width': '100%', 'height': '100%'
            });
        circuitDiv.append($chartDiv);

        this.addCircle(this.chartDivId);
    };

    this.addCircle = function addCirle(chartDivId) {
        var svgContainer = d3.select("#" + chartDivId).append("svg:svg")
            .attr("width", "100%").attr("height", "100%");
        var circle = svgContainer.append("svg:circle");
        circle.style("fill", "green").attr("cx", "30%").attr("cy", "30%").attr("r", 5);
    };

    this.updateCircle = function updateCircle() {
        var newXaxisForCircle = circuitCircleXaxis(this.data["ratePerSecondPerHost"]);
        if (parseInt(newXaxisForCircle, 10) > parseInt(maxXaxisForCircle, 10)) {
            newXaxisForCircle = maxXaxisForCircle;
        }

        var newYaxisForCircle = circuitCircleYaxis(this.data["ratePerSecondPerHost"]);
        if (parseInt(newYaxisForCircle, 10) > parseInt(maxYaxisForCircle, 10)) {
            newYaxisForCircle = maxYaxisForCircle;
        }

        var newRadiusForCircle = circuitCircleRadius(this.data["ratePerSecondPerHost"]);
        if (parseInt(newRadiusForCircle, 10) > parseInt(maxRadiusForCircle, 10)) {
            newRadiusForCircle = maxRadiusForCircle;
        }

        d3.selectAll("#" + this.chartDivId + " circle")
            .transition()
            .duration(400)
            .attr("cy", newYaxisForCircle)
            .attr("cx", newXaxisForCircle)
            .attr("r", newRadiusForCircle)
            .style("fill", circuitColorRange(this.data["errorPercentage"]));
    };

    this.addTitle = function addTitle(circuitDiv) {
        var html = "<p class=\"name\"" + this.serviceName + "." + this.methodName + ">"
            + this.serviceName + "." + this.methodName + "</p>";

        var $titleDiv = $("<div></div>")
            .css({
                'position': 'absolute', 'top': '0px',
                'width': '100%', 'height': '15px', 'opacity': '0.8', 'background': 'white'
            })
            .html(html);
        circuitDiv.append($titleDiv);
    };

    this.addData = function addData(chartDiv) {
        var $monitorDiv = $("<div></div>");
        $($monitorDiv).css({
            'position': 'absolute', 'top': '15px', 'opacity': '0.8',
            'background': 'white', 'width': '100%', 'height': '95%'
        });
        chartDiv.append($monitorDiv);

        var $monitorDataDiv = $("<div></div>")
            .attr('id', this.dataDivId)
            .addClass('monitor_data');
        $monitorDiv.append($monitorDataDiv);
    };

    this.updateData = function updateData() {
        if (this.initialized) {
            var $monitorDataDiv = $("#" + this.dataDivId);
            $monitorDataDiv.empty();
            this.addCounters($monitorDataDiv);
            this.addRate($monitorDataDiv);
            this.addCircuitStatus($monitorDataDiv);
            this.addDataTable($monitorDataDiv);

            // set the rates on the div element so it's available for sorting
            $("#" + this.circuitDivId)
                .attr('rate_value', this.data["ratePerSecond"])
                .attr('error_then_volume', this.data["errorThenVolume"]);

            $("#" + this.circuitDivId + " a.errorPercentage")
                .css('color', circuitErrorPercentageColorRange(this.data["errorPercentage"]));
        }
    };

    this.addCounters = function addCounters(monitorDataDiv) {
        var $countersDiv = $("<div></div>").addClass("counters");
        monitorDataDiv.append($countersDiv);

        var $errPerDiv = $("<div></div>").addClass("hystrix-cell line")
            .html("<a href=\"javascript://\" title=\"Error Percentage [Timed-out + Threadpool Rejected + Failure / Total]\""
                + "class=\"hystrix-tooltip errorPercentage\">"
                + "<span class=\"value\">" + this.data["errorPercentage"] + "</span>%</a>");
        $countersDiv.append($errPerDiv);

        var rollingCountTimeoutHtml = "<a href=\"javascript://\" title=\"Timed-out Request Count\""
            + "class=\"line hystrix-tooltip timeout\">"
            + "<span class=\"value\">" + this.data["rollingCountTimeout"] + "</span></a>";

        var rollingCountPoolRejectedHtml;
        if (!this.data["rollingCountThreadPoolRejected"]) {
            rollingCountPoolRejectedHtml = "<a href=\"javascript://\" title=\"Semaphore Rejected Request Count\""
                + "class=\"line hystrix-tooltip rejected\">"
                + "<span class=\"value\">" + this.data["rollingCountSemaphoreRejected"] + "</span></a>";
        } else {
            rollingCountPoolRejectedHtml = "<a href=\"javascript://\" title=\"Threadpool Rejected Request Count\""
                + "class=\"line hystrix-tooltip rejected\">"
                + "<span class=\"value\">" + this.data["rollingCountThreadPoolRejected"] + "</span></a>";
        }

        var rollingCountFailureHtml = "<a href=\"javascript://\" title=\"Failure Request Count\""
            + "class=\"line hystrix-tooltip failure\">"
            + "<span class=\"value\">" + this.data["rollingCountFailure"] + "</span></a>";

        var $sec1Div = $("<div></div>").addClass("hystrix-cell borderRight")
            .html(rollingCountTimeoutHtml + "\n" + rollingCountPoolRejectedHtml + "\n"
                + rollingCountFailureHtml);
        $countersDiv.append($sec1Div);

        var rollingCountSuccessHtml = "<a href=\"javascript://\" title=\"Successful Request Count\""
            + "class=\"line hystrix-tooltip success\">"
            + "<span class=\"value\">" + this.data["rollingCountSuccess"] + "</span></a>";

        var rollingCountShortCircuitedHtml = "<a href=\"javascript://\" title=\"Short-circuited Request Count\""
            + "class=\"line hystrix-tooltip shortCircuited\">"
            + "<span class=\"value\">" + this.data["rollingCountShortCircuited"] + "</span></a>";

        var rollingCountBadRequestsHtml = "<a href=\"javascript://\" title=\"Bad Request Count\""
            + "class=\"line hystrix-tooltip badRequest\">"
            + "<span class=\"value\">" + this.data["rollingCountBadRequests"] + "</span></a>";

        var $sec2Div = $("<div></div>").addClass("hystrix-cell borderRight")
            .html(rollingCountSuccessHtml + "\n" + rollingCountShortCircuitedHtml + "\n"
                + rollingCountBadRequestsHtml);
        $countersDiv.append($sec2Div);
    };

    this.addRate = function addRate(monitorDataDiv) {
        var ratePerSecondPerHostHtml = "<a href=\"javascript://\" title=\"Total Request Rate per Second per Reporting Host\""
            + "class=\"hystrix-tooltip rate\">"
            + "<span class=\"smaller\">Host: </span>"
            + "<span class=\"ratePerSecondPerHost\">"
            + this.data["ratePerSecondPerHost"] + "</span>/s</a>";

        var $rate1Div = $("<div></div>").addClass("rate")
            .html(ratePerSecondPerHostHtml);
        monitorDataDiv.append($rate1Div);

        var ratePerSecondPerClusterHtml = "<a href=\"javascript://\" title=\"Total Request Rate per Second for Cluster\""
            + "class=\"hystrix-tooltip rate\">"
            + "<span class=\"smaller\">Cluster: </span>"
            + "<span class=\"ratePerSecond\">"
            + this.data["ratePerSecond"] + "</span>/s</a>";

        var $rate2Div = $("<div></div>").addClass("rate")
            .html(ratePerSecondPerClusterHtml);
        monitorDataDiv.append($rate2Div);
    };

    this.addCircuitStatus = function addCircuitStatus(monitorDataDiv) {
        //var html = "Circuit <font color=\"green\">Closed</font>";
        var html = "";
        if (this.data["propertyValue_circuitBreakerForceClosed"]) {
            html = "<span class=\"smaller\">[ <font color=\"orange\">Forced Closed</font> ]";
        }

        if (this.data["propertyValue_circuitBreakerForceOpen"]) {
            html = "Circuit <font color=\"red\">Forced Open</font>";
        }

        if (this.data["isCircuitBreakerOpen"] === this.data["reportingHosts"]) {
            html = "Circuit <font color=\"red\">Open</font>";
        } else if (this.data["isCircuitBreakerOpen"] === 0) {
            html = "Circuit <font color=\"green\">Closed</font>";
        } else {
            if (this.data["isCircuitBreakerOpen"] !== undefined &&
                typeof this.data["isCircuitBreakerOpen"] === 'object') {
                html = "Circuit <font color=\"red\">Open " + this.data["isCircuitBreakerOpen"].true +
                    "</font> <font color=\"green\">Closed " + this.data["isCircuitBreakerOpen"].false;
            } else if (this.data["isCircuitBreakerOpen"] !== undefined) {
                html = "Circuit <font color=\"orange\">" +
                    this.data["isCircuitBreakerOpen"].toString()
                        .replace("true", "Open").replace("false", "Closed");
            } else {
                html = "Circuit &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
            }
        }

        var $circuitStatusDiv = $("<div></div>").addClass("circuitStatus").html(html);
        monitorDataDiv.append($circuitStatusDiv);
    };

    this.addDataTable = function addDataTable(monitorDataDiv) {
        var $spacerDiv = $("<div></div>").addClass("spacer");
        monitorDataDiv.append($spacerDiv);

        var $monitorRow1Div = $("<div class=\"tableRow\">" +
            "<div class=\"hystrix-cell hystrix-header hystrix-left\">Hosts</div>" +
            "<div class=\"hystrix-cell hystrix-data hystrix-left\">" + this.data["reportingHosts"] + " </div>" +
            "<div class=\"hystrix-cell hystrix-header hystrix-right\">90th</div>" +
            "<div class=\"hystrix-cell hystrix-data hystrix-right latency90\"><span class=\"value\">" + this.data["latency90"] + "</span>ms </div></div>");
        monitorDataDiv.append($monitorRow1Div);

        var $monitorRow2Div = $("<div class=\"tableRow\">" +
            "<div class=\"hystrix-cell hystrix-header hystrix-left\">Median</div>" +
            "<div class=\"hystrix-cell hystrix-data hystrix-left latencyMedian\"><span class=\"value\">" + this.data["latencyMedian"] + "</span>ms </div>" +
            "<div class=\"hystrix-cell hystrix-header hystrix-right\">99th</div>" +
            "<div class=\"hystrix-cell hystrix-data hystrix-right latency99\"><span class=\"value\">" + this.data["latency99"] + "</span>ms </div></div>");
        monitorDataDiv.append($monitorRow2Div);

        var $monitorRow3Div = $("<div class=\"tableRow\">" +
            "<div class=\"hystrix-cell hystrix-header hystrix-left\">Mean</div>" +
            "<div class=\"hystrix-cell hystrix-data hystrix-left latencyMean\"><span class=\"value\">" + this.data["latencyMean"] + "</span>ms</div>" +
            "<div class=\"hystrix-cell hystrix-header hystrix-right\">99.5th</div>" +
            "<div class=\"hystrix-cell hystrix-data hystrix-right latency995\"><span class=\"value\">" + this.data["latency995"] + "</span>ms</div></div>");
        monitorDataDiv.append($monitorRow3Div);
    };

    this.addSparkline = function addSparkline(chartDiv) {
        var $graphDiv = $("<div></div>").attr('id', this.graphDivId).addClass('graph')
            .css({
                'position': 'absolute', 'top': '25px', 'left': '0', 'float': 'left',
                'width': '140px', 'height': '62px'
            });
        chartDiv.append($graphDiv);

        var svgContainer = d3.select("#" + this.graphDivId).append("svg:svg")
            .attr("width", "100%").attr("height", "100%");
        svgContainer.append("svg:path");
    };


    this.updateSparkline = function updateSparkline() {
        var currentTimeMilliseconds = new Date().getTime();
        this.graphData.push({"v": parseFloat(this.data["ratePerSecond"]), "t": currentTimeMilliseconds});

        // 400 should be plenty for the 2 minutes we have the scale set
        // to below even with a very low update latency
        while (this.graphData.length > 200) {
            // remove data so we don't keep increasing forever
            this.graphData.shift();
        }

        if (this.graphData.length === 1 && this.graphData[0].v === 0) {
            //console.log("we have a single 0 so skipping");
            // don't show if we have a single 0
            return;
        }

        if (this.graphData.length > 1 && this.graphData[0].v === 0 && this.graphData[1].v !== 0) {
            //console.log("we have a leading 0 so removing it");
            // get rid of a leading 0 if the following number is not a 0
            this.graphData.shift();
        }

        var xScale = d3.scaleTime()
            .domain([new Date(currentTimeMilliseconds - (60 * 1000 * 2)),
                new Date(currentTimeMilliseconds)]).range([0, 140]);

        var yMin = d3.min(this.graphData, function (d) {
            return d.v;
        });
        var yMax = d3.max(this.graphData, function (d) {
            return d.v;
        });
        var yScale = d3.scaleLinear().domain([yMin, yMax]).nice().range([60, 0]); // y goes DOWN, so 60 is the "lowest"

        var sparkline = d3.line()
        // assign the X function to plot our line as we wish
            .x(function (d) {
                return xScale(new Date(d.t));
            })
            .y(function (d) {
                return yScale(d.v);
            })
            .curve(d3.curveBasis);

        var gdata = this.graphData;
        d3.selectAll("#" + this.graphDivId + " path")
            .attr("d", function (d, i) {
                return sparkline(gdata);
            });
    };

    this.preProcessData = function preProcessData(jsonData) {
        this.data = {};
        var numberSeconds =
            _getMetricValue(jsonData, this.circuitKey + ".propertyValue_metricsRollingStatisticalWindowInMilliseconds", 0) / 1000;

        var totalRequests = _getMetricValue(jsonData, this.circuitKey + ".requestCount", 0);
        if (totalRequests < 0) {
            totalRequests = 0;
        }
        var reportingHosts = _getMetricValue(jsonData, this.circuitKey + ".reportingHosts", 0);

        this.data["ratePerSecond"] = _roundNumber(totalRequests / numberSeconds);
        this.data["ratePerSecondPerHost"] = _roundNumber(totalRequests / numberSeconds / reportingHosts);
        this.data["ratePerSecondPerHostDisplay"] = this.data["ratePerSecondPerHost"];
        this.data["errorPercentage"] = _getMetricValue(jsonData, this.circuitKey + ".errorPercentage", 0);

        this.data["errorThenVolume"] = isNaN(this.data["ratePerSecond"]) ?
            -1 : (this.data["errorPercentage"] * 100000000) + this.data["ratePerSecond"];

        this.data["rollingCountTimeout"] = _getMetricValue(jsonData, this.circuitKey + ".rollingCountTimeout", 0);
        var rollingCountThreadPoolRejected =
            _getMetricValue(jsonData, this.circuitKey + ".rollingCountThreadPoolRejected", -20);

        if (rollingCountThreadPoolRejected === -20) {
            this.data["rollingCountSemaphoreRejected"] =
                _getMetricValue(jsonData, this.circuitKey + ".rollingCountSemaphorePoolRejected", 0);
        } else {
            this.data["rollingCountThreadPoolRejected"] = rollingCountThreadPoolRejected;
        }

        this.data["rollingCountFailure"] = _getMetricValue(jsonData, this.circuitKey + ".rollingCountFailure", 0);
        this.data["rollingCountSuccess"] =
            _getMetricValue(jsonData, this.circuitKey + ".rollingCountSuccess", 0);
        this.data["rollingCountShortCircuited"] =
            _getMetricValue(jsonData, this.circuitKey + ".rollingCountShortCircuited", 0);
        this.data["rollingCountBadRequests"] =
            _getMetricValue(jsonData, this.circuitKey + ".rollingCountBadRequests", 0);

        this.data["reportingHosts"] = _getMetricValue(jsonData, this.circuitKey + ".reportingHosts", 1);
        this.data["latency90"] = _getMetricValue(jsonData, this.circuitKey + ".90", 0);
        this.data["latencyMedian"] = _getMetricValue(jsonData, this.circuitKey + ".50", 0);
        this.data["latency99"] = _getMetricValue(jsonData, this.circuitKey + ".99", 0);
        this.data["latencyMean"] = _getMetricValue(jsonData, this.circuitKey + ".latencyExecute_mean", 0);
        this.data["latency995"] = _getMetricValue(jsonData, this.circuitKey + ".99.5", 0);
    };
}

HV.sortByVolume = function () {
    var direction = "desc";
    if (_circuitSortedBy == 'rate_desc') {
        direction = 'asc';
    }
    _sortByVolumeInDirection(direction);
};

function _sortByVolumeInDirection(direction) {
    var $monitors = $('#' + "dependencies" + ' div.monitor');
    _circuitSortedBy = 'rate_' + direction;
    $monitors.tsort({order: direction, attr: 'rate_value'});
}

HV.sortByError = function () {
    var direction = "desc";
    if (_circuitSortedBy == 'error_desc') {
        direction = 'asc';
    }
    _sortByErrorInDirection(direction);
};

function _sortByErrorInDirection(direction) {
    var $monitors = $('#' + "dependencies" + ' div.monitor');
    _circuitSortedBy = 'error_' + direction;
    $monitors.tsort(".errorPercentage .value", {order: direction});
}

HV.sortByErrorThenVolume = function () {
    var direction = "desc";
    if (_circuitSortedBy == 'error_then_volume_desc') {
        direction = 'asc';
    }
    _sortByErrorThenVolumeInDirection(direction);
};

function _sortByErrorThenVolumeInDirection(direction) {
    var $monitors = $('#' + "dependencies" + ' div.monitor');
    _circuitSortedBy = 'error_then_volume_' + direction;
    $monitors.tsort({order: direction, attr: 'error_then_volume'});
}

HV.sortAlphabetically = function () {
    var direction = "asc";
    if (_circuitSortedBy == 'alph_asc') {
        direction = 'desc';
    }
    _sortAlphabeticalInDirection(direction);
};

function _sortAlphabeticalInDirection(direction) {
    var $monitors = $('#' + "dependencies" + ' div.monitor');
    _circuitSortedBy = 'alph_' + direction;
    $monitors.tsort("p.name", {order: direction});
}

HV.sortByLatency90 = function () {
    var direction = "desc";
    if (_circuitSortedBy == 'lat90_desc') {
        direction = 'asc';
    }
    _circuitSortedBy = 'lat90_' + direction;
    this.sortByMetricInDirection(direction, ".latency90 .value");
};

HV.sortByLatency99 = function () {
    var direction = "desc";
    if (_circuitSortedBy == 'lat99_desc') {
        direction = 'asc';
    }
    _circuitSortedBy = 'lat99_' + direction;
    this.sortByMetricInDirection(direction, ".latency99 .value");
};

HV.sortByLatency995 = function () {
    var direction = "desc";
    if (_circuitSortedBy == 'lat995_desc') {
        direction = 'asc';
    }
    _circuitSortedBy = 'lat995_' + direction;
    this.sortByMetricInDirection(direction, ".latency995 .value");
};

HV.sortByLatencyMean = function () {
    var direction = "desc";
    if (_circuitSortedBy == 'latMean_desc') {
        direction = 'asc';
    }
    _circuitSortedBy = 'latMean_' + direction;
    this.sortByMetricInDirection(direction, ".latencyMean .value");
};

HV.sortByLatencyMedian = function () {
    var direction = "desc";
    if (_circuitSortedBy == 'latMedian_desc') {
        direction = 'asc';
    }
    _circuitSortedBy = 'latMedian_' + direction;
    this.sortByMetricInDirection(direction, ".latencyMedian .value");
};

HV.sortByMetricInDirection = function (direction, metric) {
    var $monitors = $('#' + "dependencies" + ' div.monitor');
    $monitors.tsort(metric, {order: direction});
};