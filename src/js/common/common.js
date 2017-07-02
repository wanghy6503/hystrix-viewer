
/**
 * Creates a Hystrix dashboard, It displays the the following:
 * <li>
 *     <ol>Hystrix Circuit</ol>
 *     <ol>Hystrix Thread</ol>
 *     </li>
 * @param {string} divId divId the id of the HTML division tag where the Hystrix dashboard will be displayed
 */
HV.addHystrixDashboard = function (divId) {
    _hystrixDashboardDivId = divId;

    var $headerDiv = $("<div></div>").attr('id', 'hystrix-header')
        .html("<h2><span id='title_name'>Hystrix</span></h2>");
    $(_hystrixDashboardDivId).append($headerDiv);

    var $containerDiv = $("<div></div>").addClass('hystrix-container');
    $(_hystrixDashboardDivId).append($containerDiv);

    _createHystrixCircuitArea($containerDiv);

    var $spacerDiv = $("<div></div>").addClass("spacer");
    $($containerDiv).append($spacerDiv);

    _createHystrixThreadPoolArea($containerDiv);
};

HV.init = function () {

};

/**
 * Refreshes the metric view with new data. Each metric is cashed up to the 100 metric points. Older metrics are
 * removed once it reaches the threshold.
 *
 * @param {string} json the metric data in json format
 */
HV.refresh = function (json) {
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
HV.clear = function () {
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
    var $row1Div = $("<div></div>").addClass('row');
    $(containerDiv).append($row1Div);
    var $menuBar1Div = $("<div></div>").addClass('hystrix-menubar');
    $($row1Div).append($menuBar1Div);
    var $circuitTitleDiv = $("<div></div>").addClass('title').text("Circuit");
    $($menuBar1Div).append($circuitTitleDiv);

    var menuActionsHtml = "Sort: " +
        "<a href=\"javascript://\" onclick=\"HV.sortByErrorThenVolume();\">Error then Volume</a> | " +
        "<a href=\"javascript://\" onclick=\"HV.sortAlphabetically();\">Alphabetical</a> | " +
        "<a href=\"javascript://\" onclick=\"HV.sortByVolume();\">Volume</a> | " +
        "<a href=\"javascript://\" onclick=\"HV.sortByError();\">Error</a> | " +
        "<a href=\"javascript://\" onclick=\"HV.sortByLatencyMean();\">Mean</a> | " +
        "<a href=\"javascript://\" onclick=\"HV.sortByLatencyMedian();\">Median</a> | " +
        "<a href=\"javascript://\" onclick=\"HV.sortByLatency90();\">90</a> | " +
        "<a href=\"javascript://\" onclick=\"HV.sortByLatency99();\">99</a> | " +
        "<a href=\"javascript://\" onclick=\"HV.sortByLatency995();\">99.5</a> ";
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
        .addClass('row').addClass('dependencies');
    $(containerDiv).append($circuitContainerDiv);
}

function _createHystrixThreadPoolArea(containerDiv) {
    var $row2Div = $("<div></div>").addClass('row');
    $(containerDiv).append($row2Div);
    var $menuBar2Div = $("<div></div>").addClass('hystrix-menubar');
    $($row2Div).append($menuBar2Div);
    var $threadTitleDiv = $("<div></div>").addClass('title').text("Thread Pools");
    $($menuBar2Div).append($threadTitleDiv);

    var menuActionsHtml = "Sort: " +
        "<a href=\"javascript://\" onclick=\"HV.sortThreadpoolAlphabetically();\">Alphabetical</a> | " +
        "<a href=\"javascript://\" onclick=\"HV.sortThreadpoolByVolume();\">Volume</a>";
    var $menuActions = $("<div></div>").addClass('menu_actions').html(menuActionsHtml);
    $($menuBar2Div).append($menuActions);

    _hystrixThreadContainerDivId = "dependencyThreadPools";
    var $threadContainerDiv = $("<div></div>").attr('id', _hystrixThreadContainerDivId)
        .addClass('row').addClass('dependencyThreadPools');
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