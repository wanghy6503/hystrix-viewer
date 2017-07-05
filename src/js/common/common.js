/**
 * Creates a Hystrix dashboard, It displays the the following:
 * <li>
 *     <ol>Hystrix Circuit</ol>
 *     <ol>Hystrix Thread</ol>
 *     </li>
 * @param {string} divId divId the id of the HTML division tag where the
 * Hystrix dashboard will be displayed
 */
hystrixViewer.addHystrixDashboard = function (divId) {
    _hystrixDashboardDivId = divId;

    var $outerContainerDiv = $("<div></div>")
        .addClass('hystrix-outer-container');
    $(_hystrixDashboardDivId).append($outerContainerDiv);

    var $headerDiv = $("<div></div>").attr('id', 'hystrix-header')
        .html("<h2><span id='title_name'>Hystrix Metrics</span></h2>");
    $outerContainerDiv.append($headerDiv);

    var $containerDiv = $("<div></div>").addClass('hystrix-container');
    $outerContainerDiv.append($containerDiv);

    _createHystrixCircuitArea($containerDiv);

    var $spacerDiv = $("<div></div>").addClass("hystrix-spacer");
    $($containerDiv).append($spacerDiv);

    _createHystrixThreadPoolArea($containerDiv);
};

/**
 * Refreshes the metric view with new data. Each metric is cashed up to the
 * 100 metric points. Older metrics are removed once it reaches the threshold.
 *
 * @param {string} json the metric data in JSON format
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

////////////////////////////////////////////////////////////////////////////
// PRIVATE FUNCTIONS & VARIABLES
////////////////////////////////////////////////////////////////////////////
/*
 * Types of metrics
 *
 * @enum {Object}
 */
var METRIC_TYPE = {
    COUNTER: {type: "counters"},
    GAUGE: {type: "gauges"},
    METER: {type: "meters"},
    TIMER: {type: "timers"}
};
Object.freeze(METRIC_TYPE);

/*
 * Flag to indicate if 'hystrix-codahale-metrics-publisher'
 * metrics are published.
 * @type {boolean} true is the 'hystrix-codahale-metrics-publisher'
 * are on, false otherwise.
 */
var _metricsPublisherOn = false;

/**
 * Maximum x-axis for circles drawn on the charts.
 * @type {string}
 */
var maxXaxisForCircle = "40%";
Object.freeze(maxXaxisForCircle);

/*
 * Maximum y-axis for circles drawn on the charts.
 * @type {string}
 */
var maxYaxisForCircle = "40%";
Object.freeze(maxYaxisForCircle);

/*
 * Maximum radius for circles drawn on the charts.
 * @type {string}
 */
var maxRadiusForCircle = "125";
Object.freeze(maxRadiusForCircle);

/*
 * Div id of the Hystrix dashboard passed on as a parameter during call to
 * 'addHystrixDashboard'
 */
var _hystrixDashboardDivId;

/*
 * Div id of the inner container holding Hytrix circuit charts.
 */
var _hystrixCircuitContainerDivId;

/*
 * Div id of the inner container holding Hytrix thread pool charts.
 */
var _hystrixThreadContainerDivId;

/*
 * An array of Hystrix Circuit charts with key:value pairs
 * @type {Array}
 * @private
 */
var _hystrixCircuitMap = {};

/*
 * An array of Hystrix Thread Pool charts with key:value pairs
 * @type {Array}
 */
var _hystrixThreadpoolMap = {};

/**
 * Adds a Hytrix circuit or thread pool chart by parsing the metric path.
 * @param jsonData metrics data in JSON format
 * @private
 */
var _addHystrix = function (jsonData) {
    for (var key in jsonData) {
        if (jsonData.hasOwnProperty(key)) {
            if (key === METRIC_TYPE.GAUGE.type) {
                var gaugeJsonNode = jsonData[METRIC_TYPE.GAUGE.type];
                $.each(gaugeJsonNode, function (key, val) { // NOSONAR
                    _addHystrixCircuit(key, gaugeJsonNode);
                    _addHystrixThreadPool(key);
                });
            }
        }
    }
};

/**
 * Creates the circuit chart area where a navigation bar and all subsequent
 * circuit charts are added.
 * @param containerDiv inner container
 * @private
 */
function _createHystrixCircuitArea(containerDiv) {
    var $row1Div = $("<div></div>").addClass('hystrix-row');
    $(containerDiv).append($row1Div);
    var $menuBar1Div = $("<div></div>").addClass('hystrix-menubar');
    $($row1Div).append($menuBar1Div);
    var $circuitTitleDiv = $("<div></div>").addClass('title').text("Circuit");
    $($menuBar1Div).append($circuitTitleDiv);

    var menuActionsHtml = "Sort: " +
        "<a href=\"javascript://\" " +
        "onclick=\"hystrixViewer.sortByErrorThenVolume();\">" +
        "Error then Volume</a> | " +
        "<a href=\"javascript://\" " +
        "onclick=\"hystrixViewer.sortAlphabetically();\">" +
        "Alphabetical</a> | " +
        "<a href=\"javascript://\" " +
        "onclick=\"hystrixViewer.sortByVolume();\">" +
        "Volume</a> | " +
        "<a href=\"javascript://\" " +
        "onclick=\"hystrixViewer.sortByError();\">" +
        "Error</a> | " +
        "<a href=\"javascript://\" " +
        "onclick=\"hystrixViewer.sortByLatencyMean();\">" +
        "Mean</a> | " +
        "<a href=\"javascript://\" " +
        "onclick=\"hystrixViewer.sortByLatencyMedian();\">Median</a> | " +
        "<a href=\"javascript://\" " +
        "onclick=\"hystrixViewer.sortByLatency90();\">90</a> | " +
        "<a href=\"javascript://\" " +
        "onclick=\"hystrixViewer.sortByLatency99();\">99</a> | " +
        "<a href=\"javascript://\" " +
        "onclick=\"hystrixViewer.sortByLatency995();\">99.5</a> ";
    var $menuActions = $("<div></div>").addClass('menu_actions')
        .html(menuActionsHtml);
    $($menuBar1Div).append($menuActions);

    var menuLegendHtml = "<span class=\"success\">Success</span> | " +
        "<span class=\"shortCircuited\">Short-Circuited</span> | " +
        "<span class=\"badRequest\"> Bad Request</span> | " +
        "<span class=\"timeout\">Timeout</span> | " +
        "<span class=\"rejected\">Rejected</span> | " +
        "<span class=\"failure\">Failure</span> | " +
        "<span class=\"errorPercentage\">Error %</span>";
    var $menuLegend = $("<div></div>").addClass('menu_legend')
        .html(menuLegendHtml);
    $($menuBar1Div).append($menuLegend);

    _hystrixCircuitContainerDivId = "dependencies";
    var $circuitContainerDiv = $("<div></div>")
        .attr('id', _hystrixCircuitContainerDivId)
        .addClass('hystrix-row').addClass('dependencies');
    $(containerDiv).append($circuitContainerDiv);
}

/**
 * Creates the thread pool chart area where a navigation bar and all subsequent
 * thread pool charts are added.
 * @param containerDiv inner container
 * @private
 */
function _createHystrixThreadPoolArea(containerDiv) {
    var $row2Div = $("<div></div>").addClass('hystrix-row');
    $(containerDiv).append($row2Div);
    var $menuBar2Div = $("<div></div>").addClass('hystrix-menubar');
    $($row2Div).append($menuBar2Div);
    var $threadTitleDiv = $("<div></div>").addClass('title').text("Thread Pools");
    $($menuBar2Div).append($threadTitleDiv);

    var menuActionsHtml = "Sort: " +
        "<a href=\"javascript://\" " +
        "onclick=\"hystrixViewer.sortThreadpoolAlphabetically();\">" +
        "Alphabetical</a> | " +
        "<a href=\"javascript://\" " +
        "onclick=\"hystrixViewer.sortThreadpoolByVolume();\">Volume</a>";
    var $menuActions = $("<div></div>").addClass('menu_actions')
        .html(menuActionsHtml);
    $($menuBar2Div).append($menuActions);

    _hystrixThreadContainerDivId = "dependencyThreadPools";
    var $threadContainerDiv = $("<div></div>")
        .attr('id', _hystrixThreadContainerDivId)
        .addClass('hystrix-row').addClass('dependencyThreadPools');
    $(containerDiv).append($threadContainerDiv);
}

/**
 * Adds a Hystrix circuit chart by parsing the metric path. Checks for
 * both hystrix metricsand metrics published by
 * 'hystrix-codahale-metrics-publisher'. If 'hystrix-codahale-metrics-publisher'
 * is on, switches over to metrics published
 * by 'hystrix-codahale-metrics-publisher'.
 *
 * @param {string} metricName name of metric,
 * e.g., 'gauge.hystrix.HystrixCommand.serviceA.readAuthors.countShortCircuited'
 * or 'serviceA.readAuthors.countShortCircuited'
 * @param {string} gaugeJsonNode gauges metric node
 * @private
 */
function _addHystrixCircuit(metricName, gaugeJsonNode) {
    var tokens, key, metricKey, knownMetricName, config;

    //metricName: gauge.hystrix.HystrixCommand.serviceA.readAuthors.countShortCircuited
    if (!_metricsPublisherOn &&
        metricName.startsWith("gauge.hystrix.HystrixCommand")) {

        tokens = metricName.split(".");
        if (tokens.length == 6) {
            //serviceA.readAuthors
            key = tokens[3] + "." + tokens[4];
            if (!_hystrixCircuitMap[key]) {
                //metricKey: gauge.hystrix.HystrixCommand.serviceA.readAuthors
                metricKey = tokens[0] + "." + tokens[1] + "." + tokens[2] + "." +
                    tokens[3] + "." + tokens[4];

                //check if a known metric is published by
                // 'hystrix-codahale-metrics-publisher' maven library
                //serviceA.readAuthors.countShortCircuited
                //RibbonCommand.readAuthors.countShortCircuited
                knownMetricName = tokens[3] + "." + tokens[4] + "." + tokens[5];
                if (gaugeJsonNode[knownMetricName]) {
                    //metricKey: serviceA.readAuthors
                    metricKey = tokens[3] + "." + tokens[4];
                    _metricsPublisherOn = true;
                }

                config = new HystrixCommandConfig(_hystrixCircuitContainerDivId,
                    metricKey, tokens[3], tokens[4]);
                _hystrixCircuitMap[key] = config;
                _sortCircuitSameAsLast();
            }
        } else {
            tokens = metricName.split(".");
            if (tokens.length == 3) {
                //key: serviceA.readAuthor
                key = tokens[1] + "." + tokens[2];
                if (!_hystrixCircuitMap[key]) {
                    //look for a known metric, e.g.,
                    // metricName: serviceA.readAuthor.countShortCircuited
                    knownMetricName = tokens[1] + "." + tokens[2] +
                        ".countShortCircuited";
                    if (gaugeJsonNode[knownMetricName]) {
                        //metricKey: serviceA.readAuthor
                        metricKey = key;
                        config = new HystrixCommandConfig(
                            _hystrixCircuitContainerDivId,
                            metricKey, tokens[1], tokens[2]);
                        _hystrixCircuitMap[key] = config;
                        _metricsPublisherOn = true;
                        _sortCircuitSameAsLast();
                    }
                }
            }
        }
    }
}

/**
 * Adds a Hystrix thread pool chart by parsing the metric path. Checks only
 * for hystrix metrics and ignores metrics published by
 * 'hystrix-codahale-metrics-publisher' since the doesn't pusblishes all
 * the required metrics to view a threadpool.
 *
 * @param {string} metricName name of metric,
 * e.g., 'gauge.hystrix.HystrixThreadPool.serviceA.currentActiveCount'
 * @private
 */
function _addHystrixThreadPool(metricName) {
    var tokens, key, metricKey, config;

    //metricName: gauge.hystrix.HystrixThreadPool.serviceA.currentActiveCount
    //if (!_metricsPublisherOn &&
    if (metricName.startsWith("gauge.hystrix.HystrixThreadPool")) {
        tokens = metricName.split(".");
        if (tokens.length == 5) {
            //key: serviceA
            key = tokens[3];
            if (!_hystrixThreadpoolMap[key]) {
                //metricKey: gauge.hystrix.HystrixThreadPool.serviceA
                metricKey = tokens[0] + "." + tokens[1] + "."
                    + tokens[2] + "." + tokens[3];

                //check if a known metric is published by
                // 'hystrix-codahale-metrics-publisher' maven library
                //HystrixThreadPool.serviceA.currentActiveCount
                /*                var knownMetricName = "HystrixThreadPool"
                 + "." + tokens[3] + ".currentActiveCount";
                 if (gaugeJsonNode[knownMetricName]) {
                 //metricKey: HystrixThreadPool.serviceA
                 metricKey = "HystrixThreadPool" + "." + tokens[3];
                 _metricsPublisherOn = true;
                 }*/

                config = new HystrixThreadpoolConfig(
                    _hystrixThreadContainerDivId,
                    metricKey, tokens[3]);
                _hystrixThreadpoolMap[key] = config;
                _sortThreadpoolSameAsLast();
            }
        }
    }
    /*else if (metricName.startsWith("HystrixThreadPool")) {
     //metricName: HystrixThreadPool.serviceA.currentActiveCount
     tokens = metricName.split(".");
     _metricsPublisherOn = true;
     if (tokens.length == 3) {
     //key: serviceA
     key = tokens[1];
     if (!_hystrixThreadpoolMap[key]) {
     //metricKey: HystrixThreadPool.serviceA
     metricKey = tokens[0] + "." + tokens[1];
     config = new HystrixThreadpoolConfig(_hystrixThreadContainerDivId,
     metricKey, tokens[3]);
     _hystrixThreadpoolMap[key] = config;
     _metricsPublisherOn = true;
     _sortThreadpoolSameAsLast();
     }
     }
     }*/
}

/**
 * Retrieves a gauge metric value from the given metric name.
 * @param jsonRoot metrics JSON data
 * @param metricName the name of the metric for which the metric value is
 * retrieved
 * @param defaultValue default value of the metric if the metric is missing
 * in the JSON data.
 *
 * @returns the metric value
 * @private
 */
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

/**
 * Roounds a number
 * @param num the mumber to be rounded
 * @returns {string} the rounded number
 * @private
 */
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
 * @private
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