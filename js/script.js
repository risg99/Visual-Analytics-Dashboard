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
        var width = 600;
        var height = 600;
        var margin = { top: 20, right: 20, bottom: 20, left: 20 };

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
            .text(function (d, i) { if (i === 0) { return `For the year: ${selectedYear}`; } else { return d.data.name; } })
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#000");

    }).catch(function (error) {
        console.log(error);
    });

}