/**
 * Copyright [2016] [Indra Basak]
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
 * hystrixViewer is used for viewing Drop Wizard metrics as line charts. The charts
 * are based on MetricsGraphics.js library. Here is an example, on how to use the library.
 * <p/>
 * <pre>
 *   //create different charts
 *   hystrixViewer.addCounter("#my-div-counter", "Counter Example Title",
 *       "Counter Example Description", "counter.test.metric.a");
 *
 *   hystrixViewer.addMultiCounter("#my-div-multi-counter", "Counter Example Title",
 *       "Counter Example Description", ["counter.test.metric.a", "counter.test.metric.b"]);
 *
 *   hystrixViewer.addGauge("#my-div-gauge", "Gauge Example Title",
 *       "Gauge Example Description", "gauge.test.metric.a");
 *
 *   hystrixViewer.addMultiGauge("#my-div-multi-gauge", "Gauge Example Title",
 *       "Gauge Example Description", ["gauge.test.metric.a", "gauge.test.metric.b"]);
 *
 *   hystrixViewer.addMeter("#my-div-meter", "Meter Example Title",
 *       "Meter Example Description", "meter.test.metric.a");
 *
 *   hystrixViewer.addTimer("#my-div-timer", "Timer Example",
 *       "Timer Example Description", "timer.test.metric.a");
 *
 *   hystrixViewer.addJvm("#my-div-jvm", "JVM Example Title", "JVM Example Description");
 *
 *   //initialize the metric viewer before displaying for the first time
 *   hystrixViewer.init();
 *
 *   //refreshing the metric viewer with new metric data
 *   hystrixViewer.refresh(data);
 * </pre>
 *
 * @author Indra Basak
 * @since November 2016
 */

(function (hystrixViewer, $, d3) {
    'use strict';

    /**
     * Create a metric viewer to display a metric of type 'counter'.
     *
     * @param {string} divId the id of the HTML division tag where the metric chart will be displayed
     * @param {string} title the title of the chart
     * @param {string} description the description of the chart
     * @param {string} metricName the qualified name of the metric
     */
    hystrixViewer.addCounter = function (divId, title, description, metricName) {
        var legend = [];
        legend.push(new LegendData(metricName, "count", null, null));
        graphs.push(addGraph(divId, "counter", METRIC_TYPE.COUNTER, metricName, title,
            description, legend, METRIC_TYPE.COUNTER.xLabel, METRIC_TYPE.COUNTER.yLabel,
            null, false));
    };

    /**
     * Creates a metric viewer to display multiple metrics of type 'counter'
     *
     * @param {string} divId the id of the HTML division tag where the metric chart will be displayed
     * @param {string} title the title of the chart
     * @param {string} description the description of the chart
     * @param {Array.<string>} metricNames an array of qualified metric names
     */
    hystrixViewer.addMultiCounter = function (divId, title, description, metricNames) {
        if (metricNames.constructor !== Array || !metricNames.length) {
            return;
        }

        var legend = [];
        for (var i = 0; i < metricNames.length; i++) {
            legend.push(new LegendData(metricNames[i], "count", metricNames[i], null));
        }

        graphs.push(addGraph(divId, "counter", METRIC_TYPE.COUNTER, "metricName", title,
            description, legend, METRIC_TYPE.COUNTER.xLabel, METRIC_TYPE.COUNTER.yLabel,
            null, true));
    };

    /**
     * Create a metric viewer to display a metric of type 'gauge'.
     *
     * @param {string} divId the id of the HTML division tag where the metric chart will be displayed
     * @param {string} title the title of the chart
     * @param {string} description the description of the chart
     * @param {string} metricName the qualified name of the metric
     */
    hystrixViewer.addGauge = function (divId, title, description, metricName) {
        var legend = [];
        legend.push(new LegendData(metricName, "value", null, null));
        graphs.push(addGraph(divId, "gauge", METRIC_TYPE.GAUGE, metricName, title,
            description, legend, METRIC_TYPE.GAUGE.xLabel, METRIC_TYPE.GAUGE.yLabel,
            null, false));
    };

    /**
     * Creates a metric viewer to display multiple metrics of type 'gauge'
     *
     * @param {string} divId the id of the HTML division tag where the metric chart will be displayed
     * @param {string} title the title of the chart
     * @param {string} description the description of the chart
     * @param {Array.<string>} metricNames an array of qualified metric names
     */
    hystrixViewer.addMultiGauge = function (divId, title, description, metricNames) {
        if (metricNames.constructor !== Array || !metricNames.length) {
            return;
        }

        var legend = [];
        for (var i = 0; i < metricNames.length; i++) {
            legend.push(new LegendData(metricNames[i], "value", metricNames[i], null));
        }

        graphs.push(addGraph(divId, "gauge", METRIC_TYPE.GAUGE, "metricName", title,
            description, legend, METRIC_TYPE.GAUGE.xLabel, METRIC_TYPE.GAUGE.yLabel,
            null, true));
    };

    /**
     * Create a metric viewer to display a metric of type 'meter'. It displays four different values in
     * one chart - 1 min rate, 5 min rate, 15 min rate, and mean rate.
     *
     * @param {string} divId the id of the HTML division tag where the metric chart will be displayed
     * @param {string} title the title of the chart
     * @param {string} description the description of the chart
     * @param {string} metricName the qualified name of the metric
     */
    hystrixViewer.addMeter = function (divId, title, description, metricName) {
        var legend = [];

        for (var key in meterLegendMap) {
            var value = meterLegendMap[key];
            legend.push(value);
        }

        graphs.push(addGraph(divId, "meter", METRIC_TYPE.METER, metricName, title,
            description, legend, METRIC_TYPE.METER.xLabel, METRIC_TYPE.METER.yLabel,
            "units", false));
    };

    /**
     * Create a metric viewer to display a metric property of type 'meter'.
     *
     * @param {string} divId the id of the HTML division tag where the metric chart will be displayed
     * @param {string} title the title of the chart
     * @param {string} description the description of the chart
     * @param {string} metricName the qualified name of the metric
     * @param {string} property the name of the metric property to be displayed, e.g., 1-min rate, 5-min rate, etc.
     */
    hystrixViewer.addMeterWithProperty = function (divId, title, description, metricName, property) {
        var data = meterLegendMap[property];
        if (data) {
            var legend = [];
            legend.push(data);

            graphs.push(addGraph(divId, "meter", METRIC_TYPE.METER, metricName, title,
                description, legend, METRIC_TYPE.METER.xLabel, METRIC_TYPE.METER.yLabel,
                "units", false));
        }
    };

    /**
     * Create a metric viewer to display a metric of type 'time'. It displays 3 line charts:
     * <li>
     *     <ol>Duration chart showing the min, mean, and max metrics</ol>
     *     <ol>Histogram chart showing the percentile metrics</ol>
     *     <ol>Frequency chart showing the rate metrics</ol>
     * </li>
     *
     * @param {string} divId the id of the HTML division tag where the metric chart will be displayed
     * @param {string} title the title of the chart
     * @param {string} description the description of the chart
     * @param {string} metricName the qualified name of the metric
     */
    hystrixViewer.addTimer = function (divId, title, description, metricName) {
        var key, value;

        var durLegend = [];
        for (key in timerDurationLegendMap) {
            value = timerDurationLegendMap[key];
            durLegend.push(value);
        }
        graphs.push(addGraph(divId, "duration", METRIC_TYPE.TIMER, metricName, title,
            description, durLegend, METRIC_TYPE.TIMER.xLabel, METRIC_TYPE.TIMER.yLabel,
            "duration_units", false));

        var histLegend = [];
        for (key in timerHistogramLegendMap) {
            value = timerHistogramLegendMap[key];
            histLegend.push(value);
        }
        graphs.push(addGraph(divId, "histogram", METRIC_TYPE.TIMER, metricName, title,
            description, histLegend, METRIC_TYPE.TIMER.xLabel, METRIC_TYPE.TIMER.yLabel,
            "duration_units", false));

        var freqLegend = [];
        for (key in timerFrequencyLegendMap) {
            value = timerFrequencyLegendMap[key];
            freqLegend.push(value);
        }
        graphs.push(addGraph(divId, "frequency", METRIC_TYPE.TIMER, metricName, title,
            description, freqLegend, METRIC_TYPE.TIMER.xLabel, METRIC_TYPE.TIMER.yLabel,
            "rate_units", false));
    };

    /**
     * Create a metric viewer to display a metric property of type 'time'.
     *
     * @param {string} divId the id of the HTML division tag where the metric chart will be displayed
     * @param {string} title the title of the chart
     * @param {string} description the description of the chart
     * @param {string} metricName the qualified name of the metric
     * @param {string} property the name of the metric property to be displayed
     */
    hystrixViewer.addTimerWithProperty = function (divId, title, description, metricName, property) {
        var data;
        var legend = [];

        if (timerDurationLegendMap[property]) {
            data = timerDurationLegendMap[property];
            legend.push(data);
            graphs.push(addGraph(divId, "duration", METRIC_TYPE.TIMER, metricName, title,
                description, legend, METRIC_TYPE.TIMER.xLabel, METRIC_TYPE.TIMER.yLabel,
                "duration_units", false));
        } else if (timerHistogramLegendMap[property]) {
            data = timerHistogramLegendMap[property];
            legend.push(data);
            graphs.push(addGraph(divId, "histogram", METRIC_TYPE.TIMER, metricName, title,
                description, legend, METRIC_TYPE.TIMER.xLabel, METRIC_TYPE.TIMER.yLabel,
                "duration_units", false));
        } else if (timerFrequencyLegendMap[property]) {
            data = timerFrequencyLegendMap[property];
            legend.push(data);
            graphs.push(addGraph(divId, "frequency", METRIC_TYPE.TIMER, metricName, title,
                description, legend, METRIC_TYPE.TIMER.xLabel, METRIC_TYPE.TIMER.yLabel,
                "rate_units", false));
        }
    };

    /**
     * Create a metric viewer to display the JVM metrics. It displays the following line charts:
     * <li>
     *     <ol>Memory usage</ol>
     *     <ol>Heap usage</ol>
     *     <ol>Eden space usage</ol>
     *     <ol>Survivor space usage</ol>
     *     <ol>Old Gen usage</ol>
     *     <ol>Thread usage </ol>
     * </li>
     *
     * @param {string} divId the id of the HTML division tag where the metric chart will be displayed
     * @param {string} title the title of the chart
     * @param {string} description the description of the chart
     */
    hystrixViewer.addJvm = function (divId, title, description) {
        var memGraphs = ["total", "heap"];
        for (var m = 0; m < memGraphs.length; m++) {
            var memLegend = [];
            memLegend.push(new LegendData(capitalizeFirstLetter(memGraphs[m]) + " Init", "value",
                "jvm.memory." + memGraphs[m] + ".init", null));
            memLegend.push(new LegendData(capitalizeFirstLetter(memGraphs[m]) + " Used", "value",
                "jvm.memory." + memGraphs[m] + ".used", null));
            memLegend.push(new LegendData(capitalizeFirstLetter(memGraphs[m]) + " Max", "value",
                "jvm.memory." + memGraphs[m] + ".max", null));
            memLegend.push(new LegendData(capitalizeFirstLetter(memGraphs[m]) + " Committed", "value",
                "jvm.memory." + memGraphs[m] + ".committed", null));
            graphs.push(addGraph(divId, memGraphs[m], METRIC_TYPE.GAUGE, "metricName", title,
                description, memLegend, METRIC_TYPE.GAUGE.xLabel, "usage", null, true));
        }

        var gcGraphs = ["Eden-Space", "Survivor-Space", "Old-Gen"];
        for (var i = 0; i < gcGraphs.length; i++) {
            var gcLegend = [];
            gcLegend.push(new LegendData(gcGraphs[i] + " Init", "value",
                "jvm.memory.pools.PS-" + gcGraphs[i] + ".init",
                "jvm.memory.pools.Par-" + gcGraphs[i] + ".init"));
            gcLegend.push(new LegendData(gcGraphs[i] + " Used", "value",
                "jvm.memory.pools.PS-" + gcGraphs[i] + ".used",
                "jvm.memory.pools.Par-" + gcGraphs[i] + ".used"));
            gcLegend.push(new LegendData(gcGraphs[i] + " Max", "value",
                "jvm.memory.pools.PS-" + gcGraphs[i] + ".max",
                "jvm.memory.pools.Par-" + gcGraphs[i] + ".max"));
            gcLegend.push(new LegendData(gcGraphs[i] + " Committed", "value",
                "jvm.memory.pools.PS-" + gcGraphs[i] + "-.committed",
                "jvm.memory.pools.Par-" + gcGraphs[i] + "-.committed"));
            graphs.push(addGraph(divId, gcGraphs[i], METRIC_TYPE.GAUGE, "metricName", title,
                description, gcLegend, METRIC_TYPE.GAUGE.xLabel, "usage", null, true));
        }

        var threadLegend = [];
        threadLegend.push(new LegendData("Daemon Threads", "value", "jvm.thread-states.daemon.count", null));
        threadLegend.push(new LegendData("Deadlocks", "value", "jvm.thread-states.deadlock.count", null));
        threadLegend.push(new LegendData("Terminated", "value", "jvm.thread-states.terminated.count", null));
        threadLegend.push(new LegendData("Timed Waiting", "value", "jvm.thread-states.timed_waiting.count", null));
        threadLegend.push(new LegendData("Blocked", "value", "jvm.thread-states.blocked.count", null));
        threadLegend.push(new LegendData("Waiting", "value", "jvm.thread-states.waiting.count", null));
        threadLegend.push(new LegendData("Runnable", "value", "jvm.thread-states.runnable.count", null));
        threadLegend.push(new LegendData("New", "value", "jvm.thread-states.new.count", null));
        graphs.push(addGraph(divId, "thread", METRIC_TYPE.GAUGE, "metricName", title,
            description, threadLegend, METRIC_TYPE.GAUGE.xLabel, "count", null, true));
    };

    //<div class="container">
    hystrixViewer.addHystrixDashboard = function (divId) {
        _hystrixDashboardDivId = divId;
        var $containerDiv = $("<div></div>").addClass('hystrix-container');
        $(_hystrixDashboardDivId).append($containerDiv);

        var $row1Div = $("<div></div>").addClass('row');
        $($containerDiv).append($row1Div);
        var $menuBar1Div = $("<div></div>").addClass('hystrix-menuBar');
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
        var date = new Date();
        for (var i = 0; i < graphs.length; i++) {
            refreshGraph(graphs[i], date, json);
        }

        if (_hystrixDashboardDivId) {
            _addHystrix(json);

            $("#" + _hystrixCircuitContainerDivId).empty();
            for (var value of _hystrixCircuitMap.values()) {
                value.refresh(json);
            }
        }
    };

    /**
     * Clears all the graphs from the metrics viewer
     */
    hystrixViewer.clear = function () {
        while (graphs.length) {
            var graph = graphs.pop();

            $(graph.divId).empty();
            delete graph.divId;

            graph.values.clear();
            delete graph.values;

            graph.legendData.clear();
            delete graph.legendData;

            graph = undefined;
        }
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
     * The width of the metric chart area
     * @type {number}
     */
    var CHART_WIDTH = 650;
    Object.freeze(CHART_WIDTH);

    /**
     * The height of the metric chart area
     * @type {number}
     */
    var CHART_HEIGHT = 250;
    Object.freeze(CHART_HEIGHT);

    /**
     * The ratio to which the height of the metric chart area needs
     * to be increased to accommodate legend area
     * @type {number}
     */
    var CHART_HEIGHT_RATIO = 1.2;
    Object.freeze(CHART_HEIGHT_RATIO);

    /**
     * Size of left margin of charge
     * @type {number}
     */
    var LEFT_MARGIN = 120;
    Object.freeze(LEFT_MARGIN);

    /**
     * Size of right margin of charge
     * @type {number}
     */
    var RIGHT_MARGIN = 90;
    Object.freeze(RIGHT_MARGIN);

    /**
     * Size of bottom margin of charge
     * @type {number}
     */
    var BOTTOM_MARGIN = 50;
    Object.freeze(BOTTOM_MARGIN);

    /**
     * Maps meter metric property to legend
     */
    var meterLegendMap = {};
    meterLegendMap["count"] = new LegendData("Count", "count", null, null);
    meterLegendMap["m1_rate"] = new LegendData("1 min", "m1_rate", null, null);
    meterLegendMap["m5_rate"] = new LegendData("5 min", "m5_rate", null, null);
    meterLegendMap["m15_rate"] = new LegendData("15 min", "m15_rate", null, null);
    meterLegendMap["mean_rate"] = new LegendData("Mean", "mean_rate", null, null);
    Object.freeze(meterLegendMap);

    /**
     * Maps timer duration metric property to legend
     */
    var timerDurationLegendMap = {};
    timerDurationLegendMap["count"] = new LegendData("Count", "count", null, null);
    timerDurationLegendMap["min"] = new LegendData("Min", "min", null, null);
    timerDurationLegendMap["mean"] = new LegendData("Mean", "mean", null, null);
    timerDurationLegendMap["max"] = new LegendData("Max", "max", null, null);
    timerDurationLegendMap["stddev"] = new LegendData("Std. dev", "stddev", null, null);
    timerDurationLegendMap["p50"] = new LegendData("Median", "p50", null, null);
    Object.freeze(timerDurationLegendMap);

    /**
     * Maps timer histogram metric property to legend
     */
    var timerHistogramLegendMap = {};
    timerHistogramLegendMap["p999"] = new LegendData("99.9%", "p999", null, null);
    timerHistogramLegendMap["p99"] = new LegendData("99%", "p99", null, null);
    timerHistogramLegendMap["p98"] = new LegendData("98%", "p98", null, null);
    timerHistogramLegendMap["p95"] = new LegendData("95%", "p95", null, null);
    timerHistogramLegendMap["p75"] = new LegendData("75%", "p75", null, null);
    Object.freeze(timerHistogramLegendMap);

    /**
     * Maps timer frequency metric property to legend
     */
    var timerFrequencyLegendMap = {};
    timerFrequencyLegendMap["m1_rate"] = new LegendData("1 min", "m1_rate", null, null);
    timerFrequencyLegendMap["m5_rate"] = new LegendData("5 min", "m5_rate", null, null);
    timerFrequencyLegendMap["m15_rate"] = new LegendData("15 min", "m15_rate", null, null);
    timerFrequencyLegendMap["mean_rate"] = new LegendData("Mean", "mean_rate", null, null);
    Object.freeze(timerFrequencyLegendMap);

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

    var _hystrixDashboardDivId;

    var _hystrixCircuitContainerDivId;

    var _hystrixCircuitMap = new Map();

    //gauge.hystrix.HystrixCommand

    var hystrixCommandMetricNames = ["0",
        "100",
        "25",
        "50",
        "75",
        "90",
        "95",
        "99",
        "99.5",
        "currentConcurrentExecutionCount",
        "errorCount",
        "errorPercentage",
        "latencyExecute_mean",
        "latencyTotal_mean",
        "propertyValue_circuitBreakerErrorThresholdPercentage",
        "propertyValue_circuitBreakerRequestVolumeThreshold",
        "propertyValue_circuitBreakerSleepWindowInMilliseconds",
        "propertyValue_executionIsolationSemaphoreMaxConcurrentRequests",
        "propertyValue_executionIsolationThreadTimeoutInMilliseconds",
        "propertyValue_executionTimeoutInMilliseconds",
        "propertyValue_fallbackIsolationSemaphoreMaxConcurrentRequests",
        "propertyValue_metricsRollingStatisticalWindowInMilliseconds",
        "reportingHosts",
        "requestCount",
        "rollingCountBadRequests",
        "rollingCountCollapsedRequests",
        "rollingCountEmit",
        "rollingCountExceptionsThrown",
        "rollingCountFailure",
        "rollingCountFallbackEmit",
        "rollingCountFallbackFailure",
        "rollingCountFallbackMissing",
        "rollingCountFallbackRejection",
        "rollingCountFallbackSuccess",
        "rollingCountResponsesFromCache",
        "rollingCountSemaphoreRejected",
        "rollingCountShortCircuited",
        "rollingCountSuccess",
        "rollingCountThreadPoolRejected",
        "rollingCountTimeout",
        "rollingMaxConcurrentExecutionCount"];
    Object.freeze(hystrixCommandMetricNames);

    /*
     gauge.hystrix.HystrixCommand.serviceA.readBooks.propertyValue_executionTimeoutInMilliseconds"
     */

    /**
     * Represents a metric data point
     * @param {Date} date the time of the metric
     * @param {number} value the value of the metric
     * @constructor
     */
    function MetricData(date, value) {
        this.date = MG.clone(date);
        //this.data = date;
        this.value = value;
    }

    /**
     * The data used to display the metric chart legend.
     *
     * @param {string} legend the name of the legend
     * @param {string} key the metric key for the metric value
     * @param {string|?} metricName the metric name if each line has a different metric source, otherwise null
     * @param {string|null} altMetricName the alternate metric if the metric name is specified. It is used for look up
     * when the metric doesn't exist for the provided metric name
     * @constructor
     */
    function LegendData(legend, key, metricName, altMetricName) {
        this.legend = legend;
        this.key = key;
        this.metricName = metricName;
        this.altMetricName = altMetricName;
    }

    var _addHystrix = function (jsonData) {
        for (var key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                if (key === METRIC_TYPE.GAUGE.type) {
                    //gauge.hystrix.HystrixCommand
                    var jsonNode = jsonData[METRIC_TYPE.GAUGE.type];
                    var circuitKey;
                    var serviceName;
                    var methodName;
                    var title;
                    $.each(jsonNode, function (key, val) {
                        if (key.startsWith("gauge.hystrix.HystrixCommand")) {
                            //"gauge.hystrix.HystrixThreadPool.serviceA.propertyValue_metricsRollingStatisticalWindowInMilliseconds"
                            //"gauge.hystrix.HystrixCommand.serviceA.readAuthors.rollingCountTimeout"
                            var tokens = key.split(".");
                            if (tokens.length == 6) {
                                circuitKey = tokens[0] + "." + tokens[1] + "." + tokens[2] + "." +
                                    tokens[3] + "." + tokens[4];
                                if (!_hystrixCircuitMap.has(circuitKey)) {
                                    serviceName = tokens[3];
                                    methodName = tokens[4];
                                    console.log(serviceName + '.' + methodName);
                                    //noinspection JSUnresolvedFunction
                                    var config = new HystrixCommandConfig(_hystrixDashboardDivId, circuitKey, serviceName, methodName);
                                    _hystrixCircuitMap.set(circuitKey, config);
                                }
                            }
                        }
                    });
                }
            }
        }
    };


    /**
     *
     * @param parentDivId
     * @param circuitKey
     * @param serviceName
     * @param methodName
     * @constructor
     */
    function HystrixCommandConfig(parentDivId, circuitKey, serviceName, methodName) {
        this.parentDivId = parentDivId;
        this.circuitDivId = undefined;
        this.circuitKey = circuitKey;
        this.serviceName = serviceName;
        this.methodName = methodName;
        this.initialized = false;
        this.chartDivId = undefined;
        this.graphDivId = undefined;
        this.jsonData = undefined;
        this.graphData = [];
        this.ratePerSecond = undefined;
        this.ratePerSecondPerHost = undefined;
        this.errorPercentage = undefined;
        // CIRCUIT_BREAKER circle visualization settings
        this.circuitCircleRadius = d3.scalePow().exponent(0.5).domain([0, 400]).range(["5", maxRadiusForCircle]); // requests per second per host
        this.circuitCircleYaxis = d3.scaleLinear().domain([0, 400]).range(["30%", maxXaxisForCircle]);
        this.circuitCircleXaxis = d3.scaleLinear().domain([0, 400]).range(["30%", maxYaxisForCircle]);
        this.circuitColorRange = d3.scaleLinear().domain([10, 25, 40, 50]).range(["green", "#FFCC00", "#FF9900", "red"]);
        this.circuitErrorPercentageColorRange = d3.scaleLinear().domain([0, 10, 35, 50]).range(["grey", "black", "#FF9900", "red"]);

        this.render = function render() {
            //if (!this.initialized) {
            this.circuitDivId = "CIRCUIT_" + this.serviceName + "_" + this.methodName;
            var $circuitDiv = $("<div></div>").attr('id', this.circuitDivId)
                .addClass('monitor').css({'position': 'relative'});
            $("#" + _hystrixCircuitContainerDivId).append($circuitDiv);

            this._addChart($circuitDiv);
            this._addTitle($circuitDiv);
            this._addData($circuitDiv);
            this._addLineGraph($circuitDiv);

            //    this.initialized = true;
            //}
        };

        this.refresh = function update(jsonData) {
            this.jsonData = jsonData;
            this.calcRatePerSecond(jsonData);
            this.render();
        };

        this._addChart = function addChart(circuitDiv) {
            this.chartDivId = "chart_CIRCUIT_" + this.serviceName + "_" + this.methodName;
            var $chartDiv = $("<div></div>").attr('id', this.chartDivId).addClass('chart')
                .css({
                    'position': 'absolute', 'top': '0px', 'left': '0', 'float': 'left',
                    'width': '100%', 'height': '100%'
                });
            circuitDiv.append($chartDiv);

            this._addCircle(this.chartDivId);
        };

        this._addCircle = function addCirle(chartDivId) {
            var svgContainer = d3.select("#" + chartDivId).append("svg:svg")
                .attr("width", "100%").attr("height", "100%");
            var circle = svgContainer.append("svg:circle");
            //circle.style("fill", "green").attr("cx", "30%").attr("cy", "30%").attr("r", 15);

            var newXaxisForCircle = this.circuitCircleXaxis(this.ratePerSecondPerHost);
            if (parseInt(newXaxisForCircle, 10) > parseInt(maxXaxisForCircle, 10)) {
                newXaxisForCircle = maxXaxisForCircle;
            }

            var newYaxisForCircle = this.circuitCircleYaxis(this.ratePerSecondPerHost);
            if (parseInt(newYaxisForCircle, 10) > parseInt(maxYaxisForCircle, 10)) {
                newYaxisForCircle = maxYaxisForCircle;
            }

            var newRadiusForCircle = this.circuitCircleRadius(this.ratePerSecondPerHost);
            if (parseInt(newRadiusForCircle, 10) > parseInt(maxRadiusForCircle, 10)) {
                newRadiusForCircle = maxRadiusForCircle;
            }

            circle.transition().duration(400).attr("cy", newYaxisForCircle)
                .attr("cx", newXaxisForCircle)
                .attr("r", newRadiusForCircle)
                .style("fill", this.circuitColorRange(this.errorPercentage));
        };

        this._addTitle = function addTitle(circuitDiv) {
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

        this._addData = function addData(chartDiv) {
            var $monitorDiv = $("<div></div>");
            $($monitorDiv).css({
                'position': 'absolute', 'top': '15px', 'opacity': '0.8',
                'background': 'white', 'width': '100%', 'height': '95%'
            });
            chartDiv.append($monitorDiv);

            var $monitorDataDiv = $("<div></div>").addClass('monitor_data');
            $monitorDiv.append($monitorDataDiv);

            this._addCounters($monitorDataDiv);
            this._addRate($monitorDataDiv);
            this._addDataTable($monitorDataDiv);
        };

        this._addCounters = function addCounters(monitorDataDiv) {
            var $countersDiv = $("<div></div>").addClass("counters");
            monitorDataDiv.append($countersDiv);

            var $errPerDiv = $("<div></div>").addClass("cell line")
                .html("<a href=\"javascript://\" title=\"Error Percentage [Timed-out + Threadpool Rejected + Failure / Total]\""
                    + "class=\"hystrix-tooltip errorPercentage\">"
                    + "<span class=\"value\">" + this.errorPercentage + "</span>%</a>");
            $countersDiv.append($errPerDiv);

            var rollingCountTimeout = getMetricValue(this.jsonData, this.circuitKey + ".rollingCountTimeout", 0);
            var rollingCountTimeoutHtml = "<a href=\"javascript://\" title=\"Timed-out Request Count\""
                + "class=\"line hystrix-tooltip timeout\">"
                + "<span class=\"value\">" + rollingCountTimeout + "</span></a>";

            var rollingCountThreadPoolRejected =
                getMetricValue(this.jsonData, this.circuitKey + ".rollingCountThreadPoolRejected", -20);

            var rollingCountPoolRejectedHtml;
            if (rollingCountThreadPoolRejected === -20) {
                var rollingCountSemaphoreRejected =
                    getMetricValue(this.jsonData, this.circuitKey + ".rollingCountSemaphoreRejected", 0);
                rollingCountPoolRejectedHtml = "<a href=\"javascript://\" title=\"Semaphore Rejected Request Count\""
                    + "class=\"line hystrix-tooltip rejected\">"
                    + "<span class=\"value\">" + rollingCountSemaphoreRejected + "</span></a>";
            } else {
                rollingCountPoolRejectedHtml = "<a href=\"javascript://\" title=\"Threadpool Rejected Request Count\""
                    + "class=\"line hystrix-tooltip rejected\">"
                    + "<span class=\"value\">" + rollingCountThreadPoolRejected + "</span></a>";
            }

            var rollingCountFailure = getMetricValue(this.jsonData, this.circuitKey + ".rollingCountFailure", 0);
            var rollingCountFailureHtml = "<a href=\"javascript://\" title=\"Failure Request Count\""
                + "class=\"line hystrix-tooltip failure\">"
                + "<span class=\"value\">" + rollingCountFailure + "</span></a>";

            var $sec1Div = $("<div></div>").addClass("cell borderRight")
                .html(rollingCountTimeoutHtml + "\n" + rollingCountPoolRejectedHtml + "\n"
                    + rollingCountFailureHtml);
            $countersDiv.append($sec1Div);

            var rollingCountSuccess =
                getMetricValue(this.jsonData, this.circuitKey + ".rollingCountSuccess", 0);
            var rollingCountSuccessHtml = "<a href=\"javascript://\" title=\"Successful Request Count\""
                + "class=\"line hystrix-tooltip success\">"
                + "<span class=\"value\">" + rollingCountSuccess + "</span></a>";

            var rollingCountShortCircuited =
                getMetricValue(this.jsonData, this.circuitKey + ".rollingCountShortCircuited", 0);
            var rollingCountShortCircuitedHtml = "<a href=\"javascript://\" title=\"Short-circuited Request Count\""
                + "class=\"line hystrix-tooltip shortCircuited\">"
                + "<span class=\"value\">" + rollingCountShortCircuited + "</span></a>";

            var rollingCountBadRequests =
                getMetricValue(this.jsonData, this.circuitKey + ".rollingCountBadRequests", 0);
            var rollingCountBadRequestsHtml = "<a href=\"javascript://\" title=\"Bad Request Count\""
                + "class=\"line hystrix-tooltip badRequest\">"
                + "<span class=\"value\">" + rollingCountBadRequests + "</span></a>";

            var $sec2Div = $("<div></div>").addClass("cell borderRight")
                .html(rollingCountSuccessHtml + "\n" + rollingCountShortCircuitedHtml + "\n"
                    + rollingCountBadRequestsHtml);
            $countersDiv.append($sec2Div);
        };

        this._addRate = function addRate(monitorDataDiv) {
            var ratePerSecondPerHostHtml = "<a href=\"javascript://\" title=\"Total Request Rate per Second per Reporting Host\""
                + "class=\"hystrix-tooltip rate\">"
                + "<span class=\"smaller\">Host: </span>"
                + "<span class=\"ratePerSecondPerHost\">"
                + this.ratePerSecondPerHost + "</span>/s</a>";

            var $rate1Div = $("<div></div>").addClass("rate")
                .html(ratePerSecondPerHostHtml);
            monitorDataDiv.append($rate1Div);

            var ratePerSecondPerClusterHtml = "<a href=\"javascript://\" title=\"Total Request Rate per Second for Cluster\""
                + "class=\"hystrix-tooltip rate\">"
                + "<span class=\"smaller\">Cluster: </span>"
                + "<span class=\"ratePerSecond\">"
                + this.ratePerSecond + "</span>/s</a>";

            var $rate2Div = $("<div></div>").addClass("rate")
                .html(ratePerSecondPerClusterHtml);
            monitorDataDiv.append($rate2Div);
        };

        this._addDataTable = function addDataTable(monitorDataDiv) {
            var $spacerDiv = $("<div></div>").addClass("spacer");
            monitorDataDiv.append($spacerDiv);

            var reportingHosts = getMetricValue(this.jsonData, this.circuitKey + ".reportingHosts", 1);
            var latency90 = getMetricValue(this.jsonData, this.circuitKey + ".90", 0);
            var latencyMedian = getMetricValue(this.jsonData, this.circuitKey + ".50", 0);
            var latency99 = getMetricValue(this.jsonData, this.circuitKey + ".99", 0);
            var latencyMean = getMetricValue(this.jsonData, this.circuitKey + ".latencyExecute_mean", 0);
            var latency995 = getMetricValue(this.jsonData, this.circuitKey + ".99.5", 0);

            var $monitorRow1Div = $("<div class=\"tableRow\">" +
                "<div class=\"cell header\">Hosts</div>" +
                "<div class=\"cell data\">" + reportingHosts + " </div>" +
                "<div class=\"cell header\">90th</div>" +
                "<div class=\"cell data latency90\"><span class=\"value\">" + latency90 + "</span>ms </div></div>");
            monitorDataDiv.append($monitorRow1Div);

            var $monitorRow2Div = $("<div class=\"tableRow\">" +
                "<div class=\"cell header\">Median</div>" +
                "<div class=\"cell data latencyMedian\"><span class=\"value\">" + latencyMedian + "</span>ms </div>" +
                "<div class=\"cell header\">99th</div>" +
                "<div class=\"cell data latency99\"><span class=\"value\">" + latency99 + "</span>ms </div></div>");
            monitorDataDiv.append($monitorRow2Div);

            var $monitorRow3Div = $("<div class=\"tableRow\">" +
                "<div class=\"cell header\">Mean</div>" +
                "<div class=\"cell data latencyMean\"><span class=\"value\">" + latencyMean + "</span>ms</div>" +
                "<div class=\"cell header\">99.5th</div>" +
                "<div class=\"cell data latency995\"><span class=\"value\">" + latency995 + "</span>ms</div></div>");
            monitorDataDiv.append($monitorRow3Div);
        };

        this._addLineGraph = function addLineGraph(chartDiv) {
            this.graphDivId = "graph_CIRCUIT_" + this.serviceName + "_" + this.methodName;
            var $graphDiv = $("<div></div>").attr('id', this.graphDivId).addClass('graph')
                .css({
                    'position': 'absolute', 'top': '25px', 'left': '0', 'float': 'left',
                    'width': '140px', 'height': '62px'
                });
            chartDiv.append($graphDiv);

            var svgContainer = d3.select("#" + this.graphDivId).append("svg:svg")
                .attr("width", "100%").attr("height", "100%");
            //var line = svgContainer.append("svg:path");

            var currentTimeMilliseconds = new Date().getTime();
            this.graphData.push({"v": parseFloat(this.ratePerSecond), "t": currentTimeMilliseconds});

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

            //d3.selectAll(cssTarget).attr("d", sparkline(this.graphData));
            //var line = svgContainer.append("svg:path").attr("d", sparkline(this.graphData));
            var gdata = this.graphData;
            var line = svgContainer.append("svg:path")
                .attr("d", function (d, i) {
                    return sparkline(gdata);
                });
        };

        this.calcRatePerSecond = function calcRatePerSecond(jsonData) {
            var numberSeconds =
                getMetricValue(jsonData, this.circuitKey + ".propertyValue_metricsRollingStatisticalWindowInMilliseconds", 0) / 1000;

            var totalRequests = getMetricValue(jsonData, this.circuitKey + ".requestCount", 0);
            if (totalRequests < 0) {
                totalRequests = 0;
            }

            var reportingHosts = getMetricValue(jsonData, this.circuitKey + ".reportingHosts", 0);

            this.ratePerSecond = roundNumber(totalRequests / numberSeconds);
            this.ratePerSecondPerHost = roundNumber(totalRequests / numberSeconds / reportingHosts);
            this.errorPercentage = getMetricValue(jsonData, this.circuitKey + ".errorPercentage", 0);

            //var errorPercentage =  getValue(jsonData, this.circuitKey + ".errorPercentage");
            //var ratePerSecondPerHostDisplay = ratePerSecondPerHost;
            //var errorThenVolume = isNaN( ratePerSecond )? -1: (errorPercentage * 100000000) +  this.ratePerSecond;
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

        /* private */
        function getInstanceAverage(value, reportingHosts, decimal) {
            if (decimal) {
                return roundNumber(value / reportingHosts);
            } else {
                return Math.floor(value / reportingHosts);
            }
        }

        /* private */
        function roundNumber(num) {
            var dec = 1;
            var result = Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
            var resultAsString = result.toString();
            if (resultAsString.indexOf('.') == -1) {
                resultAsString = resultAsString + '.0';
            }
            return resultAsString;
        }

        function getMetricValue(jsonRoot, metricName, defaultValue) {
            var value = defaultValue;
            if (jsonRoot[METRIC_TYPE.GAUGE.type]) {
                var metricData = jsonRoot[METRIC_TYPE.GAUGE.type][metricName];
                if (metricData) {
                    try {
                        if (metricData["value"]) {
                            value = formatNumber(metricData["value"], 4);
                        }
                    } catch (err) {
                        //do nothing
                    }
                }
            }
            return value;
        }
    }

    /**
     * The metric configuration which holds the chart properties and the data.
     *
     * @param {string} divId the id of the HTML division tag where the metric chart will be displayed
     * @param {string} childDiv the name of the child division tag which will be created dynamically. Used for displaying
     * multiple charts on a same division tag
     * @param {METRIC_TYPE} metricType the type of metric class.
     * @param {string} metricName the name of the metric
     * @param {string} title the title of the chart
     * @param {string} description the description of the chart
     * @param {Array.<Array.<MetricData>>} values an array containing the initial metric values
     * @param {Array.<LegendData>} legendData an array of legend data.
     * @param {string} x_label the label for x-axis
     * @param {string} y_label the label for y-axis
     * @param {string|null} y_label_key the key for y-axis. If the value is not null, the y-axis label will be dynamically set
     * by looking up the value in the metric node.
     * @param {boolean} ignoreMetricName if the vale is set to true, use the metric name from the legend data.
     * See @code{LegendData}.
     * @constructor
     */
    function MetricConfig(divId, childDiv, metricType, metricName, title, description, values, legendData,
                          x_label, y_label, y_label_key, ignoreMetricName) {
        this.divId = divId;
        this.childDiv = childDiv;
        this.metricType = metricType;
        this.metricName = metricName;
        this.title = title;
        this.description = description;
        this.values = values;
        this.legendData = legendData;
        this.legend = [];
        this.x_label = x_label;
        this.y_label = y_label;
        this.y_label_key = y_label_key;
        this.legendDivId = null;
        this.ignoreMetricName = ignoreMetricName;
        this.initialized = false;

        for (var i = 0; i < this.legendData.length; i++) {
            this.legend.push(this.legendData[i].legend);
        }

        /**
         * Renders the metric graph.
         */
        this.render = function render() {
            var containerId = null;
            if (!this.initialized) {
                //if the div is not initialized, create a title header
                //and add a container div with a border
                if ($(this.divId).is(':empty')) {
                    var $h3 = $('<h3>').text(this.title);
                    $(this.divId).append($h3);

                    var $hr = $('<hr>').addClass('mv-title-hr');
                    $(this.divId).append($hr);

                    //
                    containerId = getChildDivId(this.divId, "container");
                    var $containerDiv = $("<div></div>").attr('id', containerId).addClass('mv-outer');
                    $(this.divId).append($containerDiv);
                    this.divId = document.getElementById(containerId);
                } else {
                    containerId = getChildDivId(this.divId, "container");
                    this.divId = document.getElementById(containerId);
                }

                //if there is a child chart, create a separate
                //div to hold the chart
                if (this.childDiv) {
                    var childDivId = getChildDivId(this.divId, this.childDiv);
                    var $childDiv = $("<div></div>").attr('id', childDivId).addClass('mv-inner');
                    $($childDiv).css("width", CHART_WIDTH).css("height", CHART_HEIGHT * CHART_HEIGHT_RATIO);
                    $(this.divId).append($childDiv);
                    this.title = capitalizeFirstLetter(this.childDiv);

                    var chartDivId = getChildDivId(childDivId, "chart");
                    var $chartDiv = $("<div></div>").attr('id', chartDivId);
                    $($childDiv).append($chartDiv);

                    //create a legend div and make it a child
                    //of the child div. Legend div displays the
                    //legend while the chart is displayed in the child div
                    var legDivId = getChildDivId(childDivId, "legend");
                    var $legDiv = $("<div></div>").attr('id', legDivId).addClass('mv-legend');
                    $($childDiv).append($legDiv);

                    this.legendDivId = document.getElementById(legDivId);
                    this.divId = document.getElementById(chartDivId);
                }
                this.initialized = true;
            }

            $(this.divId).empty();

            //call the metric graphics to create the line chart
            MG.data_graphic({
                title: this.title,
                description: this.description,
                //animate_on_load: true,
                area: false,
                data: this.values,
                width: CHART_WIDTH,
                height: CHART_HEIGHT,
                target: this.divId,
                x_accessor: "date",
                y_accessor: "value",
                x_label: this.x_label,
                y_label: this.y_label,
                x_extended_ticks: true,
                y_extended_ticks: true,
                right: RIGHT_MARGIN,
                left: LEFT_MARGIN,
                bottom: BOTTOM_MARGIN,
                legend: this.legend,
                legend_target: this.legendDivId,
                mouseover: function (d, i) {
                    var format = d3.timeFormat("%b %d, %Y %H:%M:%S %p");
                    d3.select(this.divId + ' svg .mg-active-datapoint')
                        .text(format(d.date));
                }
            });
        };

        /**
         * Refreshes the metric graph. It is called every new metric data is received.
         * @param {string} x_label the updated x-axis label
         * @param {string} y_label the updated y-axis label
         */
        this.refresh = function update(x_label, y_label) {
            this.x_label = x_label;
            this.y_label = y_label;
            this.render();
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
            return prefix + "." + child;
        }
    }

    /**
     * Creates a new metric viewer graph and and add to graph cache.
     *
     * @param {string} divId the id of the HTML division tag where the metric chart will be displayed
     * @param {string} childDiv the name of the child division tag which will be created dynamically. Used for displaying
     * multiple charts on a same division tag
     * @param {METRIC_TYPE} metricType the type of metric class
     * @param {string} metricName the name of the metric
     * @param {string} title the title of the chart
     * @param {string} description the description of the chart
     * @param {Array.<LegendData>} legend an array of legend data.
     * @param {string} x_label the label for x-axis
     * @param {string} y_label the label for y-axis
     * @param {string|null} y_label_key the key for y-axis. If the value is not null, the y-axis label will be dynamically set
     * by looking up the value in the metric node.
     * @param {boolean} ignoreMetricName if the vale is set to true, use the metric name from the legend data.
     *
     * @returns {MetricConfig}
     */
    function addGraph(divId, childDiv, metricType, metricName, title, description, legend,
                      x_label, y_label, y_label_key, ignoreMetricName) {
        var values = [];
        for (var i = 0; i < legend.length; i++) {
            values[i] = [];
            values[i].push(new MetricData(new Date(), 0));
        }

        return new MetricConfig(divId, childDiv, metricType, metricName, title,
            description, values, legend, x_label, y_label, y_label_key, ignoreMetricName);
    }

    /**
     * Refreshes the metric viewer with new data.
     *
     * @param {MetricConfig} config representing one metric viewer chart
     * @param {Date} date the time at which the metric was received by the Metric Viewer
     * @param json the metric data in JSON format
     */
    function refreshGraph(config, date, json) {
        var metricData = null;
        var x_label = config.x_label;
        var y_label = config.y_label;

        if (config.ignoreMetricName) {
            for (var i = 0; i < config.legendData.length; i++) {
                metricData = getMetricNode(json, config.metricType.type,
                    config.legendData[i].metricName, config.legendData[i].altMetricName);

                updateMetric(metricData, config.legendData[i].key, date, config.values[i]);
            }
        } else {
            metricData = getMetricNode(json, config.metricType.type, config.metricName, null);
            for (var j = 0; j < config.legendData.length; j++) {
                updateMetric(metricData, config.legendData[j].key, date, config.values[j]);
            }

            if (metricData && config.y_label_key) {
                try {
                    y_label = metricData[config.y_label_key];
                } catch (err) {
                    //do nothing
                }
            }
        }

        config.refresh(x_label, y_label);
    }

    /**
     * Creates a metric data point and pushes into data cache of the particular metric. If the cache gets bigger than
     * QUEUE_SIZE, the old data is trimmed
     * @param metricData the metric data containing value(s)
     * @param {string} key the key of the metric
     * @param {Date} date the time at which the metric was received by the Metric Viewer
     * @param {Array.<MetricData>} container the metric data cache/array
     */
    function updateMetric(metricData, key, date, container) {
        var val = 0;
        if (metricData) {
            val = getValue(metricData, key);
        }

        var data = new MetricData(date, val);
        container.push(data);

        while (container.length > QUEUE_SIZE) {
            container.shift();
        }
    }

    /**
     * Retrieves a metric JSON node from metric JSON array
     *
     * @param jsonRoot all the metric data
     * @param {METRIC_TYPE} metricType the metric class type
     * @param {string} metricName the metric name
     * @param {string|null} altMetricName the alternate metric name
     *
     * @returns the metric JSON node
     */
    function getMetricNode(jsonRoot, metricType, metricName, altMetricName) {
        var metricNode = null;
        if (jsonRoot[metricType]) {
            metricNode = jsonRoot[metricType][metricName];
            if (!metricNode && altMetricName) {
                metricNode = jsonRoot[metricType][altMetricName];
            }
        }
        return metricNode;
    }

    /**
     * Retrieves the vale of a metric
     * @param metricData the metric JSON data
     * @param {string} key the metric key
     *
     * @returns {number} the value of the metric; zero if missing
     */
    function getValue(metricData, key) {
        var value = 0;
        try {
            if (metricData[key]) {
                value = formatNumber(metricData[key], 4);
            }
        } catch (err) {
            //do nothing
        }
        return value;
    }

    /**
     * Formats a number with the provided precision
     * @param {number} number the number to be formatted
     * @param {number} precision the number of decimal places
     * @returns {number} the formatted number
     */
    function formatNumber(number, precision) {
        if (!precision) {
            precision = 4;
        }

        var factor = Math.pow(10, precision);
        var tempNumber = number * factor;
        var roundedTempNumber = Math.round(tempNumber);

        return roundedTempNumber / factor;
    }

    /**
     * Retrieves a metric JSON node from metric JSON array
     *
     * @param jsonRoot all the metric data
     * @param {string} metricName without metric name
     *
     * @returns the metric JSON node
     */
    function getHystrixCmdNode(jsonRoot, metricName) {
        //"gauge.hystrix.HystrixCommand.serviceA.readAuthors.rollingCountSuccess"
        var metricNode = null;
        if (jsonRoot["gauges"]) {
            metricNode = jsonRoot["gauges"][metricName];
        }
        return metricNode;
    }

    /**
     * Capitalizes the first letter of a string
     * @param {string} str the string whose first letter to be capitalized
     * @returns {string} the updated string
     */
    function capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

}(window.hystrixViewer = window.hystrixViewer || {}, jQuery, d3));