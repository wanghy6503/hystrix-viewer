;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'd3'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('jquery'), require('d3'));
  } else {
    root.hystrixViewer = factory(root.jQuery, root.d3);
  }
}(this, function($, d3) {
/**
 * Copyright [2017] [Indra Basak]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

/**
 * HystrixViewer is used for viewing Hystrix DropWizard metrics. It's a port of Hystrix Dashboard.
 * Here is an example, on how to use the library.
 * <p/>
 * <pre>
 *   //create a Hystrix dashboard
 *   hystrixViewer.addHystrixDashboard('#hystrix-div');
 *
 *   //refreshing the Hetric viewer with new metric data
 *   hystrixViewer.refresh(data);
 * </pre>
 *
 * @author Indra Basak
 * @since June 2017
 */
window.hystrixViewer = {version: '1.0.0'};

/**
 * Creates a Hystrix dashboard, It displays the the following:
 * <li>
 *     <ol>Hystrix Circuit</ol>
 *     <ol>Hystrix Thread</ol>
 *     </li>
 * @param {string} divId divId the id of the HTML division tag where the Hystrix dashboard will be displayed
 */
hystrixViewer.addHystrixDashboard = function (divId) {
    _hystrixDashboardDivId = divId;

    var $outerContainerDiv = $("<div></div>").addClass('hystrix-outer-container');
    $(_hystrixDashboardDivId).append($outerContainerDiv);

    var $headerDiv = $("<div></div>").attr('id', 'hystrix-header')
        .html("<h2><span id='title_name'>Hystrix</span></h2>");
    $outerContainerDiv.append($headerDiv);

    var $containerDiv = $("<div></div>").addClass('hystrix-container');
    $outerContainerDiv.append($containerDiv);

    _createHystrixCircuitArea($containerDiv);

    var $spacerDiv = $("<div></div>").addClass("hystrix-spacer");
    $($containerDiv).append($spacerDiv);

    _createHystrixThreadPoolArea($containerDiv);
};

/**
 * Refreshes the metric view with new data. Each metric is cashed up to the 100 metric points. Older metrics are
 * removed once it reaches the threshold.
 *
 * @param {string} json the metric data in json format
 */
hystrixViewer.refresh = function (json) {
    if (_hystrixDashboardDivId) {
        _addHystrix(json);

        for (var key in _hystrixCircuitMap) {
            if (_hystrixCircuitMap.hasOwnProperty(key))
                _hystrixCircuitMap[key].refresh(json);
        }

        for (var threadkey in _hystrixThreadpoolMap) {
            if (_hystrixThreadpoolMap.hasOwnProperty(threadkey))
                _hystrixThreadpoolMap[threadkey].refresh(json);
        }
    }
};

/**
 * Clears all the charts from the hystrix viewer
 */
hystrixViewer.clear = function () {
    for (var key in _hystrixCircuitMap) {
        if (_hystrixCircuitMap.hasOwnProperty(key))
            _hystrixCircuitMap[key].clear();
    }
    _hystrixCircuitMap = {};

    for (var threadkey in _hystrixThreadpoolMap) {
        if (_hystrixThreadpoolMap.hasOwnProperty(threadkey))
            _hystrixThreadpoolMap[threadkey].clear();
    }
    _hystrixThreadpoolMap = {};
};

//////////////////////////////////////////////////////////////////////////////////////////////////
// PRIVATE FUNCTIONS
//////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Types of metrics
 * @enum {Object}
 *
 */
var METRIC_TYPE = {
    COUNTER: {type: "counters"},
    GAUGE: {type: "gauges"},
    METER: {type: "meters"},
    TIMER: {type: "timers"}
};
Object.freeze(METRIC_TYPE);

/**
 * The size of metric queue
 * @type {number}
 */
var QUEUE_SIZE = 100;
Object.freeze(QUEUE_SIZE);

var maxXaxisForCircle = "40%";
Object.freeze(maxXaxisForCircle);

var maxYaxisForCircle = "40%";
Object.freeze(maxYaxisForCircle);

var maxRadiusForCircle = "125";
Object.freeze(maxRadiusForCircle);

var _hystrixDashboardDivId;

var _hystrixCircuitContainerDivId;

var _hystrixThreadContainerDivId;

/**
 * A cache of Hystrix circuit charts
 * @type {Array}
 */
var _hystrixCircuitMap = {};

var _hystrixThreadpoolMap = {};

var _addHystrix = function (jsonData) {
    for (var key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            if (key === METRIC_TYPE.GAUGE.type) {
                var jsonNode = jsonData[METRIC_TYPE.GAUGE.type];
                $.each(jsonNode, function (key, val) {
                    _addHystrixCircuit(key);
                    _addHystrixThreadPool(key);
                });
            }
        }
    }
};

function _createHystrixCircuitArea(containerDiv) {
    var $row1Div = $("<div></div>").addClass('hystrix-row');
    $(containerDiv).append($row1Div);
    var $menuBar1Div = $("<div></div>").addClass('hystrix-menubar');
    $($row1Div).append($menuBar1Div);
    var $circuitTitleDiv = $("<div></div>").addClass('title').text("Circuit");
    $($menuBar1Div).append($circuitTitleDiv);

    var menuActionsHtml = "Sort: " +
        "<a href=\"javascript://\" onclick=\"hystrixViewer.sortByErrorThenVolume();\">Error then Volume</a> | " +
        "<a href=\"javascript://\" onclick=\"hystrixViewer.sortAlphabetically();\">Alphabetical</a> | " +
        "<a href=\"javascript://\" onclick=\"hystrixViewer.sortByVolume();\">Volume</a> | " +
        "<a href=\"javascript://\" onclick=\"hystrixViewer.sortByError();\">Error</a> | " +
        "<a href=\"javascript://\" onclick=\"hystrixViewer.sortByLatencyMean();\">Mean</a> | " +
        "<a href=\"javascript://\" onclick=\"hystrixViewer.sortByLatencyMedian();\">Median</a> | " +
        "<a href=\"javascript://\" onclick=\"hystrixViewer.sortByLatency90();\">90</a> | " +
        "<a href=\"javascript://\" onclick=\"hystrixViewer.sortByLatency99();\">99</a> | " +
        "<a href=\"javascript://\" onclick=\"hystrixViewer.sortByLatency995();\">99.5</a> ";
    var $menuActions = $("<div></div>").addClass('menu_actions').html(menuActionsHtml);
    $($menuBar1Div).append($menuActions);

    var menuLegendHtml = "<span class=\"success\">Success</span> | " +
        "<span class=\"shortCircuited\">Short-Circuited</span> | " +
        "<span class=\"badRequest\"> Bad Request</span> | " +
        "<span class=\"timeout\">Timeout</span> | " +
        "<span class=\"rejected\">Rejected</span> | " +
        "<span class=\"failure\">Failure</span> | " +
        "<span class=\"errorPercentage\">Error %</span>";
    var $menuLegend = $("<div></div>").addClass('menu_legend').html(menuLegendHtml);
    $($menuBar1Div).append($menuLegend);

    _hystrixCircuitContainerDivId = "dependencies";
    var $circuitContainerDiv = $("<div></div>").attr('id', _hystrixCircuitContainerDivId)
        .addClass('hystrix-row').addClass('dependencies');
    $(containerDiv).append($circuitContainerDiv);
}

function _createHystrixThreadPoolArea(containerDiv) {
    var $row2Div = $("<div></div>").addClass('hystrix-row');
    $(containerDiv).append($row2Div);
    var $menuBar2Div = $("<div></div>").addClass('hystrix-menubar');
    $($row2Div).append($menuBar2Div);
    var $threadTitleDiv = $("<div></div>").addClass('title').text("Thread Pools");
    $($menuBar2Div).append($threadTitleDiv);

    var menuActionsHtml = "Sort: " +
        "<a href=\"javascript://\" onclick=\"hystrixViewer.sortThreadpoolAlphabetically();\">Alphabetical</a> | " +
        "<a href=\"javascript://\" onclick=\"hystrixViewer.sortThreadpoolByVolume();\">Volume</a>";
    var $menuActions = $("<div></div>").addClass('menu_actions').html(menuActionsHtml);
    $($menuBar2Div).append($menuActions);

    _hystrixThreadContainerDivId = "dependencyThreadPools";
    var $threadContainerDiv = $("<div></div>").attr('id', _hystrixThreadContainerDivId)
        .addClass('hystrix-row').addClass('dependencyThreadPools');
    $(containerDiv).append($threadContainerDiv);
}

/**
 * Adds a Hystrix circuit chart
 * @param {string} metricName name of metric,
 * e.g., 'gauge.hystrix.HystrixCommand.serviceA.readAuthors.rollingCountTimeout'
 * @private
 */
function _addHystrixCircuit(metricName) {
    if (metricName.startsWith("gauge.hystrix.HystrixCommand")) {
        var tokens = metricName.split(".");
        if (tokens.length == 6) {
            var key = tokens[0] + "." + tokens[1] + "." + tokens[2] + "." +
                tokens[3] + "." + tokens[4];
            if (!_hystrixCircuitMap[key]) {
                var config = new HystrixCommandConfig(_hystrixCircuitContainerDivId, key, tokens[3], tokens[4]);
                _hystrixCircuitMap[key] = config;
            }
        }
    }
}

function _addHystrixThreadPool(metricName) {
    if (metricName.startsWith("gauge.hystrix.HystrixThreadPool")) {
        var tokens = metricName.split(".");
        if (tokens.length == 5) {
            var key = tokens[0] + "." + tokens[1] + "." + tokens[2] + "." +
                tokens[3];
            if (!_hystrixThreadpoolMap[key]) {
                var config = new HystrixThreadpoolConfig(_hystrixThreadContainerDivId, key, tokens[3]);
                _hystrixThreadpoolMap[key] = config;
            }
        }
    }
}

function _getMetricValue(jsonRoot, metricName, defaultValue) {
    var value = defaultValue;
    if (jsonRoot[METRIC_TYPE.GAUGE.type]) {
        var metricData = jsonRoot[METRIC_TYPE.GAUGE.type][metricName];
        if (metricData) {
            try {
                if (metricData["value"]) {
                    value = _formatNumber(metricData["value"], 4);
                }
            } catch (err) {
                //do nothing
            }
        }
    }
    return value;
}

/* private */
function _roundNumber(num) {
    var dec = 1;
    var result = Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
    var resultAsString = result.toString();
    if (resultAsString.indexOf('.') == -1) {
        resultAsString = resultAsString + '.0';
    }
    return resultAsString;
}

/**
 * Formats a number with the provided precision
 * @param {number} number the number to be formatted
 * @param {number} precision the number of decimal places
 * @returns {number} the formatted number
 */
function _formatNumber(number, precision) {
    if (!precision) {
        precision = 4;
    }

    var factor = Math.pow(10, precision);
    var tempNumber = number * factor;
    var roundedTempNumber = Math.round(tempNumber);

    return roundedTempNumber / factor;
}
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

hystrixViewer.sortByVolume = function () {
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

hystrixViewer.sortByError = function () {
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

hystrixViewer.sortByErrorThenVolume = function () {
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

hystrixViewer.sortAlphabetically = function () {
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

hystrixViewer.sortByLatency90 = function () {
    var direction = "desc";
    if (_circuitSortedBy == 'lat90_desc') {
        direction = 'asc';
    }
    _circuitSortedBy = 'lat90_' + direction;
    this.sortByMetricInDirection(direction, ".latency90 .value");
};

hystrixViewer.sortByLatency99 = function () {
    var direction = "desc";
    if (_circuitSortedBy == 'lat99_desc') {
        direction = 'asc';
    }
    _circuitSortedBy = 'lat99_' + direction;
    this.sortByMetricInDirection(direction, ".latency99 .value");
};

hystrixViewer.sortByLatency995 = function () {
    var direction = "desc";
    if (_circuitSortedBy == 'lat995_desc') {
        direction = 'asc';
    }
    _circuitSortedBy = 'lat995_' + direction;
    this.sortByMetricInDirection(direction, ".latency995 .value");
};

hystrixViewer.sortByLatencyMean = function () {
    var direction = "desc";
    if (_circuitSortedBy == 'latMean_desc') {
        direction = 'asc';
    }
    _circuitSortedBy = 'latMean_' + direction;
    this.sortByMetricInDirection(direction, ".latencyMean .value");
};

hystrixViewer.sortByLatencyMedian = function () {
    var direction = "desc";
    if (_circuitSortedBy == 'latMedian_desc') {
        direction = 'asc';
    }
    _circuitSortedBy = 'latMedian_' + direction;
    this.sortByMetricInDirection(direction, ".latencyMedian .value");
};

hystrixViewer.sortByMetricInDirection = function (direction, metric) {
    var $monitors = $('#' + "dependencies" + ' div.monitor');
    $monitors.tsort(metric, {order: direction});
};

var maxDomain = 2000;
Object.freeze(maxDomain);

var threadPoolCircleRadius = d3.scalePow().exponent(0.5).domain([0, maxDomain]).range(["5", maxRadiusForCircle]); // requests per second per host
var threadPoolCircleYaxis = d3.scaleLinear().domain([0, maxDomain]).range(["30%", maxXaxisForCircle]);
var threadPoolCircleXaxis = d3.scaleLinear().domain([0, maxDomain]).range(["30%", maxYaxisForCircle]);
var threadPoolColorRange = d3.scaleLinear().domain([10, 25, 40, 50]).range(["green", "#FFCC00", "#FF9900", "red"]);
var threadPoolErrorPercentageColorRange = d3.scaleLinear().domain([0, 10, 35, 50]).range(["grey", "black", "#FF9900", "red"]);

// default sort type and direction
var _threadPoolSortedBy = 'alph_asc';

/**
 *
 * Hystrix thread pool configuration which holds the threadpool chart properties and the data.
 *
 * @param {string} parentDivId div id of parent container
 * @param {string} circuitKey metric prefix for retrieving the individual metric data from metric JSON array.
 * @param {string} serviceName name of the service name which generates the Hystrix metrics
 * @constructor
 */
function HystrixThreadpoolConfig(parentDivId, circuitKey, serviceName) {
    this.parentDivId = parentDivId;
    this.circuitKey = circuitKey;
    this.serviceName = serviceName;
    this.data = {};
    this.initialized = false;
    this.threadDivId = "THREAD_POOL_" + this.serviceName;
    this.chartDivId = "chart_THREAD_POOL_" + this.serviceName;
    this.dataDivId = this.chartDivId + "_monitor_data";

    this.refresh = function update(jsonData) {
        this.preProcessData(jsonData);
        this.render();
        this.updateCircle();
        this.updateData();
    };

    this.render = function render() {
        if (!this.initialized) {
            var $parentDiv = $("#" + this.parentDivId);

            var $threadDiv = $("<div></div>").attr('id', this.threadDivId)
                .addClass('monitor').css({'position': 'relative'});
            $parentDiv.append($threadDiv);

            this.addChart($threadDiv);
            this.addTitle($threadDiv);
            this.addData($threadDiv);

            this.initialized = true;
        }
    };

    this.clear = function() {
        $(this.threadDivId).empty();
        delete this.threadDivId;

        $(this.chartDivId).empty();
        delete this.chartDivId;

        $(this.dataDivId).empty();
        delete this.dataDivId;

        delete this.data;
    };

    this.addChart = function addChart(threadDiv) {
        var $chartDiv = $("<div></div>").attr('id', this.chartDivId).addClass('chart')
            .css({
                'position': 'absolute', 'top': '0px', 'left': '0', 'float': 'left',
                'width': '100%', 'height': '100%'
            });
        threadDiv.append($chartDiv);

        this.addCircle(this.chartDivId);
    };

    this.addCircle = function addCirle(chartDivId) {
        var svgContainer = d3.select("#" + chartDivId).append("svg:svg")
            .attr("width", "100%").attr("height", "100%");
        var circle = svgContainer.append("svg:circle");
        circle.style("fill", "green").attr("cx", "30%").attr("cy", "30%").attr("r", 5);
    };

    this.updateCircle = function updateCircle() {
        var newXaxisForCircle = threadPoolCircleXaxis(this.data["ratePerSecondPerHost"]);
        if (parseInt(newXaxisForCircle) > parseInt(maxXaxisForCircle)) {
            newXaxisForCircle = maxXaxisForCircle;
        }

        var newYaxisForCircle = threadPoolCircleYaxis(this.data["ratePerSecondPerHost"]);
        if (parseInt(newYaxisForCircle) > parseInt(maxYaxisForCircle)) {
            newYaxisForCircle = maxYaxisForCircle;
        }

        var newRadiusForCircle = threadPoolCircleRadius(this.data["ratePerSecondPerHost"]);
        if (parseInt(newRadiusForCircle) > parseInt(maxRadiusForCircle)) {
            newRadiusForCircle = maxRadiusForCircle;
        }

        d3.selectAll("#" + this.chartDivId + " circle")
            .transition()
            .duration(400)
            .attr("cy", newYaxisForCircle)
            .attr("cx", newXaxisForCircle)
            .attr("r", newRadiusForCircle)
            .style("fill", threadPoolColorRange(this.data["errorPercentage"]));
    };

    this.addTitle = function addTitle(threadDiv) {
        var html = "<p class=\"name\"" + this.serviceName + ">" + this.serviceName + "</p>";
        var $titleDiv = $("<div></div>")
            .css({
                'position': 'absolute', 'top': '0px',
                'width': '100%', 'height': '15px', 'opacity': '0.8', 'background': 'white'
            })
            .html(html);
        threadDiv.append($titleDiv);
    };

    this.addData = function addData(threadDiv) {
        var $monitorDiv = $("<div></div>");
        $($monitorDiv).css({
            'position': 'absolute', 'top': '15px', 'opacity': '0.8',
            'background': 'white', 'width': '100%', 'height': '95%'
        });
        threadDiv.append($monitorDiv);

        var $monitorDataDiv = $("<div></div>")
            .attr('id', this.dataDivId)
            .addClass('monitor_data');
        $monitorDiv.append($monitorDataDiv);
    };

    this.updateData = function updateData() {
        if (this.initialized) {
            var $monitorDataDiv = $("#" + this.dataDivId);
            $monitorDataDiv.empty();
            var $spacerDiv = $("<div></div>").addClass("spacer");
            $monitorDataDiv.append($spacerDiv);

            this.addRate($monitorDataDiv);
            this.addDataTable($monitorDataDiv);
        }
    };

    this.addRate = function addRate(monitorDataDiv) {
        var ratePerSecondPerHostHtml = "<a href=\"javascript://\" title=\"Total Execution Rate per Second per Reporting Host\""
            + " class=\"hystrix-tooltip rate\">"
            + "<span class=\"smaller\">Host: </span>"
            + "<span class=\"ratePerSecondPerHost\">"
            + this.data["ratePerSecondPerHost"] + "</span>/s</a>";

        var $rate1Div = $("<div></div>").addClass("rate")
            .html(ratePerSecondPerHostHtml);
        monitorDataDiv.append($rate1Div);

        var ratePerSecondPerClusterHtml = "<a href=\"javascript://\" title=\"Total Execution Rate per Second for Cluster\""
            + " class=\"hystrix-tooltip rate\">"
            + "<span class=\"smaller\">Cluster: </span>"
            + "<span class=\"ratePerSecond\">"
            + this.data["ratePerSecond"] + "</span>/s</a>";

        var $rate2Div = $("<div></div>").addClass("rate")
            .html(ratePerSecondPerClusterHtml);
        monitorDataDiv.append($rate2Div);
    };

    this.addDataTable = function addDataTable(monitorDataDiv) {
        var $spacerDiv = $("<div></div>").addClass("spacer");
        monitorDataDiv.append($spacerDiv);

        var $monitorRow1Div = $("<div class=\"tableRow\">" +
            "<div class=\"hystrix-cell hystrix-header hystrix-left\">Active</div>" +
            "<div class=\"hystrix-cell hystrix-data hystrix-left\">" + this.data["currentActiveCount"] + " </div>" +
            "<div class=\"hystrix-cell hystrix-header hystrix-right\">Max Active</div>" +
            "<div class=\"hystrix-cell hystrix-data hystrix-right\">" + this.data["rollingMaxActiveThreads"] + "</div></div>");
        monitorDataDiv.append($monitorRow1Div);

        var $monitorRow2Div = $("<div class=\"tableRow\">" +
            "<div class=\"hystrix-cell hystrix-header hystrix-left\">Queued</div>" +
            "<div class=\"hystrix-cell hystrix-data hystrix-left\"><span class=\"value\">" + this.data["currentQueueSize"] + "</span>ms </div>" +
            "<div class=\"hystrix-cell hystrix-header hystrix-right\">Executions</div>" +
            "<div class=\"hystrix-cell hystrix-data hystrix-right\"><span class=\"value\">" + this.data["rollingCountThreadsExecuted"] + "</span>ms </div></div>");
        monitorDataDiv.append($monitorRow2Div);

        var $monitorRow3Div = $("<div class=\"tableRow\">" +
            "<div class=\"hystrix-cell hystrix-header hystrix-left\">Pool Size</div>" +
            "<div class=\"hystrix-cell hystrix-data hystrix-left\"><span class=\"value\">" + this.data["currentPoolSize"] + "</span>ms</div>" +
            "<div class=\"hystrix-cell hystrix-header hystrix-right\">Queue Size</div>" +
            "<div class=\"hystrix-cell hystrix-data hystrix-right\"><span class=\"value\">" + this.data["propertyValue_queueSizeRejectionThreshold"] + "</span>ms</div></div>");
        monitorDataDiv.append($monitorRow3Div);
    };

    this.preProcessData = function preProcessData(jsonData) {
        this.data = {};
        var reportingHosts = _getMetricValue(jsonData, this.circuitKey + ".reportingHosts", 1);
        this.data["reportingHosts"] = reportingHosts;

        var propertyValue_queueSizeRejectionThreshold =
            _getMetricValue(jsonData, this.circuitKey + ".propertyValue_queueSizeRejectionThreshold", 0);
        this.data["propertyValue_queueSizeRejectionThreshold"] =
            _roundNumber(propertyValue_queueSizeRejectionThreshold / reportingHosts);

        var propertyValue_metricsRollingStatisticalWindowInMilliseconds =
            _getMetricValue(jsonData, this.circuitKey + ".propertyValue_metricsRollingStatisticalWindowInMilliseconds", 0);
        this.data["propertyValue_metricsRollingStatisticalWindowInMilliseconds"] =
            _roundNumber(propertyValue_metricsRollingStatisticalWindowInMilliseconds / reportingHosts);

        var numberSeconds = this.data["propertyValue_metricsRollingStatisticalWindowInMilliseconds"] / 1000;

        var totalThreadsExecuted = _getMetricValue(jsonData, this.circuitKey + ".rollingCountThreadsExecuted", 1);
        if (totalThreadsExecuted < 0) {
            totalThreadsExecuted = 0;
        }

        this.data["ratePerSecond"] = _roundNumber(totalThreadsExecuted / numberSeconds);
        this.data["ratePerSecondPerHost"] = _roundNumber(totalThreadsExecuted / numberSeconds / reportingHosts);

        this.data["currentActiveCount"] =
            _getMetricValue(jsonData, this.circuitKey + ".currentActiveCount", 1);
        this.data["rollingMaxActiveThreads"] =
            _getMetricValue(jsonData, this.circuitKey + ".rollingMaxActiveThreads", 1);
        this.data["currentQueueSize"] =
            _getMetricValue(jsonData, this.circuitKey + ".currentQueueSize", 1);
        this.data["rollingCountThreadsExecuted"] =
            _getMetricValue(jsonData, this.circuitKey + ".rollingCountThreadsExecuted", 1);
        this.data["currentPoolSize"] =
            _getMetricValue(jsonData, this.circuitKey + ".currentPoolSize", 1);
        this.data["propertyValue_queueSizeRejectionThreshold"] =
            _getMetricValue(jsonData, this.circuitKey + ".propertyValue_queueSizeRejectionThreshold", 1);
    };
}

hystrixViewer.sortThreadpoolAlphabetically = function () {
    var direction = "asc";
    if(_threadPoolSortedBy == 'alph_asc') {
        direction = 'desc';
    }
    _sortThreadpoolAlphabeticalInDirection(direction);
};

function _sortThreadpoolAlphabeticalInDirection (direction) {
    var $monitors = $('#' + "dependencyThreadPools" + ' div.monitor');
    _threadPoolSortedBy = 'alph_' + direction;
    $monitors.tsort("p.name", {order: direction});
}

hystrixViewer.sortThreadpoolByVolume = function() {
    var direction = "desc";
    if(_threadPoolSortedBy == 'rate_desc') {
        direction = 'asc';
    }
    _sortThreadpoolByVolumeInDirection(direction);
};

function _sortThreadpoolByVolumeInDirection (direction) {
    var $monitors = $('#' + "dependencyThreadPools" + ' div.monitor');
    _threadPoolSortedBy = 'rate_' + direction;
    $monitors.tsort({order: direction, attr: 'rate_value'});
}

function _sortThreadpoolByMetricInDirection (direction, metric) {
    var $monitors = $('#' + "dependencyThreadPools" + ' div.monitor');
    $monitors.tsort(metric, {order: direction});
}

// this method is for when new divs are added to cause the elements to be sorted to whatever the user last chose
function _sortThreadpoolSameAsLast() {
    if(_threadPoolSortedBy == 'alph_asc') {
        _sortThreadpoolAlphabeticalInDirection('asc');
    } else if(_threadPoolSortedBy == 'alph_desc') {
        _sortThreadpoolAlphabeticalInDirection('desc');
    } else if(_threadPoolSortedBy == 'rate_asc') {
        _sortThreadpoolByVolumeInDirection('asc');
    } else if(_threadPoolSortedBy == 'rate_desc') {
        _sortThreadpoolByVolumeInDirection('desc');
    } else if(_threadPoolSortedBy == 'lat90_asc') {
        _sortThreadpoolByMetricInDirection('asc', 'p90');
    } else if(_threadPoolSortedBy == 'lat90_desc') {
        _sortThreadpoolByMetricInDirection('desc', 'p90');
    } else if(_threadPoolSortedBy == 'lat99_asc') {
        _sortThreadpoolByMetricInDirection('asc', 'p99');
    } else if(_threadPoolSortedBy == 'lat99_desc') {
        _sortThreadpoolByMetricInDirection('desc', 'p99');
    } else if(_threadPoolSortedBy == 'lat995_asc') {
        _sortThreadpoolByMetricInDirection('asc', 'p995');
    } else if(_threadPoolSortedBy == 'lat995_desc') {
        _sortThreadpoolByMetricInDirection('desc', 'p995');
    } else if(_threadPoolSortedBy == 'latMean_asc') {
        _sortThreadpoolByMetricInDirection('asc', 'pMean');
    } else if(_threadPoolSortedBy == 'latMean_desc') {
        _sortThreadpoolByMetricInDirection('desc', 'pMean');
    } else if(_threadPoolSortedBy == 'latMedian_asc') {
        _sortThreadpoolByMetricInDirection('asc', 'pMedian');
    } else if(_threadPoolSortedBy == 'latMedian_desc') {
        _sortThreadpoolByMetricInDirection('desc', 'pMedian');
    }
}
return hystrixViewer;
}));
