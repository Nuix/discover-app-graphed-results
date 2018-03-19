
import 'dc/dc.css';
import './style.css';

const dc = require('dc');
const d3 = dc.d3;
const crossfilter = dc.crossfilter;

const MaxPieSlices = 10;

function getChartType() {
    return Data.activeGraphType === 'line' ? 'line'
        : Data.activeGraphType === 'pie' ? 'pie'
        : Data.activeCountAxis === 'y' ? 'bar' : 'row';
}

function buildChart() {
    switch (getChartType()) {
        case 'line': return dc.lineChart('#graph');
        case 'pie': return dc.pieChart('#graph');
        case 'bar': return dc.barChart('#graph');
        case 'row': return dc.rowChart('#graph');
    }
}

export function renderGraph() {
    if (Data.graphData.length > 10) {
        Data.graphData = Data.graphData.filter(function (rec) {
            return rec.count > 0;
        });
    }
    Data.graphData.sort(function (left, right) {
        return right.count - left.count;
    });

    var chart = buildChart(),
        ndx = crossfilter(Data.graphData),
        valueDim = ndx.dimension(function (d, index) { return index; }),
        valueGroup = valueDim.group().reduceSum(function (d) { return d.count; }),
        formatNumber = d3.format(','),
        rotateXAxisLabels = Data.graphData.length > 8;

    function getLabel(index) {
        return typeof index === 'string' ? index : Data.graphData[index].name;
    }

    Data.chart = chart;
    chart
        .dimension(valueDim)
        .group(valueGroup)
        .title(function (d) {
            return getLabel(d.key) + ": " + formatNumber(d.value) + (d.value === 1 ? " document" : " documents");
        })
        .addFilterHandler(function (filters, index) {
            if (!Data.syncingSelection) {
                Ringtail.FacetSelection.select(Data.activeField, true, [Data.graphData[index].id]);
            }

            filters.push(index);
            return filters;
        })
        .removeFilterHandler(function (filters, index) {
            if (!Data.syncingSelection) {
                Ringtail.FacetSelection.select(Data.activeField, false, [Data.graphData[index].id]);
            }

            filters.splice(filters.indexOf(index), 1);
            return filters;
        });

    if (Data.activeGraphType === 'pie') {
        chart
            .externalRadiusPadding(20)
            .slicesCap(MaxPieSlices)
            .label(function (d) { return getLabel(d.key); })
            .legend(dc.legend()
                .x(20)
                .y(20)
                .gap(5)
                .legendText(function (d) { return getLabel(d.name); }));
    } else {
        if (Data.activeCountAxis === 'y' || Data.activeGraphType === 'line') {
            chart
                .margins({ top: 20, right: 20, bottom: rotateXAxisLabels ? 200 : 30, left: 60 })
                .x(d3.scale.ordinal())
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .elasticY(true)
                .yAxisLabel('Coded Document Count')
                .renderLabel(true)
                .on('pretransition', function (el) {
                    el.selectAll('g.x text')
                        .attr('transform', rotateXAxisLabels ? 'translate(-10,0) rotate(315)' : null)
                        .style('text-anchor', rotateXAxisLabels ? 'end' : 'middle');
                });

            chart.xAxis()
                .tickFormat(function (d) { return getLabel(d); });
        } else {
            chart
                .margins({ top: 20, right: 20, bottom: 50, left: 20 })
                .elasticX(true)
                .label(function (d) { return getLabel(d.key); })
                .on('pretransition', function (el) {
                    if (el._xAxisLabelAppended) {
                        return;
                    }
                    el._xAxisLabelAppended = true;
                    el.select('g.axis').append('text')
                        .attr('class', 'x-axis-label')
                        .attr('text-anchor', 'middle')
                        .attr('x', el.width() / 2 - 10)
                        .attr('y', 40)
                        .text('Coded Document Count');

                });
        }
    }

    handleResize();

    Ringtail.FacetSelection.get(Data.activeField).then(function (selection) {
        updateSelection(selection.values);
    });
    Ringtail.setLoading(false);
}

export function updateSelection(selection) {
    if (!Data.chart) {
        return;
    }
    Data.chart.filter(null);

    if (selection.length > 0) {
       Data.graphData.forEach(function (item, index) {
           if (selection.indexOf(item.id) >= 0) {
               Data.chart.filter(index);
           }
       });
   }
   Data.chart.redraw();
}

function handleResize(printing) {
    var chart = Data.chart,
        width = document.body.clientWidth,
        height = document.body.clientHeight;
    if (!chart) {
        return;
    }

    if (Data.activeGraphType === 'pie') {
        chart.innerRadius((Math.min(width, height) - 20) * 0.2);

        if (width > height) {
            chart
                .cx(width * 0.5 + Math.min(100, (width - height) * 0.5))
                .cy(0);
        } else {
            chart
                .cx(0)
                .cy(height * 0.5 + Math.min(100, (height - width) * 0.5));
        }
    }

    chart
        .transitionDuration(printing === true ? 0 : 350)
        .width(width)
        .height(height)
        .render();
}

window.addEventListener('resize', handleResize);
if (window.matchMedia) {
    var mediaQueryList = window.matchMedia('print');
    mediaQueryList.addListener(function (mql) {
        if (mql.matches) {
            handleResize(true);
        } else {
            handleResize();
        }
    });
}
