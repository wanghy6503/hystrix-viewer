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
 *   //initialize the Hystrix viewer before displaying for the first time
 *   hystrixViewer.init();
 *
 *   //refreshing the Hetric viewer with new metric data
 *   hystrixViewer.refresh(data);
 * </pre>
 *
 * @author Indra Basak
 * @since June 2017
 */

(function (hystrixViewer, $, d3) {
    'use strict';

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
        var $containerDiv = $("<div></div>").addClass('hystrix-container');
        $(_hystrixDashboardDivId).append($containerDiv);

        var $row1Div = $("<div></div>").addClass('row');
        $($containerDiv).append($row1Div);
        var $menuBar1Div = $("<div></div>").addClass('hystrix-menubar');
        $($row1Div).append($menuBar1Div);
        var $circuitTitleDiv = $("<div></div>").addClass('title').text("Circuit");
        $($menuBar1Div).append($circuitTitleDiv);

        _hystrixCircuitContainerDivId = "dependencies";
        var $circuitContainerDiv = $("<div></div>").attr('id', _hystrixCircuitContainerDivId)
            .addClass('row').addClass('dependencies');
        $row1Div.append($circuitContainerDiv);
    };

    /**
     * Initializes the metric viewer
     */
    hystrixViewer.init = function () {
        for (var i = 0; i < graphs.length; i++) {
            graphs[i].render();
        }
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
        }
    };

    /**
     * Clears all the graphs from the metrics viewer
     */
    hystrixViewer.clear = function () {
        /*        while (graphs.length) {
         var graph = graphs.pop();

         $(graph.divId).empty();
         delete graph.divId;

         graph.values.clear();
         delete graph.values;

         graph.legendData.clear();
         delete graph.legendData;

         graph = undefined;
         }*/
    };

    Array.prototype.clear = function () {
        while (this.length) {
            this.pop();
        }
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
        COUNTER: {type: "counters", xLabel: "time", yLabel: "count"},
        GAUGE: {type: "gauges", xLabel: "time", yLabel: "value"},
        METER: {type: "meters", xLabel: "time", yLabel: ""},
        TIMER: {type: "timers", xLabel: "time", yLabel: ""}
    };
    Object.freeze(METRIC_TYPE);

    /**
     * The size of metric queue
     * @type {number}
     */
    var QUEUE_SIZE = 100;
    Object.freeze(QUEUE_SIZE);

    /**
     * A cache of graph that will be displayed in a page
     * @type {Array}
     */
    var graphs = [];

    var maxXaxisForCircle = "40%";
    Object.freeze(maxXaxisForCircle);

    var maxYaxisForCircle = "40%";
    Object.freeze(maxYaxisForCircle);

    var maxRadiusForCircle = "125";
    Object.freeze(maxRadiusForCircle);

    // CIRCUIT_BREAKER circle visualization settings
    var circuitCircleRadius = d3.scalePow().exponent(0.5).domain([0, 400]).range(["5", maxRadiusForCircle]); // requests per second per host
    var circuitCircleYaxis = d3.scaleLinear().domain([0, 400]).range(["30%", maxXaxisForCircle]);
    var circuitCircleXaxis = d3.scaleLinear().domain([0, 400]).range(["30%", maxYaxisForCircle]);
    var circuitColorRange = d3.scaleLinear().domain([10, 25, 40, 50]).range(["green", "#FFCC00", "#FF9900", "red"]);
    //var circuitErrorPercentageColorRange = d3.scaleLinear().domain([0, 10, 35, 50]).range(["grey", "black", "#FF9900", "red"]);

    var _hystrixDashboardDivId;

    var _hystrixCircuitContainerDivId;

    /**
     * A cache of Hystrix circuit charts
     * @type {}
     */
    var _hystrixCircuitMap = {};

    var _addHystrix = function (jsonData) {
        for (var key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                if (key === METRIC_TYPE.GAUGE.type) {
                    var jsonNode = jsonData[METRIC_TYPE.GAUGE.type];
                    $.each(jsonNode, function (key, val) {
                        _addHystrixCircuit(key);
                    });
                }
            }
        }
    };

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
                    if (tokens.length == 6) {
                        var config = new HystrixCommandConfig(key, tokens[3], tokens[4]);
                        _hystrixCircuitMap[key] = config;
                    }
                }
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // HYSTRIX COMMAND CONFIG
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     *
     * Hystrix circuit configuration which holds the circuit chart properties and the data.
     *
     * @param {string} circuitKey metric prefix for retrieving the individual metric data from metric JSON array.
     * @param {string} serviceName name of the service name which generates the Hystrix metrics
     * @param {string} methodName corresponf method name responsible for generating Hystrix metrics
     * @constructor
     */
    function HystrixCommandConfig(circuitKey, serviceName, methodName) {
        this.circuitDivId = undefined;
        this.circuitKey = circuitKey;
        this.serviceName = serviceName;
        this.methodName = methodName;
        this.suffix = this.serviceName + "_" + this.methodName;
        this.initialized = false;
        this.chartDivId = undefined;
        this.graphDivId = undefined;
        this.jsonData = undefined;
        this.data = {};
        this.graphData = [];

        this.render = function render() {
            if (!this.initialized) {
                this.circuitDivId = "CIRCUIT_" + this.suffix;
                var $circuitDiv = $("<div></div>").attr('id', this.circuitDivId)
                    .addClass('monitor').css({'position': 'relative'});
                $("#" + _hystrixCircuitContainerDivId).append($circuitDiv);

                this.addChart($circuitDiv);
                this.addTitle($circuitDiv);
                this.addData($circuitDiv);
                this.addSparkline($circuitDiv);

                this.initialized = true;
            }
        };

        this.refresh = function update(jsonData) {
            this.jsonData = jsonData;
            this.calculateValues(jsonData);
            this.render();
            this.updateCircle();
            this.updateData();
            this.updateSparkline();
        };

        this.addChart = function addChart(circuitDiv) {
            this.chartDivId = "chart_CIRCUIT_" + this.suffix;
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
            circle.style("fill", "green").attr("cx", "30%").attr("cy", "30%").attr("r", 15);
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
            var $titleDiv = $("<div></div>")
                .css({
                    'position': 'absolute', 'top': '0px',
                    'width': '100%', 'height': '15px', 'opacity': '0.8', 'background': 'white'
                });
            circuitDiv.append($titleDiv);

            var $titleP = $("<p></p>").addClass("name")
                .text(this.serviceName + "." + this.methodName);
            $titleDiv.append($titleP);
        };

        this.addData = function addData(chartDiv) {
            var $monitorDiv = $("<div></div>");
            $($monitorDiv).css({
                'position': 'absolute', 'top': '15px', 'opacity': '0.8',
                'background': 'white', 'width': '100%', 'height': '95%'
            });
            chartDiv.append($monitorDiv);

            var $monitorDataDiv = $("<div></div>")
                .attr('id', "chart_CIRCUIT_" + this.suffix + "_monitor_data")
                .addClass('monitor_data');
            $monitorDiv.append($monitorDataDiv);
        };

        this.updateData = function updateData() {
            if (this.initialized) {
                var $monitorDataDiv = $("#" + "chart_CIRCUIT_" + this.suffix + "_monitor_data");
                $monitorDataDiv.empty();
                this.addCounters($monitorDataDiv);
                this.addRate($monitorDataDiv);
                this.addDataTable($monitorDataDiv);
            }
        };

        this.addCounters = function addCounters(monitorDataDiv) {
            var $countersDiv = $("<div></div>").addClass("counters");
            monitorDataDiv.append($countersDiv);

            var $errPerDiv = $("<div></div>").addClass("cell line")
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

            var $sec1Div = $("<div></div>").addClass("cell borderRight")
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

            var $sec2Div = $("<div></div>").addClass("cell borderRight")
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

        this.addDataTable = function addDataTable(monitorDataDiv) {
            var $spacerDiv = $("<div></div>").addClass("spacer");
            monitorDataDiv.append($spacerDiv);

            var $monitorRow1Div = $("<div class=\"tableRow\">" +
                "<div class=\"cell header\">Hosts</div>" +
                "<div class=\"cell data\">" + this.data["reportingHosts"] + " </div>" +
                "<div class=\"cell header\">90th</div>" +
                "<div class=\"cell data latency90\"><span class=\"value\">" + this.data["latency90"] + "</span>ms </div></div>");
            monitorDataDiv.append($monitorRow1Div);

            var $monitorRow2Div = $("<div class=\"tableRow\">" +
                "<div class=\"cell header\">Median</div>" +
                "<div class=\"cell data latencyMedian\"><span class=\"value\">" + this.data["latencyMedian"] + "</span>ms </div>" +
                "<div class=\"cell header\">99th</div>" +
                "<div class=\"cell data latency99\"><span class=\"value\">" + this.data["latency99"] + "</span>ms </div></div>");
            monitorDataDiv.append($monitorRow2Div);

            var $monitorRow3Div = $("<div class=\"tableRow\">" +
                "<div class=\"cell header\">Mean</div>" +
                "<div class=\"cell data latencyMean\"><span class=\"value\">" + this.data["latencyMean"] + "</span>ms</div>" +
                "<div class=\"cell header\">99.5th</div>" +
                "<div class=\"cell data latency995\"><span class=\"value\">" + this.data["latency995"] + "</span>ms</div></div>");
            monitorDataDiv.append($monitorRow3Div);
        };

        this.addSparkline = function addSparkline(chartDiv) {
            this.graphDivId = "graph_CIRCUIT_" + this.suffix;
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

        this.calculateValues = function calculateValues(jsonData) {
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

            //var errorThenVolume = isNaN( ratePerSecond )? -1: (errorPercentage * 100000000) +  this.ratePerSecond;

            this.data["rollingCountTimeout"] = _getMetricValue(this.jsonData, this.circuitKey + ".rollingCountTimeout", 0);
            var rollingCountThreadPoolRejected =
                _getMetricValue(this.jsonData, this.circuitKey + ".rollingCountThreadPoolRejected", -20);

            if (rollingCountThreadPoolRejected === -20) {
                this.data["rollingCountSemaphoreRejected"] =
                    _getMetricValue(this.jsonData, this.circuitKey + ".rollingCountSemaphorePoolRejected", 0);
            } else {
                this.data["rollingCountThreadPoolRejected"] = rollingCountThreadPoolRejected;
            }

            this.data["rollingCountFailure"] = _getMetricValue(this.jsonData, this.circuitKey + ".rollingCountFailure", 0);
            this.data["rollingCountSuccess"] =
                _getMetricValue(this.jsonData, this.circuitKey + ".rollingCountSuccess", 0);
            this.data["rollingCountShortCircuited"] =
                _getMetricValue(this.jsonData, this.circuitKey + ".rollingCountShortCircuited", 0);
            this.data["rollingCountBadRequests"] =
                _getMetricValue(this.jsonData, this.circuitKey + ".rollingCountBadRequests", 0);

            this.data["reportingHosts"] = _getMetricValue(this.jsonData, this.circuitKey + ".reportingHosts", 1);
            this.data["latency90"] = _getMetricValue(this.jsonData, this.circuitKey + ".90", 0);
            this.data["latencyMedian"] = _getMetricValue(this.jsonData, this.circuitKey + ".50", 0);
            this.data["latency99"] = _getMetricValue(this.jsonData, this.circuitKey + ".99", 0);
            this.data["latencyMean"] = _getMetricValue(this.jsonData, this.circuitKey + ".latencyExecute_mean", 0);
            this.data["latency995"] = _getMetricValue(this.jsonData, this.circuitKey + ".99.5", 0);
        };

        /**
         * Creates a child HTML division tag id from a parent diviison tag
         * @param {Object|string} parentDiv the parent division tag
         * @param {string} child the child division suffix which is appended at to the parent div id
         * @returns {string} the child div id
         */
        function getChildDivId(parentDiv, child) {
            var prefix = null;

            if (parentDiv instanceof HTMLElement) {
                prefix = parentDiv.id;
            } else {
                prefix = parentDiv;
                var indexAt0 = parentDiv.charAt(0);
                if (indexAt0 === "#") {
                    prefix = parentDiv.substring(1);
                }
            }
            return prefix + "_" + child;
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
    function _getInstanceAverage(value, reportingHosts, decimal) {
        if (decimal) {
            return _roundNumber(value / reportingHosts);
        } else {
            return Math.floor(value / reportingHosts);
        }
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

    /**
     * Capitalizes the first letter of a string
     * @param {string} str the string whose first letter to be capitalized
     * @returns {string} the updated string
     */
    function _capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

}(window.hystrixViewer = window.hystrixViewer || {}, jQuery, d3));