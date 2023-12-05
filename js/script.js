window.addEventListener("load", setDefaultView);

function setDefaultView() {
    var defaultYear = "2022_23"; // Setting default year to 2022-23
    updateChartForYear(defaultYear); // Function call to update chart with default year
}

function updateChart() {
    // Get the selected year from the dropdown
    var selectedYear = document.getElementById("yearDropdown").value;
    console.log(selectedYear);

    // Function call to update the chart based on the selected year
    updateChartForYear(selectedYear);
}

function convertToInt(node) {
    if (node.value !== undefined && !isNaN(node.value)) {
        console.log(typeof node.value);
        node.value = parseInt(node.value);
    }
    if (node.children) {
        node.children.forEach(convertToInt);
    }
}

function updateChartForYear(selectedYear) {
    document.getElementById('myDiv').innerHTML = '';
    document.getElementById('myLegend').innerHTML = '';

    var fileName = `./data/data_${selectedYear}.json`;

    // Loading the json file using d3
    d3.json(fileName, d => {
        return {
            children: d.children
        }
    }).then(function (data) {
        // Printing the data
        console.log(data);

        // Check to verify if the value is number, if not parse to integer format
        convertToInt(data);

        // Define height, width and margin
        var margin = { top: 10, right: 10, bottom: 10, left: 10 };
        var width = 600 - margin.left - margin.right;
        var height = 600 - margin.top - margin.bottom;

        // Create svg element with the chosen height and width
        var svg = d3.select("#myDiv")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var partition = d3.partition()
            .size([2 * Math.PI, width / 2]);

        var root = d3.hierarchy(data)
            .sum(function (d) { return d.value; });

        partition(root);

        // Assign colors to nodes based on the color attribute in the data
        function assignColor(d) {
            if (d.data.color) {
                return d.data.color;
            } else if (d.parent) {
                return assignColor(d.parent);
            } else {
                return '#faf0e6';
            }
        }

        // Drawing arcs for each node in hierarchy
        var arc = d3.arc()
            .startAngle(function (d) { return d.x0; })
            .endAngle(function (d) { return d.x1; })
            .innerRadius(function (d) { return d.y0; })
            .outerRadius(function (d) { return d.y1; });

        svg.selectAll("path")
            .data(root.descendants())
            .enter().append("path")
            .attr("d", arc)
            .attr("fill", function (d) {
                return assignColor(d);
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);

        // Chart labels
        var labels = svg.selectAll("text")
            .data(root.descendants())
            .enter().append("text")
            .attr("transform", function (d, i) {
                const radius = Math.min(d.y0, d.y1);
                const angle = (d.x0 + d.x1) / 2;
                const x = Math.sin(angle) * (radius + 30);
                const y = -Math.cos(angle) * (radius + 30);
                if (i === 0) {
                    return `(${x},${y})`;
                }
                else {
                    return `translate(${x},${y}) rotate(${angle * (180 / Math.PI)})`
                };
            })
            .attr("font-weight", function (d, i) {
                return i === 0 ? "bold" : "normal";
            })
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#000")
            // .text(function (d, i) {
            //     if (i === 0) {
            //         return `For the year: ${selectedYear}`;
            //     } else if (d.data.name === "Didnot Seek Help") {
            //         return d.data.name.split("\n");
            //     } else { return d.data.name; }
            // });
            .each(function (d, i) {
                var labelLines = [];
                if (i === 0) {
                    labelLines.push(`For the year: ${selectedYear}`);
                } else if (d.data.name === "Didnot Seek Help") {
                    labelLines = d.data.name.split(" ");
                } else {
                    labelLines.push(d.data.name);
                }

                // Calculate total height for multiline text
                var totalHeight = labelLines.length * 1.2;

                // Add tspan elements for multiline text
                for (var j = 0; j < labelLines.length; j++) {
                    d3.select(this).append("tspan")
                        .attr("x", 0)
                        .attr("y", -totalHeight / 2 + j * 1.2 + "em") // Align text to center vertically
                        .attr("text-anchor", "middle") // Align text to center horizontally
                        .text(labelLines[j]);
                }
            });

        // Define legend data
        var legendData = [
            { label: 'Male', color: '#a64d79' },
            { label: 'Male, Perceived Normal', color: '#c27ba0' },
            { label: 'Male, Not Perceived Normal', color: '#c27ba0' },
            { label: 'Male, Perceived Normal, Didnot Seek Help', color: '#e36899' },
            { label: 'Male, Not Perceived Normal, Didnot Seek Help', color: '#e36899' },
            { label: 'Male, Perceived Normal, Sought Help', color: '#ead1dc' },
            { label: 'Male, Not Perceived Normal, Sought Help', color: '#ead1dc' },

            { label: 'Female', color: '#45818e' },
            { label: 'Female, Perceived Normal', color: '#76a5af' },
            { label: 'Female, Not Perceived Normal', color: '#76a5af' },
            { label: 'Female, Perceived Normal, Didnot Seek Help', color: '#4ee6e6' },
            { label: 'Female, Not Perceived Normal, Didnot Seek Help', color: '#4ee6e6' },
            { label: 'Female, Perceived Normal, Sought Help', color: '#d0e0e3' },
            { label: 'Female, Not Perceived Normal, Sought Help', color: '#d0e0e3' },
        ];

        // Calculate legend dimensions and positioning
        var legendWidth = 1000;
        var legendHeight = legendData.length * 25;
        var legendX = 10; // X position of the legend
        var legendY = 10; // Y position of the legend

        // Create legend SVG container
        var legendSvg = d3.select("#myLegend")
            .append("svg")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .append("g")
            .attr("transform", "translate(" + legendX + "," + legendY + ")");

        // Add legend items
        var legendItems = legendSvg.selectAll('.legend-item')
            .data(legendData)
            .enter().append('g')
            .attr('class', 'legend-item')
            .attr('transform', function (d, i) {
                return 'translate(0,' + (i * 20) + ')';
            });

        legendItems.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', function (d) { return d.color; });

        legendItems.append('text')
            .attr('x', 20)
            .attr('y', 10)
            .text(function (d) { return d.label; })
            .attr('font-size', '12px')
            .attr('fill', '#000');

    }).catch(function (error) {
        console.log(error);
    });

}