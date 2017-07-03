
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

HV.sortThreadpoolAlphabetically = function () {
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

HV.sortThreadpoolByVolume = function() {
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