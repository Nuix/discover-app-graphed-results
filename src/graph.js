
import 'dc/dc.css';
import './style.css';

const dc = require('dc');
const d3 = dc.d3;
const crossfilter = dc.crossfilter;

const MaxPieSlices = 10;

function buildChart(parentEl) {
    switch (this.activeGraphType) {
        case 'line': return dc.lineChart(parentEl);
        case 'pie': return dc.pieChart(parentEl);
        case 'row': return dc.rowChart(parentEl);
        case 'bar': return dc.barChart(parentEl);
    }
}

export function renderGraph() {
    const me = this;

    if (me.graphData.length > 10) {
        me.graphData = me.graphData.filter(function (rec) {
            return rec.count > 0;
        });
    }
    me.graphData.sort(function (left, right) {
        return right.count - left.count;
    });

    this.graphEl = this.parentEl.find('.graph')[0];
    var chart = buildChart.call(this, this.graphEl),
        ndx = crossfilter(me.graphData),
        valueDim = ndx.dimension(function (d, index) { return index; }),
        valueGroup = valueDim.group().reduceSum(function (d) { return d.count; }),
        formatNumber = d3.format(','),
        rotateXAxisLabels = me.graphData.length > 8;

    function getLabel(index) {
        return typeof index === 'string' ? index : me.graphData[index].name;
    }

    me.chart = chart;
    chart
        .dimension(valueDim)
        .group(valueGroup)
        .title(function (d) {
            return getLabel(d.key) + ": " + formatNumber(d.value) + (d.value === 1 ? " document" : " documents");
        })
        .addFilterHandler(function (filters, index) {
            if (!me.syncingSelection) {
                Ringtail.BrowseSelection.select(me.activeField, true, [me.graphData[index].id]);
            }

            filters.push(index);
            return filters;
        })
        .removeFilterHandler(function (filters, index) {
            if (!me.syncingSelection) {
                Ringtail.BrowseSelection.select(me.activeField, false, [me.graphData[index].id]);
            }

            filters.splice(filters.indexOf(index), 1);
            return filters;
        });

    if (me.activeGraphType === 'pie') {
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
        if (me.activeGraphType === 'bar' || me.activeGraphType === 'line') {
            chart
                .margins({ top: 20, right: 20, bottom: rotateXAxisLabels ? 200 : 30, left: 60 })
                .x(d3.scale.ordinal())
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .elasticY(true)
                .yAxisLabel('Coded Document Count', 16)
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

    handleResize.call(me);

    Ringtail.BrowseSelection.get(me.activeField).then(function (selection) {
        updateSelection.call(me, selection.values);
    });
}

export function updateSelection(selection) {
    const me = this;
    if (!me.chart) {
        return;
    }
    me.chart.filter(null);

    if (selection.length > 0) {
       me.graphData.forEach(function (item, index) {
           if (selection.indexOf(item.id) >= 0) {
               me.chart.filter(index);
           }
       });
   }
   me.chart.redraw();
}

export function handleResize(printing) {
    var chart = this.chart,
        width = this.graphEl.clientWidth,
        height = this.graphEl.clientHeight;
    if (!chart) {
        return;
    }

    if (this.activeGraphType === 'pie') {
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
