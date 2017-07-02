
var maxDomain = 2000;
Object.freeze(maxDomain);

var threadPoolCircleRadius = d3.scalePow().exponent(0.5).domain([0, maxDomain]).range(["5", maxRadiusForCircle]); // requests per second per host
var threadPoolCircleYaxis = d3.scaleLinear().domain([0, maxDomain]).range(["30%", maxXaxisForCircle]);
var threadPoolCircleXaxis = d3.scaleLinear().domain([0, maxDomain]).range(["30%", maxYaxisForCircle]);
var threadPoolColorRange = d3.scaleLinear().domain([10, 25, 40, 50]).range(["green", "#FFCC00", "#FF9900", "red"]);
var threadPoolErrorPercentageColorRange = d3.scaleLinear().domain([0, 10, 35, 50]).range(["grey", "black", "#FF9900", "red"]);

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

    this.refresh = function update(jsonData) {
        this.preProcessData(jsonData);
        this.render();
        this.updateCircle();
        this.updateData();
    };

    this.render = function render() {
        if (!this.initialized) {
            var $threadDiv = $("<div></div>").attr('id', this.threadDivId)
                .addClass('monitor').css({'position': 'relative'});
            $("#" + this.parentDivId).append($threadDiv);

            this.addChart($threadDiv);
            this.addTitle($threadDiv);
            this.addData($threadDiv);

            this.initialized = true;
        }
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
            .attr('id', this.chartDivId + "_monitor_data")
            .addClass('monitor_data');
        $monitorDiv.append($monitorDataDiv);
    };

    this.updateData = function updateData() {
        if (this.initialized) {
            var $monitorDataDiv = $("#" + this.chartDivId + "_monitor_data");
            $monitorDataDiv.empty();
            var $spacerDiv = $("<div></div>").addClass("spacer");
            $monitorDataDiv.append($spacerDiv);

            this.addRate($monitorDataDiv);
            this.addDataTable($monitorDataDiv);
        }
    };

    this.addRate = function addRate(monitorDataDiv) {
        var ratePerSecondPerHostHtml = "<a href=\"javascript://\" title=\"Total Execution Rate per Second per Reporting Host\""
            + "class=\"hystrix-tooltip rate\">"
            + "<span class=\"smaller\">Host: </span>"
            + "<span class=\"ratePerSecondPerHost\">"
            + this.data["ratePerSecondPerHost"] + "</span>/s</a>";

        var $rate1Div = $("<div></div>").addClass("rate")
            .html(ratePerSecondPerHostHtml);
        monitorDataDiv.append($rate1Div);

        var ratePerSecondPerClusterHtml = "<a href=\"javascript://\" title=\"Total Execution Rate per Second for Cluster\""
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
            "<div class=\"cell header left\">Active</div>" +
            "<div class=\"cell data left\">" + this.data["currentActiveCount"] + " </div>" +
            "<div class=\"cell header right\">Max Active</div>" +
            "<div class=\"cell data right\">" + this.data["rollingMaxActiveThreads"] + "</div></div>");
        monitorDataDiv.append($monitorRow1Div);

        var $monitorRow2Div = $("<div class=\"tableRow\">" +
            "<div class=\"cell header left\">Queued</div>" +
            "<div class=\"cell data left\"><span class=\"value\">" + this.data["currentQueueSize"] + "</span>ms </div>" +
            "<div class=\"cell header right\">Executions</div>" +
            "<div class=\"cell data right\"><span class=\"value\">" + this.data["rollingCountThreadsExecuted"] + "</span>ms </div></div>");
        monitorDataDiv.append($monitorRow2Div);

        var $monitorRow3Div = $("<div class=\"tableRow\">" +
            "<div class=\"cell header left\">Pool Size</div>" +
            "<div class=\"cell data left\"><span class=\"value\">" + this.data["currentPoolSize"] + "</span>ms</div>" +
            "<div class=\"cell header right\">Queue Size</div>" +
            "<div class=\"cell data right\"><span class=\"value\">" + this.data["propertyValue_queueSizeRejectionThreshold"] + "</span>ms</div></div>");
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
